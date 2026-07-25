import type { HttpContext } from '@adonisjs/core/http'
import redis from '@adonisjs/redis/services/main'
import WebchatService from '#services/webchat/webchat_service'

/** Per-visitor send throttle: messages allowed per rolling window. */
const SEND_LIMIT = 10
const SEND_WINDOW_SECONDS = 10

/**
 * Public (unauthenticated) endpoints for the embeddable webchat widget. The
 * visitor identity is a self-issued opaque id echoed back on every request; it
 * scopes a contact + conversation inside the channel's tenant. No cookies, no
 * auth middleware — isolation comes from resolving everything through the
 * channel and its tenant.
 */
export default class WebchatController {
  /** Create or resume a visitor session; returns the initial history. */
  async session({ params, request, response }: HttpContext) {
    const channel = await WebchatService.loadChannel(params.channelId)
    if (!channel) return response.notFound({ message: 'Webchat channel not found.' })

    const { visitorId, conversationId } = await WebchatService.session(channel, {
      visitorId: request.input('visitorId'),
      name: request.input('name'),
    })
    const messages = await WebchatService.history(channel, visitorId)

    return response.ok({
      visitorId,
      conversationId,
      channel: { name: channel.name },
      messages,
    })
  }

  /** Ingest a visitor message. */
  async send({ params, request, response }: HttpContext) {
    const channel = await WebchatService.loadChannel(params.channelId)
    if (!channel) return response.notFound({ message: 'Webchat channel not found.' })

    const visitorId = String(request.input('visitorId', '')).trim()
    const body = String(request.input('body', '')).trim()
    if (!visitorId || !body) {
      return response.badRequest({ message: 'visitorId and body are required.' })
    }
    if (body.length > 4000) {
      return response.badRequest({ message: 'Message too long.' })
    }

    if (!(await this.#allow(channel.id, visitorId))) {
      return response.tooManyRequests({ message: 'Slow down a moment.' })
    }

    await WebchatService.receive(channel, visitorId, body)
    return response.accepted({ ok: true })
  }

  /** Poll for messages after an optional ISO cursor. */
  async poll({ params, request, response }: HttpContext) {
    const channel = await WebchatService.loadChannel(params.channelId)
    if (!channel) return response.notFound({ message: 'Webchat channel not found.' })

    const visitorId = String(request.input('visitorId', '')).trim()
    if (!visitorId) return response.badRequest({ message: 'visitorId is required.' })

    const messages = await WebchatService.history(channel, visitorId, request.input('after'))
    return response.ok({ messages })
  }

  async #allow(channelId: string, visitorId: string): Promise<boolean> {
    const key = `rl:wc:${channelId}:${visitorId}:${Math.floor(Date.now() / 1000 / SEND_WINDOW_SECONDS)}`
    const count = await redis.incr(key)
    if (count === 1) await redis.expire(key, SEND_WINDOW_SECONDS)
    return count <= SEND_LIMIT
  }
}
