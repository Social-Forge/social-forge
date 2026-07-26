import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Tenant from '#models/tenant'
import Plan from '#models/plan'
import Invoice from '#models/invoice'
import Subscription from '#models/subscription'
import AiCreditLedger from '#models/ai_credit_ledger'
import TenantContext from '#services/tenant_context'
import BillingService from '#services/billing/billing_service'
import XenditProvider from '#services/billing/xendit_provider'
import { paymentGateway } from '#services/billing/gateway'
import type User from '#models/user'

async function seedProPlan() {
  return Plan.updateOrCreate(
    { code: 'pro' },
    {
      code: 'pro',
      name: 'Pro',
      price: 149000,
      currency: 'IDR',
      interval: 'month',
      isActive: true,
      sort: 1,
      features: { channels: { telegram: 10 }, aiCredits: 10000 },
    }
  )
}

async function seedTenant(plan = 'free', aiCredits = 0) {
  return Tenant.create({
    name: 'Bill Co',
    slug: `bill-${Math.random().toString(36).slice(2, 8)}`,
    status: 'trial',
    plan,
    aiCredits,
  })
}

test.group('Billing checkout', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => {
    const gw = paymentGateway()
    const orig = gw.createInvoice
    // Stub the provider so no real Xendit HTTP call is made.
    gw.createInvoice = async (input) => ({
      providerInvoiceId: `pinv_${input.externalId}`,
      checkoutUrl: 'https://pay.example/checkout',
      status: 'PENDING',
    })
    return () => {
      gw.createInvoice = orig
    }
  })

  test('creates a pending invoice with a checkout URL for a subscription upgrade', async ({
    assert,
  }) => {
    await seedProPlan()
    const tenant = await seedTenant()
    const user = { email: 'owner@bill.test' } as User

    const invoice = await TenantContext.run(tenant.id, () =>
      BillingService.checkout(tenant, user, { type: 'subscription', planCode: 'pro' })
    )

    assert.equal(invoice.amount, 149000)
    assert.equal(invoice.status, 'pending')
    assert.equal(invoice.checkoutUrl, 'https://pay.example/checkout')
    assert.match(invoice.number, /^SF-/)
    assert.equal((invoice.purpose as any).type, 'subscription')
  })
})

test.group('Billing activation', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('paying a subscription invoice upgrades the plan and grants credits', async ({ assert }) => {
    const plan = await seedProPlan()
    const tenant = await seedTenant('free', 0)

    await TenantContext.run(tenant.id, async () => {
      const invoice = await Invoice.create({
        tenantId: tenant.id,
        number: 'SF-TEST01',
        status: 'pending',
        amount: 149000,
        currency: 'IDR',
        description: 'Upgrade to Pro',
        purpose: { type: 'subscription', planCode: 'pro' },
        provider: 'xendit',
      })

      await BillingService.activateInvoice(invoice)

      const freshInvoice = await Invoice.findOrFail(invoice.id)
      assert.equal(freshInvoice.status, 'paid')
      assert.isNotNull(freshInvoice.paidAt)

      const freshTenant = await Tenant.findOrFail(tenant.id)
      assert.equal(freshTenant.plan, 'pro')
      assert.equal(freshTenant.status, 'active')
      assert.equal(freshTenant.aiCredits, 10000)

      const subscription = await Subscription.findBy('tenant_id', tenant.id)
      assert.isNotNull(subscription)
      assert.equal(subscription!.status, 'active')
      assert.equal(subscription!.planId, plan.id)
    })
  })

  test('activation is idempotent (double webhook does not double-grant)', async ({ assert }) => {
    await seedProPlan()
    const tenant = await seedTenant('free', 0)

    await TenantContext.run(tenant.id, async () => {
      const invoice = await Invoice.create({
        tenantId: tenant.id,
        number: 'SF-TEST02',
        status: 'pending',
        amount: 149000,
        currency: 'IDR',
        description: 'Upgrade to Pro',
        purpose: { type: 'subscription', planCode: 'pro' },
        provider: 'xendit',
      })

      await BillingService.activateInvoice(invoice)
      await BillingService.activateInvoice(invoice) // second delivery — no-op

      const freshTenant = await Tenant.findOrFail(tenant.id)
      assert.equal(freshTenant.aiCredits, 10000) // granted once, not twice
    })
  })

  test('paying an ai_credits add-on tops up the balance', async ({ assert }) => {
    const tenant = await seedTenant('pro', 500)

    await TenantContext.run(tenant.id, async () => {
      const invoice = await Invoice.create({
        tenantId: tenant.id,
        number: 'SF-TEST03',
        status: 'pending',
        amount: 25000,
        currency: 'IDR',
        description: '1,000 AI credits',
        purpose: { type: 'addon', addon: 'ai_credits', quantity: 1000 },
        provider: 'xendit',
      })

      await BillingService.activateInvoice(invoice)

      const freshTenant = await Tenant.findOrFail(tenant.id)
      assert.equal(freshTenant.aiCredits, 1500)
      const topups = await AiCreditLedger.query().where('reason', 'topup')
      assert.lengthOf(topups, 1)
    })
  })
})

test.group('Xendit webhook parsing', () => {
  test('maps provider statuses and requires external_id', ({ assert }) => {
    const provider = new XenditProvider()

    const paid = provider.parseWebhook({ external_id: 'SF-1', status: 'PAID', id: 'inv_1' })
    assert.deepEqual(paid, {
      externalId: 'SF-1',
      status: 'paid',
      providerInvoiceId: 'inv_1',
      eventId: 'inv_1:paid',
    })

    assert.equal(
      provider.parseWebhook({ external_id: 'SF-2', status: 'EXPIRED' })?.status,
      'expired'
    )
    assert.isNull(provider.parseWebhook({ status: 'PAID' }))
    assert.isNull(provider.parseWebhook({ external_id: 'SF-3', status: 'WHATEVER' }))
  })

  test('rejects webhooks when no callback token is configured', ({ assert }) => {
    const provider = new XenditProvider()
    // XENDIT_WEBHOOK_TOKEN is empty in test env → always unverified.
    assert.isFalse(provider.verifyWebhook({ 'x-callback-token': 'anything' }))
  })
})
