import { test } from '@japa/runner'
import DivisionPolicy from '#policies/division_policy'
import TeamPolicy from '#policies/team_policy'
import User from '#models/user'
import Role from '#models/role'
import Division from '#models/division'

/** Build an in-memory user with a preloaded role — no DB required. */
function makeUser(roleName: string, level: number, tenantId: string | null, id = 'u1') {
  const user = new User()
  user.id = id
  user.tenantId = tenantId
  const role = new Role()
  role.name = roleName
  role.level = level
  user.$setRelated('role', role)
  return user
}

function makeDivision(tenantId: string) {
  const division = new Division()
  division.tenantId = tenantId
  return division
}

test.group('DivisionPolicy', () => {
  const policy = new DivisionPolicy()

  test('owner can create, agent cannot', ({ assert }) => {
    assert.isTrue(policy.create(makeUser('owner', 80, 't1')) === true)
    assert.isFalse(policy.create(makeUser('agent', 20, 't1')) === true)
  })

  test('supervisor can view within tenant, not across tenants', ({ assert }) => {
    const supervisor = makeUser('supervisor', 50, 't1')
    assert.isTrue(policy.view(supervisor, makeDivision('t1')) === true)
    assert.isFalse(policy.view(supervisor, makeDivision('t2')) === true)
  })

  test('owner cannot update another tenant’s division', ({ assert }) => {
    const owner = makeUser('owner', 80, 't1')
    assert.isTrue(policy.update(owner, makeDivision('t1')) === true)
    assert.isFalse(policy.update(owner, makeDivision('t2')) === true)
  })

  test('super admin bypasses via before hook', ({ assert }) => {
    const superAdmin = makeUser('super_admin', 100, null)
    assert.isTrue(policy.before(superAdmin) === true)
  })
})

test.group('TeamPolicy', () => {
  const policy = new TeamPolicy()

  test('owner manages team, supervisor cannot create', ({ assert }) => {
    assert.isTrue(policy.create(makeUser('owner', 80, 't1')) === true)
    assert.isFalse(policy.create(makeUser('supervisor', 50, 't1')) === true)
  })

  test('owner cannot delete themselves', ({ assert }) => {
    const owner = makeUser('owner', 80, 't1', 'owner-1')
    const self = makeUser('owner', 80, 't1', 'owner-1')
    const other = makeUser('agent', 20, 't1', 'agent-1')
    assert.isFalse(policy.delete(owner, self) === true)
    assert.isTrue(policy.delete(owner, other) === true)
  })
})
