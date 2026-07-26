import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Tenant from '#models/tenant'
import Plan from '#models/plan'
import SubscriptionAddon from '#models/subscription_addon'
import TenantContext from '#services/tenant_context'
import EntitlementService from '#services/entitlement_service'

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
      features: {
        channels: { telegram: 10, whatsapp_waha: 1 },
        aiCredits: 10000,
      },
    }
  )
}

test.group('Entitlement engine', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('channelLimitFor reads plan features from the catalog', async ({ assert }) => {
    await seedProPlan()
    const tenant = await Tenant.create({
      name: 'Pro Co',
      slug: `pro-${Math.random().toString(36).slice(2, 8)}`,
      status: 'active',
      plan: 'pro',
    })

    await TenantContext.run(tenant.id, async () => {
      assert.equal(await EntitlementService.channelLimitFor(tenant, 'telegram'), 10)
      assert.equal(await EntitlementService.channelLimitFor(tenant, 'whatsapp_waha'), 1)
    })
  })

  test('channel_slot add-ons raise the effective limit', async ({ assert }) => {
    await seedProPlan()
    const tenant = await Tenant.create({
      name: 'Addon Co',
      slug: `add-${Math.random().toString(36).slice(2, 8)}`,
      status: 'active',
      plan: 'pro',
    })

    await TenantContext.run(tenant.id, async () => {
      await SubscriptionAddon.create({
        tenantId: tenant.id,
        type: 'channel_slot',
        quantity: 3,
        meta: { channelType: 'telegram' },
      })
      assert.equal(await EntitlementService.channelLimitFor(tenant, 'telegram'), 13)
      // A slot for a different channel type doesn't affect this one.
      assert.equal(await EntitlementService.channelLimitFor(tenant, 'whatsapp_waha'), 1)
    })
  })

  test('falls back to the static catalog when the plan is not seeded', async ({ assert }) => {
    const tenant = await Tenant.create({
      name: 'Free Co',
      slug: `free-${Math.random().toString(36).slice(2, 8)}`,
      status: 'active',
      plan: 'free',
    })
    await TenantContext.run(tenant.id, async () => {
      // No Plan rows seeded → uses PLAN_CHANNEL_LIMITS fallback.
      assert.equal(await EntitlementService.channelLimitFor(tenant, 'messenger'), 1)
      assert.equal(await EntitlementService.channelLimitFor(tenant, 'whatsapp_waha'), 0)
    })
  })
})
