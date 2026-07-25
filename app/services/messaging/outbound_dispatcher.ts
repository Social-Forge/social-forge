import { randomUUID } from 'node:crypto'
import redis from '@adonisjs/redis/services/main'
import logger from '@adonisjs/core/services/logger'
import Message from '#models/message'
import MessageOutbox from '#models/message_outbox'
import type Channel from '#models/channel'
import type Contact from '#models/contact'
import TenantContext from '#services/tenant_context'
import centrifugo from '#services/realtime/centrifugo_service'
import wahaClient from '#services/waha/waha_client'
import telegramClient from '#services/telegram/telegram_client'
import { TelegramAdapter } from '#services/telegram/telegram_adapter'
import metaClient from '#services/meta/meta_client'
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
    const replyProviderId = await this.#resolveReplyProviderId(message)

    switch (channel.type) {
      case 'whatsapp_waha':
        return this.#sendWaha(channel, contact, message, replyProviderId)
      case 'telegram':
        return this.#sendTelegram(channel, contact, message, replyProviderId)
      case 'messenger':
      case 'instagram':
        return this.#sendMessenger(channel, contact, message)
      case 'whatsapp_meta':
        return this.#sendWhatsAppMeta(channel, contact, message)
      case 'webchat':
        // No external provider — the visitor widget receives the message via the
        // realtime broadcast already emitted at send time / on poll. Just assign
        // a synthetic id and mark it delivered.
        return `webchat:${randomUUID()}`
      default:
        throw new Error(`Outbound not supported for channel type "${channel.type}"`)
    }
  }

  static async #resolveReplyProviderId(message: Message): Promise<string | undefined> {
    if (!message.replyToId) return undefined
    const replied = await Message.find(message.replyToId)
    return replied?.providerMessageId ?? undefined
  }

  static async #sendWaha(
    channel: Channel,
    contact: Contact,
    message: Message,
    replyTo?: string
  ): Promise<string> {
    const engine = (channel.wahaEngine as WahaEngine) ?? 'gows'
    const session = channel.wahaSessionName!
    const media = message.media as { url?: string } | null

    if (message.contentType === 'text' || !media?.url) {
      const res = await wahaClient.sendText(
        engine,
        session,
        contact.externalId,
        message.body ?? '',
        replyTo
      )
      return extractProviderId(res)
    }
    const mediaType = (
      ['image', 'video', 'audio'].includes(message.contentType) ? message.contentType : 'document'
    ) as 'image' | 'video' | 'audio' | 'document'
    const res = await wahaClient.sendMedia(engine, session, contact.externalId, {
      type: mediaType,
      url: media.url,
      caption: message.body ?? undefined,
    })
    return extractProviderId(res)
  }

  static async #sendTelegram(
    channel: Channel,
    contact: Contact,
    message: Message,
    replyProviderId?: string
  ): Promise<string> {
    const token = channel.getCredential('botToken')
    if (!token) throw new Error('Telegram bot token missing')
    const chatId = contact.externalId
    const replyMessageId = replyProviderId ? Number(replyProviderId.split(':').pop()) : undefined
    const media = message.media as { url?: string } | null

    if (message.contentType === 'image' && media?.url) {
      const res = await telegramClient.sendPhoto(
        token,
        chatId,
        media.url,
        message.body ?? undefined
      )
      return TelegramAdapter.compositeId(chatId, res.message_id)
    }
    const res = await telegramClient.sendMessage(token, chatId, message.body ?? '', replyMessageId)
    return TelegramAdapter.compositeId(chatId, res.message_id)
  }

  static async #sendMessenger(
    channel: Channel,
    contact: Contact,
    message: Message
  ): Promise<string> {
    const token = channel.getCredential('pageAccessToken')
    if (!token) throw new Error('Meta page access token missing')
    const media = message.media as { url?: string } | null

    if (media?.url) {
      const type = (
        ['image', 'video', 'audio'].includes(message.contentType) ? message.contentType : 'file'
      ) as 'image' | 'video' | 'audio' | 'file'
      return metaClient.sendMessengerAttachment(token, contact.externalId, type, media.url)
    }
    return metaClient.sendMessengerText(token, contact.externalId, message.body ?? '')
  }

  static async #sendWhatsAppMeta(
    channel: Channel,
    contact: Contact,
    message: Message
  ): Promise<string> {
    const token = channel.getCredential('accessToken')
    if (!token || !channel.externalId) throw new Error('WhatsApp Business credentials missing')

    if (message.contentType === 'template') {
      const tpl = (message.media as { template?: { name: string; languageCode?: string } } | null)
        ?.template
      if (!tpl?.name) throw new Error('Template payload missing')
      return metaClient.sendWhatsAppTemplate(token, channel.externalId, contact.externalId, {
        name: tpl.name,
        languageCode: tpl.languageCode ?? 'en',
      })
    }

    return metaClient.sendWhatsAppText(
      token,
      channel.externalId,
      contact.externalId,
      message.body ?? ''
    )
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
