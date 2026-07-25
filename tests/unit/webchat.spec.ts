import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Tenant from '#models/tenant'
import Channel from '#models/channel'
import AiAgent from '#models/ai_agent'
import Message from '#models/message'
import Conversation from '#models/conversation'
import TenantContext from '#services/tenant_context'
import WebchatService from '#services/webchat/webchat_service'
import rabbitmq from '#services/messaging/rabbitmq'

async function seedChannel(withAgent = false): Promise<Channel> {
  const tenant = await Tenant.create({
    name: 'Web Co',
    slug: `web-${Math.random().toString(36).slice(2, 8)}`,
    status: 'active',
    plan: 'pro',
  })

  return TenantContext.run(tenant.id, async () => {
    let agentId: string | null = null
    if (withAgent) {
      const agent = await AiAgent.create({
        tenantId: tenant.id,
        name: 'Bot',
        provider: 'claude',
        model: 'claude-opus-4-8',
        systemPrompt: 'help',
        maxTokens: 512,
      })
      agentId = agent.id
    }
    return Channel.create({
      tenantId: tenant.id,
      type: 'webchat',
      name: 'Website Chat',
      status: 'connected',
      webhookSecret: 'secret',
      aiAgentId: agentId,
    })
  })
}

test.group('Webchat service', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('session creates a visitor contact + conversation and ingest persists messages', async ({
    assert,
  }) => {
    const channel = await seedChannel(false)

    const { visitorId, conversationId } = await WebchatService.session(channel, {
      name: 'Nina',
    })
    assert.match(visitorId, /^wv_/)
    assert.isString(conversationId)

    await WebchatService.receive(channel, visitorId, 'Halo, apakah masih buka?')

    const history = await WebchatService.history(channel, visitorId)
    assert.lengthOf(history, 1)
    assert.equal(history[0].role, 'visitor')
    assert.equal(history[0].body, 'Halo, apakah masih buka?')

    await TenantContext.run(channel.tenantId, async () => {
      const conv = await Conversation.findOrFail(conversationId)
      assert.equal(conv.unreadCount, 1)
      const messages = await Message.query().where('conversation_id', conversationId)
      assert.lengthOf(messages, 1)
      assert.equal(messages[0].senderType, 'contact')
    })
  })

  test('a message on a channel with an agent enqueues an AI reply job', async ({ assert }) => {
    const channel = await seedChannel(true)
    const { visitorId } = await WebchatService.session(channel, {})

    const published: Array<{ exchange: string; routingKey: string }> = []
    const origPublish = rabbitmq.publish
    ;(rabbitmq as any).publish = async (exchange: string, routingKey: string) => {
      published.push({ exchange, routingKey })
      return true
    }

    try {
      await WebchatService.receive(channel, visitorId, 'butuh bantuan')
    } finally {
      ;(rabbitmq as any).publish = origPublish
    }

    assert.isTrue(published.some((p) => p.exchange === 'sf.ai' && p.routingKey === 'agent.reply'))
  })

  test('resuming with an existing visitorId reuses the same conversation', async ({ assert }) => {
    const channel = await seedChannel(false)
    const first = await WebchatService.session(channel, { visitorId: 'wv_fixed', name: 'Repeat' })
    const second = await WebchatService.session(channel, { visitorId: 'wv_fixed' })
    assert.equal(first.conversationId, second.conversationId)
  })
})
