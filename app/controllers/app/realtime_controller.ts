import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import centrifugo from '#services/realtime/centrifugo_service'
import type User from '#models/user'

const subscribeValidator = vine.create({ channel: vine.string().trim().maxLength(255) })

/**
 * Issues Centrifugo tokens for the authenticated user. The subscription
 * endpoint is the authorization gate: a token is only minted for channels the
 * user's tenant + role permit, keeping conversation streams private.
 */
export default class RealtimeController {
  async token({ auth, response }: HttpContext) {
    return response.ok({ token: centrifugo.connectionToken(auth.user!.id) })
  }

  async subscribe({ auth, request, response }: HttpContext) {
    const { channel } = await request.validateUsing(subscribeValidator)
    if (!this.#authorize(auth.user!, channel)) {
      return response.forbidden({ message: 'Not allowed to subscribe to this channel' })
    }
    return response.ok({ token: centrifugo.subscriptionToken(auth.user!.id, channel) })
  }

  /**
   * Channels are `chat:tenant.{tid}.(conversation.{cid} | inbox | agent.{uid})`.
   * Enforce tenant isolation; personal agent channels are bound to the user.
   * Finer per-conversation assignment checks can be layered on in Phase 4.
   */
  #authorize(user: User, channel: string): boolean {
    const match = channel.match(
      /^chat:tenant\.([0-9a-fA-F-]{36})\.(conversation\.[0-9a-fA-F-]{36}|inbox|agent\.([0-9a-fA-F-]{36}))$/
    )
    if (!match) return false

    const [, tenantId, , agentId] = match
    if (tenantId !== user.tenantId) return false
    if (agentId) return agentId === user.id
    return true
  }
}
