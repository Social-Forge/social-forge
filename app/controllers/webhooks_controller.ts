import type { HttpContext } from '@adonisjs/core/http'
import { createHmac, timingSafeEqual } from 'node:crypto'
import logger from '@adonisjs/core/services/logger'
import Channel from '#models/channel'
import rabbitmq from '#services/messaging/rabbitmq'
import { EXCHANGES } from '#services/messaging/topology'

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
      channelId: channel.id,
      tenantId: channel.tenantId,
      event,
      payload,
      receivedAt: new Date().toISOString(),
    })

    return response.ok({ received: true })
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
