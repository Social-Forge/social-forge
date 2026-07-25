import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import Contact from '#models/contact'
import Conversation from '#models/conversation'
import Message from '#models/message'
import type Channel from '#models/channel'
import centrifugo from '#services/realtime/centrifugo_service'
import rabbitmq from '#services/messaging/rabbitmq'
import SearchIndexer from '#services/search/search_indexer'
import { EXCHANGES } from '#services/messaging/topology'
import {
  hasServiceWindow,
  type ChannelType,
  type MessageStatus,
} from '#services/messaging/constants'
import type { NormalizedInboundMessage } from '#services/messaging/types'

const STATUS_ORDER: Record<MessageStatus, number> = {
  pending: 0,
  failed: 0,
  sent: 1,
  delivered: 2,
  read: 3,
}

/**
 * Provider-agnostic core of the inbound pipeline: dedup, resolve contact +
 * conversation, persist, broadcast, and mirror media when needed. Every channel
 * adapter normalizes its payload then calls into here, so isolation, dedup, and
 * realtime behavior stay identical across WAHA / Meta / Telegram.
 *
 * Callers must already be inside `TenantContext.run(channel.tenantId, …)`.
 */
export default class MessageIngestService {
  static async ingestInbound(channel: Channel, n: NormalizedInboundMessage): Promise<void> {
    if (n.fromMe) return

    // Fast idempotency guard before any writes.
    const seen = await Message.query().where('provider_message_id', n.providerMessageId).first()
    if (seen) return

    const { conversation, message } = await db.transaction(async (trx) => {
      const contact = await this.#resolveContact(channel, n, trx)
      const conv = await this.#resolveConversation(channel, contact.id, trx)

      const msg = await Message.create(
        {
          tenantId: channel.tenantId,
          conversationId: conv.id,
          direction: 'in',
          senderType: 'contact',
          contentType: n.contentType,
          body: n.body,
          media: n.media,
          providerMessageId: n.providerMessageId,
          status: 'delivered',
        },
        { client: trx }
      )

      conv.useTransaction(trx)
      conv.lastMessageAt = DateTime.fromSeconds(n.timestamp)
      conv.unreadCount = (conv.unreadCount ?? 0) + 1
      if (conv.status === 'completed' || conv.status === 'archived') {
        conv.status = 'unassigned'
      }
      if (hasServiceWindow(channel.type as ChannelType)) {
        conv.serviceWindowExpiresAt = DateTime.now().plus({ hours: 24 })
      }
      await conv.save()

      return { conversation: conv, message: msg }
    })

    await centrifugo.publish(centrifugo.conversationChannel(channel.tenantId, conversation.id), {
      type: 'message.new',
      message: message.serialize(),
    })
    await centrifugo.publish(centrifugo.inboxChannel(channel.tenantId), {
      type: 'conversation.updated',
      conversation: conversation.serialize(),
    })

    // WAHA already stores media in MinIO; other providers serve temporary/authed
    // URLs, so mirror those to our own storage.
    if (message.media && channel.type !== 'whatsapp_waha') {
      await rabbitmq.publish(EXCHANGES.media, `${channel.type}.media`, {
        messageId: message.id,
        tenantId: channel.tenantId,
        channelId: channel.id,
      })
    }

    // Index the new message + contact for search (best-effort).
    await SearchIndexer.enqueue('upsert', 'message', message.id, channel.tenantId)
    await SearchIndexer.enqueue('upsert', 'contact', conversation.contactId, channel.tenantId)

    // Hand off to the AI worker when this channel has a bot attached. The worker
    // re-checks the agent (active / auto-reply / working hours / credits) so
    // this stays a cheap "maybe" without an extra query on the hot path.
    if (channel.aiAgentId) {
      await rabbitmq.publish(EXCHANGES.ai, 'agent.reply', {
        channelId: channel.id,
        conversationId: conversation.id,
        tenantId: channel.tenantId,
      })
    }
  }

  static async updateDeliveryStatus(
    channel: Channel,
    providerMessageId: string,
    status: MessageStatus
  ): Promise<void> {
    const message = await Message.query().where('provider_message_id', providerMessageId).first()
    if (!message) return
    if (STATUS_ORDER[status] <= STATUS_ORDER[message.status as MessageStatus]) return

    message.status = status
    await message.save()
    await centrifugo.publish(
      centrifugo.conversationChannel(channel.tenantId, message.conversationId),
      { type: 'message.status', id: message.id, status }
    )
  }

  static async #resolveContact(
    channel: Channel,
    n: NormalizedInboundMessage,
    trx: TransactionClientContract
  ) {
    const contact = await Contact.firstOrCreate(
      { channelId: channel.id, externalId: n.externalContactId },
      {
        tenantId: channel.tenantId,
        channelId: channel.id,
        externalId: n.externalContactId,
        displayName: n.contactName,
        avatarUrl: n.contactAvatar ?? null,
      },
      { client: trx }
    )
    if (n.contactName && contact.displayName !== n.contactName) {
      contact.useTransaction(trx)
      contact.displayName = n.contactName
      await contact.save()
    }
    return contact
  }

  static #resolveConversation(channel: Channel, contactId: string, trx: TransactionClientContract) {
    return Conversation.firstOrCreate(
      { channelId: channel.id, contactId },
      { tenantId: channel.tenantId, channelId: channel.id, contactId, status: 'unassigned' },
      { client: trx }
    )
  }
}
