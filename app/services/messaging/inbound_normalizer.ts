import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import logger from '@adonisjs/core/services/logger'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import Channel from '#models/channel'
import Contact from '#models/contact'
import Conversation from '#models/conversation'
import Message from '#models/message'
import MessageOutbox from '#models/message_outbox'
import ConversationEvent from '#models/conversation_event'
import TenantContext from '#services/tenant_context'
import centrifugo from '#services/realtime/centrifugo_service'
import rabbitmq from '#services/messaging/rabbitmq'
import wahaClient from '#services/waha/waha_client'
import { EXCHANGES } from '#services/messaging/topology'
import { WahaAdapter } from '#services/waha/waha_adapter'
import {
  hasServiceWindow,
  type MessageStatus,
  type WahaEngine,
} from '#services/messaging/constants'

export type InboundJob = {
  channelId: string
  tenantId: string
  event: string
  payload: any
  receivedAt: string
}

const STATUS_ORDER: Record<MessageStatus, number> = {
  pending: 0,
  failed: 0,
  sent: 1,
  delivered: 2,
  read: 3,
}

const WAHA_SESSION_STATUS: Record<string, string> = {
  STARTING: 'connecting',
  SCAN_QR_CODE: 'connecting',
  WORKING: 'connected',
  FAILED: 'failed',
  STOPPED: 'disconnected',
}

/**
 * Consumes raw inbound events from the queue and turns them into normalized,
 * persisted domain state — then broadcasts to subscribed clients. Idempotent:
 * duplicate provider webhooks are dropped via the `provider_message_id` guard
 * and unique constraint.
 */
export default class InboundNormalizer {
  static async process(job: InboundJob): Promise<void> {
    const channel = await Channel.find(job.channelId)
    if (!channel) {
      logger.warn({ channelId: job.channelId }, 'inbound event for unknown channel — dropping')
      return
    }

    // Scope every tenant model touched downstream to this channel's tenant.
    await TenantContext.run(channel.tenantId, async () => {
      switch (job.event) {
        case 'message':
          await this.#handleMessage(channel, job)
          break
        case 'message.ack':
          await this.#handleAck(channel, job)
          break
        case 'session.status':
          await this.#handleSessionStatus(channel, job)
          break
        case 'call.received':
          await this.#handleCall(channel, job)
          break
        default:
          // message.any duplicates the `message` event.
          break
      }
    })
  }

  static async #handleMessage(channel: Channel, job: InboundJob) {
    const normalized = WahaAdapter.parseMessage(job.payload)
    if (!normalized || normalized.fromMe) return

    // Fast idempotency check before doing any work.
    const seen = await Message.query()
      .where('provider_message_id', normalized.providerMessageId)
      .first()
    if (seen) return

    const { conversation, message } = await db.transaction(async (trx) => {
      const contact = await this.#resolveContact(channel, normalized, trx)
      const conv = await this.#resolveConversation(channel, contact.id, trx)

      const msg = await Message.create(
        {
          tenantId: channel.tenantId,
          conversationId: conv.id,
          direction: 'in',
          senderType: 'contact',
          contentType: normalized.contentType,
          body: normalized.body,
          media: normalized.media,
          providerMessageId: normalized.providerMessageId,
          status: 'delivered',
        },
        { client: trx }
      )

      conv.useTransaction(trx)
      conv.lastMessageAt = DateTime.fromSeconds(normalized.timestamp)
      conv.unreadCount = (conv.unreadCount ?? 0) + 1
      if (conv.status === 'completed' || conv.status === 'archived') {
        conv.status = 'unassigned'
      }
      if (hasServiceWindow(channel.type as any)) {
        conv.serviceWindowExpiresAt = DateTime.now().plus({ hours: 24 })
      }
      await conv.save()

      return { conversation: conv, message: msg }
    })

