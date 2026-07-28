import type Channel from '#models/channel'
import Contact from '#models/contact'
import Conversation from '#models/conversation'
import Message from '#models/message'
import MessageOutbox from '#models/message_outbox'
import ConversationEvent from '#models/conversation_event'
import centrifugo from '#services/realtime/centrifugo_service'
import rabbitmq from '#services/messaging/rabbitmq'
import wahaClient from '#services/waha/waha_client'
import MessageIngestService from '#services/messaging/message_ingest_service'
import { WahaAdapter } from '#services/waha/waha_adapter'
import { WAHA_STATUS_MAP } from '#services/waha/waha_session_service'
import { EXCHANGES } from '#services/messaging/topology'
import type { WahaEngine } from '#services/messaging/constants'
import type { InboundJob } from '#services/messaging/types'

/** Routes WAHA webhook events into the shared ingest core. */
export default class WahaInbound {
  static async handle(channel: Channel, job: InboundJob): Promise<void> {
    switch (job.event) {
      case 'message': {
        const normalized = WahaAdapter.parseMessage(job.payload)
        if (normalized) await MessageIngestService.ingestInbound(channel, normalized)
        break
      }
      case 'message.ack': {
        const ack = WahaAdapter.parseAck(job.payload)
        if (ack)
          await MessageIngestService.updateDeliveryStatus(
            channel,
            ack.providerMessageId,
            ack.status
          )
        break
      }
      case 'session.status':
        await this.#handleSessionStatus(channel, job)
        break
      case 'call.received':
        await this.#handleCall(channel, job)
        break
      default:
        // message.any duplicates `message`.
        break
    }
  }

  static async #handleSessionStatus(channel: Channel, job: InboundJob) {
    const wahaStatus = job.payload?.payload?.status as string | undefined
    const mapped = wahaStatus ? WAHA_STATUS_MAP[wahaStatus] : undefined
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
