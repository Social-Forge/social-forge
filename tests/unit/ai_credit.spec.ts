import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Tenant from '#models/tenant'
import AiCreditLedger from '#models/ai_credit_ledger'
import TenantContext from '#services/tenant_context'
import AiCreditService from '#services/ai/ai_credit_service'

test.group('AI credit normalization', () => {
  test('creditsFor rounds provider cost up to whole credits', ({ assert }) => {
    // Haiku ($1/$5 per 1M): 500 in + 200 out = $0.0015 → 2 credits.
    assert.equal(
      AiCreditService.creditsFor('claude-haiku-4-5', { inputTokens: 500, outputTokens: 200 }),
      2
    )
    // Opus ($5/$25 per 1M): 1000 in + 1000 out = $0.03 → 30 credits.
    assert.equal(
      AiCreditService.creditsFor('claude-opus-4-8', { inputTokens: 1000, outputTokens: 1000 }),
      30
    )
  })

  test('any spend costs at least 1 credit', ({ assert }) => {
    assert.equal(
      AiCreditService.creditsFor('claude-haiku-4-5', { inputTokens: 1, outputTokens: 0 }),
      1
    )
    assert.equal(
      AiCreditService.creditsFor('claude-haiku-4-5', { inputTokens: 0, outputTokens: 0 }),
      0
    )
  })
})

test.group('AI credit ledger', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function seedTenant(credits: number) {
    return Tenant.create({
      name: 'Credit Co',
      slug: `cc-${Math.random().toString(36).slice(2, 8)}`,
      status: 'active',
      plan: 'pro',
      aiCredits: credits,
    })
  }

  test('debit decrements balance and writes an audit row', async ({ assert }) => {
    const tenant = await seedTenant(100)

    await TenantContext.run(tenant.id, async () => {
      const { credits, balanceAfter } = await AiCreditService.debit({
        tenantId: tenant.id,
        model: 'claude-opus-4-8',
        usage: { inputTokens: 1000, outputTokens: 1000 },
      })
      assert.equal(credits, 30)
      assert.equal(balanceAfter, 70)

      const fresh = await Tenant.findOrFail(tenant.id)
      assert.equal(fresh.aiCredits, 70)

      const entries = await AiCreditLedger.query().where('tenant_id', tenant.id)
      assert.lengthOf(entries, 1)
      assert.equal(entries[0].delta, -30)
      assert.equal(entries[0].balanceAfter, 70)
      assert.equal(entries[0].reason, 'debit')
    })
  })

  test('grant increases balance and records the movement', async ({ assert }) => {
    const tenant = await seedTenant(10)

    await TenantContext.run(tenant.id, async () => {
      const balance = await AiCreditService.grant(tenant.id, 500, 'topup')
      assert.equal(balance, 510)

      const fresh = await Tenant.findOrFail(tenant.id)
      assert.equal(fresh.aiCredits, 510)

      const entries = await AiCreditLedger.query().where('reason', 'topup')
      assert.lengthOf(entries, 1)
      assert.equal(entries[0].delta, 500)
    })
  })

  test('hasCredits reflects the balance', async ({ assert }) => {
    const empty = await seedTenant(0)
    const funded = await seedTenant(5)
    assert.isFalse(await AiCreditService.hasCredits(empty.id))
    assert.isTrue(await AiCreditService.hasCredits(funded.id))
  })
})
