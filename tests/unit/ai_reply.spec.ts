import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Tenant from '#models/tenant'
import Channel from '#models/channel'
import Contact from '#models/contact'
import Conversation from '#models/conversation'
import Message from '#models/message'
import AiAgent from '#models/ai_agent'
import Role from '#models/role'
import User from '#models/user'
import TenantContext from '#services/tenant_context'
import AiReplyService from '#services/ai/ai_reply_service'
import aiRegistry from '#services/ai/registry'
import rabbitmq from '#services/messaging/rabbitmq'

const fakeProvider = {
  id: 'claude' as const,
  async chat() {
    return {
      text: 'Hi there! How can I help?',
      usage: { inputTokens: 20, outputTokens: 10 },
      model: 'claude-opus-4-8',
      provider: 'claude' as const,
    }
  },
  async *stream() {
    yield { delta: '', done: true }
  },
  countTokens: () => 0,
  async embed() {
    return []
  },
}

type Seed = { tenant: Tenant; channel: Channel; conversation: Conversation; agent: AiAgent }

test.group('AI reply service', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => {
    const origGet = aiRegistry.get
    const origPub = rabbitmq.publish
    // Never hit real provider APIs or the broker during unit tests.
    ;(aiRegistry as any).get = () => fakeProvider
    ;(rabbitmq as any).publish = async () => true
    return () => {
      ;(aiRegistry as any).get = origGet
      ;(rabbitmq as any).publish = origPub
    }
  })

  async function seed(
    opts: {
      credits?: number
      isActive?: boolean
      autoReply?: boolean
      assigned?: boolean
    } = {}
  ): Promise<Seed> {
    const tenant = await Tenant.create({
      name: 'Bot Co',
      slug: `bot-${Math.random().toString(36).slice(2, 8)}`,
      status: 'active',
      plan: 'pro',
      aiCredits: opts.credits ?? 100,
    })

    return TenantContext.run(tenant.id, async () => {
      const agent = await AiAgent.create({
        tenantId: tenant.id,
        name: 'Support Bot',
        provider: 'claude',
        model: 'claude-opus-4-8',
        systemPrompt: 'You are a helpful support agent.',
        maxTokens: 1024,
        autoReplyEnabled: opts.autoReply ?? true,
        isActive: opts.isActive ?? true,
      })

      const channel = await Channel.create({
        tenantId: tenant.id,
        type: 'whatsapp_waha',
        name: 'Main WA',
        status: 'connected',
        wahaEngine: 'gows',
        wahaSessionName: `sf${Math.random().toString(36).slice(2, 10)}`,
        webhookSecret: 'secret',
        aiAgentId: agent.id,
      })

      const contact = await Contact.create({
        tenantId: tenant.id,
        channelId: channel.id,
        externalId: '628999@c.us',
        displayName: 'Andi',
      })

      let assignedAgentId: string | null = null
      if (opts.assigned) {
        const role = await Role.create({
          name: `agent-${Math.random().toString(36).slice(2, 8)}`,
          level: 20,
        })
        const human = await User.create({
          tenantId: tenant.id,
          email: `human-${Math.random().toString(36).slice(2, 8)}@x.test`,
          password: 'secret123',
          roleId: role.id,
          status: 'active',
        })
        assignedAgentId = human.id
      }

      const conversation = await Conversation.create({
        tenantId: tenant.id,
        channelId: channel.id,
        contactId: contact.id,
        status: opts.assigned ? 'assigned' : 'unassigned',
        assignedAgentId,
      })

      await Message.create({
        tenantId: tenant.id,
        conversationId: conversation.id,
        direction: 'in',
        senderType: 'contact',
        contentType: 'text',
        body: 'Halo, apakah toko buka?',
        providerMessageId: `pm-${Math.random().toString(36).slice(2, 8)}`,
        status: 'delivered',
      })

      return { tenant, channel, conversation, agent }
    })
  }

  test('generates an AI reply and debits credits', async ({ assert }) => {
    const { tenant, channel, conversation } = await seed({ credits: 100 })

    await AiReplyService.process({
      channelId: channel.id,
      conversationId: conversation.id,
      tenantId: tenant.id,
    })

    await TenantContext.run(tenant.id, async () => {
      const ai = await Message.query().where('sender_type', 'ai').first()
      assert.isNotNull(ai)
      assert.equal(ai!.body, 'Hi there! How can I help?')
      assert.equal(ai!.direction, 'out')

      // Opus 20 in + 10 out = $0.00035 → 1 credit.
      const fresh = await Tenant.findOrFail(tenant.id)
      assert.equal(fresh.aiCredits, 99)
    })
  })

  test('does not reply when the tenant is out of credits', async ({ assert }) => {
    const { tenant, channel, conversation } = await seed({ credits: 0 })

    await AiReplyService.process({
      channelId: channel.id,
      conversationId: conversation.id,
      tenantId: tenant.id,
    })

    await TenantContext.run(tenant.id, async () => {
      const ai = await Message.query().where('sender_type', 'ai').first()
      assert.isNull(ai)
    })
  })

  test('stands down when a human already handles the conversation', async ({ assert }) => {
    const { tenant, channel, conversation } = await seed({ assigned: true })

    await AiReplyService.process({
      channelId: channel.id,
      conversationId: conversation.id,
      tenantId: tenant.id,
    })

    await TenantContext.run(tenant.id, async () => {
      const ai = await Message.query().where('sender_type', 'ai').first()
      assert.isNull(ai)
    })
  })

  test('does not reply when the agent is inactive', async ({ assert }) => {
    const { tenant, channel, conversation } = await seed({ isActive: false })

    await AiReplyService.process({
      channelId: channel.id,
      conversationId: conversation.id,
      tenantId: tenant.id,
    })

    await TenantContext.run(tenant.id, async () => {
      const ai = await Message.query().where('sender_type', 'ai').first()
      assert.isNull(ai)
    })
  })
})
