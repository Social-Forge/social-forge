import { randomUUID } from 'node:crypto'
import Channel from '#models/channel'
import Contact from '#models/contact'
import Conversation from '#models/conversation'
import Message from '#models/message'
import TenantContext from '#services/tenant_context'
import MessageIngestService from '#services/messaging/message_ingest_service'

export type WebchatMessage = {
  id: string
  role: 'visitor' | 'bot' | 'agent'
  body: string | null
  at: string | null
}

/**
 * Bridges the public webchat widget into the shared messaging pipeline. Visitor
 * messages are ingested via `MessageIngestService` exactly like any provider, so
 * they get dedup, persistence, realtime broadcast, and AI auto-reply for free.
 * The widget itself is stateless and polls `history()` for new turns.
 */
export default class WebchatService {
  /** Load a channel only if it is a webchat channel (worker/public context). */
  static async loadChannel(channelId: string): Promise<Channel | null> {
    const channel = await Channel.find(channelId)
    if (!channel || channel.type !== 'webchat') return null
    return channel
  }

  /** Create or resume a visitor session (contact + conversation). */
  static async session(
    channel: Channel,
    input: { visitorId?: string | null; name?: string | null }
  ): Promise<{ visitorId: string; conversationId: string }> {
    const visitorId = input.visitorId?.trim() || `wv_${randomUUID().replace(/-/g, '')}`

    return TenantContext.run(channel.tenantId, async () => {
      const contact = await Contact.firstOrCreate(
        { channelId: channel.id, externalId: visitorId },
        {
          tenantId: channel.tenantId,
          channelId: channel.id,
          externalId: visitorId,
          displayName: input.name?.trim() || 'Website Visitor',
          avatarUrl: null,
        }
      )
      if (input.name?.trim() && contact.displayName !== input.name.trim()) {
        contact.displayName = input.name.trim()
        await contact.save()
      }

      const conversation = await Conversation.firstOrCreate(
        { channelId: channel.id, contactId: contact.id },
        {
          tenantId: channel.tenantId,
          channelId: channel.id,
          contactId: contact.id,
          status: 'unassigned',
        }
      )

      return { visitorId, conversationId: conversation.id }
    })
  }

  /** Ingest a visitor message (triggers realtime + AI auto-reply downstream). */
  static async receive(channel: Channel, visitorId: string, body: string): Promise<void> {
    await TenantContext.run(channel.tenantId, () =>
      MessageIngestService.ingestInbound(channel, {
        providerMessageId: `webchat:${randomUUID()}`,
        externalContactId: visitorId,
        contactName: null,
        fromMe: false,
        contentType: 'text',
        body,
        media: null,
        timestamp: Math.floor(Date.now() / 1000),
      })
    )
  }

  /** Messages for a visitor's conversation, optionally after an ISO cursor. */
  static async history(
    channel: Channel,
    visitorId: string,
    after?: string | null,
    limit = 100
  ): Promise<WebchatMessage[]> {
    return TenantContext.run(channel.tenantId, async () => {
      const contact = await Contact.query()
        .where('channel_id', channel.id)
        .where('external_id', visitorId)
        .first()
      if (!contact) return []

      const conversation = await Conversation.query()
        .where('channel_id', channel.id)
        .where('contact_id', contact.id)
        .first()
      if (!conversation) return []

      const query = Message.query()
        .where('conversation_id', conversation.id)
        .whereNull('deleted_at')
        .orderBy('created_at', 'asc')
        .limit(limit)
      if (after) query.where('created_at', '>', after)

      const messages = await query
      return messages.map((m) => ({
        id: m.id,
        role:
          m.senderType === 'contact'
            ? 'visitor'
            : m.senderType === 'ai'
              ? 'bot'
              : ('agent' as const),
        body: m.body,
        at: m.createdAt?.toISO() ?? null,
      })) as WebchatMessage[]
    })
  }
}
