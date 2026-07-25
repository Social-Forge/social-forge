import type { HttpContext } from '@adonisjs/core/http'
import { createHmac, timingSafeEqual } from 'node:crypto'
import env from '#start/env'
import logger from '@adonisjs/core/services/logger'
import Channel from '#models/channel'
import rabbitmq from '#services/messaging/rabbitmq'
import { EXCHANGES } from '#services/messaging/topology'
import { MetaAdapter, type MetaObject } from '#services/meta/meta_adapter'
import type { ChannelType } from '#services/messaging/constants'

/**
 * Public entry point for provider webhooks. Verifies the per-channel secret,
 * then hands off to the async pipeline (RabbitMQ) as fast as possible — the
 * receiver never does heavy work inline, so providers get a quick 200.
 *
 * This route has no auth/tenant middleware (called by WAHA/Meta/Telegram) and
 * is excluded from CSRF in config/shield.ts.
 */
export default class WebhooksController {
  async waha({ params, request, response }: HttpContext) {
    // No tenant context on this route → Channel query is unscoped (system-level).
    const channel = await Channel.find(params.channelId)
    if (!channel) {
      return response.notFound({ message: 'Unknown channel' })
    }

    if (!this.#verifyHmac(channel.webhookSecret, request.raw(), request.header('x-webhook-hmac'))) {
      logger.warn({ channelId: channel.id }, 'WAHA webhook HMAC verification failed')
      return response.unauthorized({ message: 'Invalid signature' })
    }

    const payload = request.body()
    const event = (payload?.event as string) ?? 'unknown'

    await rabbitmq.publish(EXCHANGES.inbound, `waha.${event}`, {
      provider: 'waha',
      channelId: channel.id,
      tenantId: channel.tenantId,
      event,
      payload,
      receivedAt: new Date().toISOString(),
    })

    return response.ok({ received: true })
  }

  // --- Telegram -------------------------------------------------------------
  // Per-channel webhook; verified by the secret token set via setWebhook.
  async telegram({ params, request, response }: HttpContext) {
    const channel = await Channel.find(params.channelId)
    if (!channel) {
      return response.notFound({ message: 'Unknown channel' })
    }
    const secret = request.header('x-telegram-bot-api-secret-token')
    if (channel.webhookSecret && secret !== channel.webhookSecret) {
      logger.warn({ channelId: channel.id }, 'Telegram webhook secret mismatch')
      return response.unauthorized({ message: 'Invalid secret token' })
    }

    await rabbitmq.publish(EXCHANGES.inbound, 'telegram.update', {
      provider: 'telegram',
      channelId: channel.id,
      tenantId: channel.tenantId,
      event: 'update',
      payload: request.body(),
      receivedAt: new Date().toISOString(),
    })

    return response.ok({ received: true })
  }

  // --- Meta (Messenger / Instagram / WhatsApp Business) ---------------------
  // Meta uses ONE app-level webhook URL; entries are routed to channels by the
  // page id / phone_number_id carried in the payload.

  /** Webhook verification handshake (GET). */
  async metaVerify({ request, response }: HttpContext) {
    const mode = request.input('hub.mode')
    const token = request.input('hub.verify_token')
    const challenge = request.input('hub.challenge')
    if (mode === 'subscribe' && token && token === env.get('META_WEBHOOK_VERIFY_TOKEN')) {
      return response.ok(challenge)
    }
    return response.forbidden('Verification failed')
  }

  /** Event delivery (POST) — verified with the app secret (X-Hub-Signature-256). */
  async meta({ request, response }: HttpContext) {
    if (!this.#verifyMetaSignature(request.raw(), request.header('x-hub-signature-256'))) {
      logger.warn('Meta webhook signature verification failed')
      return response.unauthorized({ message: 'Invalid signature' })
    }

    const body = request.body()
    const object = body?.object as MetaObject
    for (const entry of body?.entry ?? []) {
      const externalId = MetaAdapter.resolveExternalId(object, entry)
      if (!externalId) continue
      const channel = await this.#resolveMetaChannel(object, externalId)
      if (!channel) continue

      await rabbitmq.publish(EXCHANGES.inbound, `meta.${object}`, {
        provider: 'meta',
        channelId: channel.id,
        tenantId: channel.tenantId,
        event: object,
        payload: { object, entry },
        receivedAt: new Date().toISOString(),
      })
    }

    // Meta requires a fast 200 regardless of per-entry routing outcome.
    return response.ok({ received: true })
  }

  #verifyMetaSignature(rawBody: string | null, signature: string | null | undefined): boolean {
    const secret = env.get('META_APP_SECRET')
    if (!secret) return true // dev without an app secret configured
    if (!signature || !rawBody) return false
    const expected = 'sha256=' + createHmac('sha256', secret).update(rawBody).digest('hex')
    const a = Buffer.from(signature)
    const b = Buffer.from(expected)
    return a.length === b.length && timingSafeEqual(a, b)
  }

  #resolveMetaChannel(object: MetaObject, externalId: string) {
    const type: ChannelType =
      object === 'whatsapp_business_account'
        ? 'whatsapp_meta'
        : object === 'instagram'
          ? 'instagram'
          : 'messenger'
    return Channel.query().where('type', type).where('external_id', externalId).first()
  }

  /**
   * WAHA signs the raw body with HMAC-SHA512 using the channel's webhook secret
   * (configured as `hmac.key` on the session). Verification is skipped only
   * when no secret is set (local/dev sessions without HMAC).
   */
  #verifyHmac(
    secret: string | null,
    rawBody: string | null,
    signature: string | null | undefined
  ): boolean {
    if (!secret) return true
    if (!signature || !rawBody) return false
    const expected = createHmac('sha512', secret).update(rawBody).digest('hex')
    const a = Buffer.from(signature)
    const b = Buffer.from(expected)
    return a.length === b.length && timingSafeEqual(a, b)
  }
}
