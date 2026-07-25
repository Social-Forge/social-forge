import { randomUUID } from 'node:crypto'
import redis from '@adonisjs/redis/services/main'
import logger from '@adonisjs/core/services/logger'
import Message from '#models/message'
import MessageOutbox from '#models/message_outbox'
import TenantContext from '#services/tenant_context'
import centrifugo from '#services/realtime/centrifugo_service'
import wahaClient from '#services/waha/waha_client'
import type { WahaEngine } from '#services/messaging/constants'

export type OutboundJob = { messageId: string; tenantId: string }

const RATE_LIMIT_PER_SECOND = 15

function extractProviderId(res: any): string {
  if (res) {
    if (typeof res.id === 'string') return res.id
    if (res.id?._serialized) return res.id._serialized
    if (typeof res._serialized === 'string') return res._serialized
  }
  return randomUUID()
}

/**
 * Delivers a `pending` outbound message to its provider, driving the outbox
 * state machine. Transient failures throw (worker retries with backoff);
 * once `attempts` hits `maxAttempts` the message is marked `failed` and the
 * job is acked so it stops retrying.
 */
export default class OutboundDispatcher {
  static async dispatch(job: OutboundJob): Promise<void> {
    await TenantContext.run(job.tenantId, () => this.#process(job))
  }

  static async #process(job: OutboundJob) {
    const message = await Message.query()
      .where('id', job.messageId)
      .preload('conversation', (q) => q.preload('channel').preload('contact'))
      .first()

    if (!message || message.status !== 'pending') return

    // Per-channel throttle. Thrown before the send try/catch so a throttle
    // hit triggers a retry without counting as a delivery attempt.
    await this.#rateLimit(message.conversation.channel.id)

    const outbox = await MessageOutbox.query().where('message_id', message.id).first()

    try {
      message.providerMessageId = await this.#sendViaChannel(message)
      message.status = 'sent'
      await message.save()
      if (outbox) {
        outbox.status = 'sent'
        await outbox.save()
      }
      await this.#broadcastStatus(message)
    } catch (error) {
      const err = error instanceof Error ? error.message : String(error)
      if (outbox) {
        outbox.attempts += 1
        outbox.lastError = err
        if (outbox.attempts >= outbox.maxAttempts) {
          outbox.status = 'failed'
          await outbox.save()
          message.status = 'failed'
          message.error = err
          await message.save()
          await this.#broadcastStatus(message)
          logger.error({ messageId: message.id, err }, 'outbound message permanently failed')
          return // terminal → ack
        }
        outbox.status = 'pending'
        await outbox.save()
      }
      throw error // transient → retry
    }
  }

  static async #sendViaChannel(message: Message): Promise<string> {
    const channel = message.conversation.channel
    const contact = message.conversation.contact

    if (channel.type !== 'whatsapp_waha') {
      throw new Error(`Outbound not supported for channel type "${channel.type}" yet`)
    }

    const engine = (channel.wahaEngine as WahaEngine) ?? 'gows'
    const session = channel.wahaSessionName!
    const chatId = contact.externalId

    let replyTo: string | undefined
    if (message.replyToId) {
      const replied = await Message.find(message.replyToId)
      replyTo = replied?.providerMessageId ?? undefined
    }

    const media = message.media as { url?: string } | null
    if (message.contentType === 'text' || !media?.url) {
      const res = await wahaClient.sendText(engine, session, chatId, message.body ?? '', replyTo)
      return extractProviderId(res)
    }

    const mediaType = (
      ['image', 'video', 'audio'].includes(message.contentType) ? message.contentType : 'document'
    ) as 'image' | 'video' | 'audio' | 'document'
    const res = await wahaClient.sendMedia(engine, session, chatId, {
      type: mediaType,
      url: media.url,
      caption: message.body ?? undefined,
    })
    return extractProviderId(res)
  }

  static async #broadcastStatus(message: Message) {
    await centrifugo.publish(
      centrifugo.conversationChannel(message.tenantId, message.conversationId),
      {
        type: 'message.status',
        id: message.id,
        status: message.status,
        providerMessageId: message.providerMessageId,
      }
    )
  }

  static async #rateLimit(channelId: string) {
    const key = `rl:ch:${channelId}:${Math.floor(Date.now() / 1000)}`
    const count = await redis.incr(key)
    if (count === 1) await redis.expire(key, 2)
    if (count > RATE_LIMIT_PER_SECOND) {
      throw new Error('channel rate limit exceeded')
    }
  }
}
