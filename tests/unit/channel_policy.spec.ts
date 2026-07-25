import { test } from '@japa/runner'
import ChannelPolicy from '#policies/channel_policy'
import EntitlementService from '#services/entitlement_service'
import User from '#models/user'
import Role from '#models/role'
import Channel from '#models/channel'

function makeUser(roleName: string, level: number, tenantId: string | null) {
  const user = new User()
  user.tenantId = tenantId
  const role = new Role()
  role.name = roleName
  role.level = level
  user.$setRelated('role', role)
  return user
}

function makeChannel(tenantId: string) {
  const channel = new Channel()
  channel.tenantId = tenantId
  return channel
}

test.group('ChannelPolicy', () => {
  const policy = new ChannelPolicy()

  test('owner can create channels, supervisor cannot', ({ assert }) => {
    assert.isTrue(policy.create(makeUser('owner', 80, 't1')) === true)
    assert.isFalse(policy.create(makeUser('supervisor', 50, 't1')) === true)
  })

  test('supervisor can manage session within tenant, not across tenants', ({ assert }) => {
    const supervisor = makeUser('supervisor', 50, 't1')
    assert.isTrue(policy.manageSession(supervisor, makeChannel('t1')) === true)
    assert.isFalse(policy.manageSession(supervisor, makeChannel('t2')) === true)
  })

  test('super admin bypasses', ({ assert }) => {
    assert.isTrue(policy.before(makeUser('super_admin', 100, null)) === true)
  })
})

test.group('EntitlementService channel limits', () => {
  test('free plan blocks WhatsApp but allows one messenger', ({ assert }) => {
    assert.equal(EntitlementService.channelLimit('free', 'whatsapp_waha'), 0)
    assert.equal(EntitlementService.channelLimit('free', 'messenger'), 1)
  })

  test('pro plan allows WhatsApp WAHA + Meta', ({ assert }) => {
    assert.equal(EntitlementService.channelLimit('pro', 'whatsapp_waha'), 1)
    assert.equal(EntitlementService.channelLimit('pro', 'whatsapp_meta'), 1)
    assert.equal(EntitlementService.channelLimit('pro', 'telegram'), 10)
  })

  test('unknown plan yields zero', ({ assert }) => {
    assert.equal(EntitlementService.channelLimit('enterprise', 'telegram'), 0)
  })
})