    // Broadcast after commit so clients never see uncommitted state.
    await centrifugo.publish(centrifugo.conversationChannel(channel.tenantId, conversation.id), {
      type: 'message.new',
      message: message.serialize(),
    })
    await centrifugo.publish(centrifugo.inboxChannel(channel.tenantId), {
      type: 'conversation.updated',
      conversation: conversation.serialize(),
    })
  }

  static async #resolveContact(
    channel: Channel,
    n: ReturnType<typeof WahaAdapter.parseMessage> & {},
    trx: TransactionClientContract
  ) {
    const contact = await Contact.firstOrCreate(
      { channelId: channel.id, externalId: n.externalContactId },
      {
        tenantId: channel.tenantId,
        channelId: channel.id,
        externalId: n.externalContactId,
        displayName: n.contactName,
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

  static async #resolveConversation(
    channel: Channel,
    contactId: string,
    trx: TransactionClientContract
  ) {
    return Conversation.firstOrCreate(
      { channelId: channel.id, contactId },
      {
        tenantId: channel.tenantId,
        channelId: channel.id,
        contactId,
        status: 'unassigned',
      },
      { client: trx }
    )
  }

  static async #handleAck(channel: Channel, job: InboundJob) {
    const ack = WahaAdapter.parseAck(job.payload)
    if (!ack) return

    const message = await Message.query()
      .where('provider_message_id', ack.providerMessageId)
      .first()
    if (!message) return

    // Only ever advance status forward (sent → delivered → read).
    if (STATUS_ORDER[ack.status] <= STATUS_ORDER[message.status as MessageStatus]) return
    message.status = ack.status
    await message.save()

    await centrifugo.publish(
      centrifugo.conversationChannel(channel.tenantId, message.conversationId),
      { type: 'message.status', id: message.id, status: ack.status }
    )
  }

  static async #handleSessionStatus(channel: Channel, job: InboundJob) {
    const wahaStatus = job.payload?.payload?.status as string | undefined
    const mapped = wahaStatus ? WAHA_SESSION_STATUS[wahaStatus] : undefined
    if (mapped && mapped !== channel.status) {
      channel.status = mapped
      await channel.save()
    }
    await centrifugo.publish(centrifugo.inboxChannel(channel.tenantId), {
      type: 'channel.status',
      channelId: channel.id,
      status: channel.status,
    })
  }

  /**
   * Auto-reject an incoming WAHA call when the channel opts in, log the event,
   * and optionally fire a canned auto-response back to the caller.
   */
  static async #handleCall(channel: Channel, job: InboundJob) {
    const call = job.payload?.payload
    const callId = call?.id
    const from = call?.from ? String(call.from) : null
    const settings = (channel.settings as Record<string, any>) ?? {}
    if (!settings.autoRejectCalls || !callId) return

    const engine = (channel.wahaEngine as WahaEngine) ?? 'gows'
    await wahaClient.rejectCall(engine, channel.wahaSessionName!, String(callId))
    if (!from) return

    const contact = await Contact.firstOrCreate(
      { channelId: channel.id, externalId: from },
      { tenantId: channel.tenantId, channelId: channel.id, externalId: from }
    )
    const conversation = await Conversation.firstOrCreate(
      { channelId: channel.id, contactId: contact.id },
      {
        tenantId: channel.tenantId,
        channelId: channel.id,
        contactId: contact.id,
        status: 'unassigned',
      }
    )

    await ConversationEvent.create({
      tenantId: channel.tenantId,
      conversationId: conversation.id,
      type: 'call_rejected',
      metadata: { callId: String(callId) },
    })

    if (settings.autoRejectMessage) {
      const message = await Message.create({
        tenantId: channel.tenantId,
        conversationId: conversation.id,
        direction: 'out',
        senderType: 'system',
        contentType: 'text',
        body: String(settings.autoRejectMessage),
        status: 'pending',
      })
      await MessageOutbox.create({
        tenantId: channel.tenantId,
        messageId: message.id,
        status: 'pending',
      })
      await rabbitmq.publish(EXCHANGES.outbound, 'waha.send', {
        messageId: message.id,
        tenantId: channel.tenantId,
      })
    }
  }
}
