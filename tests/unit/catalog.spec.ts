import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Tenant from '#models/tenant'
import Channel from '#models/channel'
import Contact from '#models/contact'
import Conversation from '#models/conversation'
import Label from '#models/label'
import QuickReply from '#models/quick_reply'
import TenantContext from '#services/tenant_context'

async function seedConversation(tenantId: string) {
  return TenantContext.run(tenantId, async () => {
    const channel = await Channel.create({
      tenantId,
      type: 'webchat',
      name: 'Web',
      status: 'connected',
      webhookSecret: 's',
    })
    const contact = await Contact.create({
      tenantId,
      channelId: channel.id,
      externalId: `v-${Math.random().toString(36).slice(2, 8)}`,
      displayName: 'V',
    })
    return Conversation.create({
      tenantId,
      channelId: channel.id,
      contactId: contact.id,
      status: 'unassigned',
    })
  })
}

test.group('Labels', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function tenant() {
    return Tenant.create({
      name: 'Lbl Co',
      slug: `lbl-${Math.random().toString(36).slice(2, 8)}`,
      status: 'active',
      plan: 'pro',
    })
  }

  test('attach + detach a label to a conversation (pivot carries tenant_id)', async ({
    assert,
  }) => {
    const t = await tenant()
    const conversation = await seedConversation(t.id)

    await TenantContext.run(t.id, async () => {
      const label = await Label.create({ tenantId: t.id, name: 'VIP', color: '#ff0000' })

      await conversation.related('labels').sync([label.id], false)
      let labels = await conversation.related('labels').query()
      assert.lengthOf(labels, 1)
      assert.equal(labels[0].name, 'VIP')

      await conversation.related('labels').detach([label.id])
      labels = await conversation.related('labels').query()
      assert.lengthOf(labels, 0)
    })
  })

  test('label names are unique per tenant', async ({ assert }) => {
    const t = await tenant()
    await TenantContext.run(t.id, async () => {
      await Label.create({ tenantId: t.id, name: 'Urgent', color: '#000000' })
      await assert.rejects(() => Label.create({ tenantId: t.id, name: 'Urgent', color: '#111111' }))
    })
  })
})

test.group('Quick replies', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('shortcuts are unique per tenant', async ({ assert }) => {
    const t = await Tenant.create({
      name: 'QR Co',
      slug: `qr-${Math.random().toString(36).slice(2, 8)}`,
      status: 'active',
      plan: 'pro',
    })
    await TenantContext.run(t.id, async () => {
      await QuickReply.create({
        tenantId: t.id,
        shortcut: 'hi',
        contentType: 'text',
        body: 'Hello there!',
      })
      await assert.rejects(() =>
        QuickReply.create({
          tenantId: t.id,
          shortcut: 'hi',
          contentType: 'text',
          body: 'dup',
        })
      )
    })
  })
})
