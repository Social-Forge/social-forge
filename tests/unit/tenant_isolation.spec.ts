import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Tenant from '#models/tenant'
import Division from '#models/division'
import TenantContext from '#services/tenant_context'

/**
 * Proves the core Phase 1 guarantee: the `TenantScoped` mixin isolates reads
 * per tenant. Each test runs in a rolled-back transaction so the dev database
 * is left untouched.
 */
test.group('Tenant isolation', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function makeTenant(label: string) {
    return Tenant.create({
      name: label,
      slug: `${label.toLowerCase()}-${Math.random().toString(36).slice(2, 8)}`,
      status: 'active',
      plan: 'free',
    })
  }

  test('reads are scoped to the active tenant', async ({ assert }) => {
    const tenantA = await makeTenant('Alpha')
    const tenantB = await makeTenant('Beta')
    const divA = await Division.create({ tenantId: tenantA.id, name: 'Alpha Division' })
    const divB = await Division.create({ tenantId: tenantB.id, name: 'Beta Division' })

    const scopedToA = await TenantContext.run(tenantA.id, () => Division.all())
    const idsA = scopedToA.map((d) => d.id)
    assert.include(idsA, divA.id)
    assert.notInclude(idsA, divB.id)

    const scopedToB = await TenantContext.run(tenantB.id, () => Division.all())
    const idsB = scopedToB.map((d) => d.id)
    assert.include(idsB, divB.id)
    assert.notInclude(idsB, divA.id)
  })

  test('findOrFail cannot reach another tenant’s row', async ({ assert }) => {
    const tenantA = await makeTenant('Gamma')
    const tenantB = await makeTenant('Delta')
    const divB = await Division.create({ tenantId: tenantB.id, name: 'Delta Division' })

    // Looking up tenant B's division while scoped to tenant A must fail.
    await assert.rejects(() => TenantContext.run(tenantA.id, () => Division.findOrFail(divB.id)))

    // …but it resolves for its own tenant.
    const found = await TenantContext.run(tenantB.id, () => Division.findOrFail(divB.id))
    assert.equal(found.id, divB.id)
  })

  test('bypassed context is not scoped', async ({ assert }) => {
    const tenantA = await makeTenant('Epsilon')
    const tenantB = await makeTenant('Zeta')
    const divA = await Division.create({ tenantId: tenantA.id, name: 'Epsilon Division' })
    const divB = await Division.create({ tenantId: tenantB.id, name: 'Zeta Division' })

    const all = await TenantContext.runBypassed(() => Division.all())
    const ids = all.map((d) => d.id)
    assert.include(ids, divA.id)
    assert.include(ids, divB.id)
  })
})
