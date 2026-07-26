import env from '#start/env'
import { createHmac } from 'node:crypto'
import logger from '@adonisjs/core/services/logger'

/**
 * Centrifugo integration (ARCHITECTURE.md §10).
 *
 * - Connection tokens authenticate a websocket connection (claim: sub).
 * - Subscription tokens authorize one channel at a time; the backend issues them
 *   only after checking tenant + role, which keeps conversation channels private
 *   without a subscribe-proxy.
 * - `publish()` is a server-to-server HTTP call used by workers to fan out
 *   messages/status to subscribed clients.
 *
 * Channel scheme (namespace `chat`):
 *   chat:tenant.{tid}.conversation.{cid}   — one conversation's messages/status
 *   chat:tenant.{tid}.inbox                — conversation-list updates (badges)
 *   chat:tenant.{tid}.agent.{uid}          — personal notifications
 */
const TOKEN_TTL_SECONDS = 60 * 60 * 8 // 8h connection token
const SUB_TTL_SECONDS = 60 * 60 // 1h subscription token

function base64url(input: string): string {
  return Buffer.from(input).toString('base64url')
}

function signJwt(payload: Record<string, unknown>, secret: string): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = base64url(JSON.stringify(payload))
  const data = `${header}.${body}`
  const signature = createHmac('sha256', secret).update(data).digest('base64url')
  return `${data}.${signature}`
}

class CentrifugoService {
  #secret() {
    return env.get('CENTRIFUGO_TOKEN_SECRET')
  }

  #apiUrl() {
    return env.get('CENTRIFUGO_URL', 'http://127.0.0.1:8000')
  }

  // --- channel name helpers -------------------------------------------------
  conversationChannel(tenantId: string, conversationId: string) {
    return `chat:tenant.${tenantId}.conversation.${conversationId}`
  }

  inboxChannel(tenantId: string) {
    return `chat:tenant.${tenantId}.inbox`
  }

  agentChannel(tenantId: string, userId: string) {
    return `chat:tenant.${tenantId}.agent.${userId}`
  }

  /** Invoice status updates for the checkout/invoice page. */
  billingInvoiceChannel(tenantId: string, invoiceId: string) {
    return `billing:tenant.${tenantId}.invoice.${invoiceId}`
  }

  // --- tokens ---------------------------------------------------------------
  connectionToken(userId: string): string {
    const now = Math.floor(Date.now() / 1000)
    return signJwt({ sub: userId, iat: now, exp: now + TOKEN_TTL_SECONDS }, this.#secret())
  }

  subscriptionToken(userId: string, channel: string): string {
    const now = Math.floor(Date.now() / 1000)
    return signJwt({ sub: userId, channel, iat: now, exp: now + SUB_TTL_SECONDS }, this.#secret())
  }

  // --- publish --------------------------------------------------------------
  async publish(channel: string, data: unknown): Promise<void> {
    try {
      const res = await fetch(`${this.#apiUrl()}/api/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': env.get('CENTRIFUGO_API_KEY'),
        },
        body: JSON.stringify({ channel, data }),
      })
      if (!res.ok) {
        logger.error({ channel, status: res.status }, 'centrifugo publish failed')
      }
    } catch (error) {
      // Realtime is best-effort — never let a broadcast failure break the pipeline.
      logger.error({ err: error, channel }, 'centrifugo publish error')
    }
  }
}

export default new CentrifugoService()
