import type { HttpContext } from '@adonisjs/core/http'
import Plan from '#models/plan'
import Invoice from '#models/invoice'
import Subscription from '#models/subscription'
import Tenant from '#models/tenant'
import BillingPolicy from '#policies/billing_policy'
import BillingService, {
  CheckoutError,
  type CheckoutInput,
} from '#services/billing/billing_service'
import EntitlementService from '#services/entitlement_service'
import centrifugo from '#services/realtime/centrifugo_service'
import { checkoutValidator } from '#validators/billing'

export default class BillingController {
  /** Public plan catalog for the pricing/upgrade screen. */
  async plans({ bouncer, response }: HttpContext) {
    await bouncer.with(BillingPolicy).authorize('view')
    const plans = await Plan.query().where('is_active', true).orderBy('sort', 'asc')
    return response.ok(plans)
  }

  /** Current subscription + resolved entitlements + credit balance. */
  async subscription({ bouncer, auth, response }: HttpContext) {
    await bouncer.with(BillingPolicy).authorize('view')

    // Platform admins (and any tenant-less session) have no billing subscription.
    const tenant = auth.user!.tenantId ? await Tenant.find(auth.user!.tenantId) : null
    if (!tenant) {
      return response.ok({
        plan: null,
        status: null,
        trialEndsAt: null,
        aiCredits: 0,
        subscription: null,
        features: null,
        noTenant: true,
      })
    }

    const subscription = await Subscription.query().preload('plan').first()
    const features = await EntitlementService.featuresFor(tenant)

    return response.ok({
      plan: tenant.plan,
      status: tenant.status,
      trialEndsAt: tenant.trialEndsAt,
      aiCredits: tenant.aiCredits,
      subscription,
      features,
    })
  }

  /** Create a checkout invoice and return its provider checkout URL. */
  async checkout({ bouncer, auth, request, response }: HttpContext) {
    await bouncer.with(BillingPolicy).authorize('manage')
    const payload = await request.validateUsing(checkoutValidator)

    let input: CheckoutInput
    if (payload.type === 'subscription') {
      if (!payload.planCode) return response.badRequest({ message: 'planCode is required.' })
      input = { type: 'subscription', planCode: payload.planCode }
    } else if (payload.type === 'channel_slot') {
      if (!payload.channelType) return response.badRequest({ message: 'channelType is required.' })
      input = {
        type: 'channel_slot',
        channelType: payload.channelType,
        quantity: payload.quantity ?? 1,
      }
    } else {
      input = { type: 'ai_credits', quantity: payload.quantity ?? 1 }
    }

    const tenant = auth.user!.tenantId ? await Tenant.find(auth.user!.tenantId) : null
    if (!tenant) {
      return response.badRequest({ message: 'This account is not linked to a billable tenant.' })
    }
    try {
      const invoice = await BillingService.checkout(tenant, auth.user!, input)
      return response.created({
        id: invoice.id,
        number: invoice.number,
        amount: invoice.amount,
        currency: invoice.currency,
        status: invoice.status,
        checkoutUrl: invoice.checkoutUrl,
      })
    } catch (error) {
      if (error instanceof CheckoutError) return response.badRequest({ message: error.message })
      throw error
    }
  }

  async invoices({ bouncer, response }: HttpContext) {
    await bouncer.with(BillingPolicy).authorize('view')
    const invoices = await Invoice.query().orderBy('created_at', 'desc').limit(50)
    return response.ok(invoices)
  }

  /** Invoice detail + a realtime subscription token for live status updates. */
  async showInvoice({ bouncer, auth, params, response }: HttpContext) {
    await bouncer.with(BillingPolicy).authorize('view')
    const invoice = await Invoice.findOrFail(params.id)
    const channel = centrifugo.billingInvoiceChannel(invoice.tenantId, invoice.id)
    return response.ok({
      invoice,
      realtime: {
        channel,
        subscriptionToken: centrifugo.subscriptionToken(auth.user!.id, channel),
      },
    })
  }
}
