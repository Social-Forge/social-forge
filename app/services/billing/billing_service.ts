import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import env from '#start/env'
import billingConfig from '#config/billing'
import Plan from '#models/plan'
import Invoice, { type InvoicePurpose } from '#models/invoice'
import Subscription from '#models/subscription'
import SubscriptionAddon from '#models/subscription_addon'
import Tenant from '#models/tenant'
import type User from '#models/user'
import AiCreditService from '#services/ai/ai_credit_service'
import { paymentGateway } from '#services/billing/gateway'
import type { ChannelType } from '#services/messaging/constants'

export type CheckoutInput =
  | { type: 'subscription'; planCode: string }
  | { type: 'channel_slot'; channelType: ChannelType; quantity: number }
  | { type: 'ai_credits'; quantity: number } // quantity = number of 1,000-credit packs

export class CheckoutError extends Error {}

/**
 * Orchestrates the commercial flow: turns a checkout request into a pending
 * invoice with a provider checkout URL, and applies the entitlement changes when
 * the invoice is paid (called from the gateway webhook). Both paths are
 * tenant-scoped by their callers.
 */
export default class BillingService {
  /** Create a pending invoice + provider checkout session. */
  static async checkout(tenant: Tenant, user: User, input: CheckoutInput): Promise<Invoice> {
    const gateway = paymentGateway()

    const { amount, description, purpose } = await this.#priceCheckout(input)
    if (amount <= 0) throw new CheckoutError('Nothing to charge for this checkout.')

    const number = `SF-${randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()}`
    const invoice = await Invoice.create({
      tenantId: tenant.id,
      number,
      status: 'pending',
      amount,
      currency: 'IDR',
      description,
      purpose,
      provider: gateway.id,
      expiresAt: DateTime.now().plus({ hours: billingConfig.invoiceTtlHours }),
    })

    const appUrl = env.get('APP_URL', 'http://localhost:3333')
    const created = await gateway.createInvoice({
      externalId: invoice.number,
      amount,
      currency: 'IDR',
      description,
      payerEmail: user.email,
      successUrl: `${appUrl}/app/billing/invoices/${invoice.id}`,
      failureUrl: `${appUrl}/app/billing/invoices/${invoice.id}`,
    })

    invoice.providerInvoiceId = created.providerInvoiceId
    invoice.checkoutUrl = created.checkoutUrl
    await invoice.save()

    return invoice
  }

  /**
   * Apply a paid invoice's purpose to the tenant (idempotent). Caller must run
   * this inside `TenantContext.run(invoice.tenantId, …)`.
   */
  static async activateInvoice(invoice: Invoice): Promise<void> {
    if (invoice.status === 'paid') return

    invoice.status = 'paid'
    invoice.paidAt = DateTime.now()
    await invoice.save()

    const purpose = invoice.purposeConfig
    if (!purpose) return

    if (purpose.type === 'subscription') {
      await this.#activateSubscription(invoice.tenantId, purpose.planCode)
    } else if (purpose.addon === 'channel_slot') {
      await SubscriptionAddon.create({
        tenantId: invoice.tenantId,
        type: 'channel_slot',
        quantity: purpose.quantity,
        meta: { channelType: purpose.channelType },
      })
    } else if (purpose.addon === 'ai_credits') {
      await AiCreditService.grant(invoice.tenantId, purpose.quantity, 'topup')
    }
  }

  static async #activateSubscription(tenantId: string, planCode: string): Promise<void> {
    const plan = await Plan.findBy('code', planCode)
    if (!plan) return

    const now = DateTime.now()
    const periodEnd = now.plus({ days: billingConfig.periodDays })

    const tenant = await Tenant.find(tenantId)
    if (tenant) {
      tenant.plan = plan.code
      tenant.status = 'active'
      await tenant.save()
    }

    const subscription = await Subscription.findBy('tenant_id', tenantId)
    if (subscription) {
      subscription.planId = plan.id
      subscription.status = 'active'
      subscription.currentPeriodStart = now
      subscription.currentPeriodEnd = periodEnd
      subscription.cancelAtPeriodEnd = false
      await subscription.save()
    } else {
      await Subscription.create({
        tenantId,
        planId: plan.id,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      })
    }

    // Grant this period's bundled AI credits.
    const credits = plan.featuresConfig.aiCredits ?? 0
    if (credits > 0) await AiCreditService.grant(tenantId, credits, 'grant')
  }

  static async #priceCheckout(
    input: CheckoutInput
  ): Promise<{ amount: number; description: string; purpose: InvoicePurpose }> {
    if (input.type === 'subscription') {
      const plan = await Plan.findBy('code', input.planCode)
      if (!plan) throw new CheckoutError(`Unknown plan "${input.planCode}".`)
      return {
        amount: plan.price,
        description: `Upgrade to ${plan.name}`,
        purpose: { type: 'subscription', planCode: plan.code },
      }
    }

    if (input.type === 'channel_slot') {
      const qty = Math.max(1, input.quantity)
      return {
        amount: billingConfig.addons.channelSlot * qty,
        description: `${qty} extra ${input.channelType} channel slot(s)`,
        purpose: {
          type: 'addon',
          addon: 'channel_slot',
          channelType: input.channelType,
          quantity: qty,
        },
      }
    }

    // ai_credits
    const packs = Math.max(1, input.quantity)
    const credits = packs * 1000
    return {
      amount: billingConfig.addons.aiCreditsPer1000 * packs,
      description: `${credits.toLocaleString()} AI credits`,
      purpose: { type: 'addon', addon: 'ai_credits', quantity: credits },
    }
  }
}
