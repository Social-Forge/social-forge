import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Tenant from '#models/tenant'
import Channel from '#models/channel'
import Contact from '#models/contact'
import Conversation from '#models/conversation'
import Message from '#models/message'
import TenantContext from '#services/tenant_context'
import InboundNormalizer from '#services/messaging/inbound_normalizer'
import type { InboundJob } from '#services/messaging/inbound_normalizer'

function messageJob(channel: Channel, providerId: string, body: string): InboundJob {
  return {
    channelId: channel.id,
    tenantId: channel.tenantId,
    event: 'message',
    receivedAt: new Date().toISOString(),
    payload: {
      event: 'message',
      session: channel.wahaSessionName,
      payload: {
        id: providerId,
        from: '628123@c.us',
        fromMe: false,
        type: 'chat',
        body,
        timestamp: 1700000000,
        _data: { notifyName: 'Siti' },
      },
    },
  }
}

test.group('Inbound normalizer', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function seedChannel() {
    const tenant = await Tenant.create({
      name: 'WA Co',
      slug: `wa-${Math.random().toString(36).slice(2, 8)}`,
      status: 'active',
      plan: 'pro',
    })
    const channel = await Channel.create({
      tenantId: tenant.id,
      type: 'whatsapp_waha',
      name: 'Main WA',
      status: 'connected',
      wahaEngine: 'gows',
      wahaSessionName: `sf${Math.random().toString(36).slice(2, 10)}`,
      webhookSecret: 'secret',
    })
    return channel
  }

  test('persists an inbound message with contact + conversation', async ({ assert }) => {
    const channel = await seedChannel()
    await InboundNormalizer.process(messageJob(channel, 'pmid-1', 'Halo kak'))

    await TenantContext.run(channel.tenantId, async () => {
      const messages = await Message.all()
      assert.lengthOf(messages, 1)
      assert.equal(messages[0].direction, 'in')
      assert.equal(messages[0].senderType, 'contact')
      assert.equal(messages[0].body, 'Halo kak')

      const contact = await Contact.query().where('channel_id', channel.id).firstOrFail()
      assert.equal(contact.externalId, '628123@c.us')
      assert.equal(contact.displayName, 'Siti')

      const conversation = await Conversation.query().where('channel_id', channel.id).firstOrFail()
      assert.equal(conversation.unreadCount, 1)
      assert.equal(conversation.status, 'unassigned')
    })
  })

  test('is idempotent — duplicate provider id does not double-insert', async ({ assert }) => {
    const channel = await seedChannel()
    await InboundNormalizer.process(messageJob(channel, 'pmid-dup', 'once'))
    await InboundNormalizer.process(messageJob(channel, 'pmid-dup', 'once'))

    await TenantContext.run(channel.tenantId, async () => {
      const messages = await Message.query().where('provider_message_id', 'pmid-dup')
      assert.lengthOf(messages, 1)
      const contacts = await Contact.query().where('channel_id', channel.id)
      assert.lengthOf(contacts, 1)
    })
  })
})
