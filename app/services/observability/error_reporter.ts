import { randomUUID } from 'node:crypto'
import logger from '@adonisjs/core/services/logger'
import env from '#start/env'

/**
 * Env-gated error reporting. When `ERROR_REPORTING_DSN` (Sentry / GlitchTip) is
 * set, captured errors are POSTed as a minimal Sentry envelope; otherwise this
 * is a no-op — the framework already logs via pino. Kept dependency-free so no
 * SDK is required; a real SDK can replace this later behind the same interface.
 */
export default class ErrorReporter {
  static get enabled(): boolean {
    return Boolean(env.get('ERROR_REPORTING_DSN'))
  }

  static async capture(error: unknown, context: Record<string, unknown> = {}): Promise<void> {
    const dsn = env.get('ERROR_REPORTING_DSN')
    if (!dsn) return

    const parsed = this.#parseDsn(dsn)
    if (!parsed) return

    try {
      const err = error instanceof Error ? error : new Error(String(error))
      const eventId = randomUUID().replace(/-/g, '')
      const event = {
        event_id: eventId,
        timestamp: new Date().toISOString(),
        platform: 'node',
        level: 'error',
        exception: { values: [{ type: err.name, value: err.message }] },
        extra: context,
      }
      const envelope =
        `${JSON.stringify({ event_id: eventId, dsn })}\n` +
        `${JSON.stringify({ type: 'event' })}\n` +
        `${JSON.stringify(event)}\n`

      await fetch(parsed.envelopeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-sentry-envelope',
          'X-Sentry-Auth': parsed.auth,
        },
        body: envelope,
      })
    } catch (reportError) {
      logger.error({ err: reportError }, 'error reporter failed to deliver')
    }
  }

  static #parseDsn(dsn: string): { envelopeUrl: string; auth: string } | null {
    try {
      const url = new URL(dsn)
      const projectId = url.pathname.replace(/^\//, '')
      if (!projectId || !url.username) return null
      const envelopeUrl = `${url.protocol}//${url.host}/api/${projectId}/envelope/`
      const auth = `Sentry sentry_version=7, sentry_key=${url.username}, sentry_client=socialforge/1.0`
      return { envelopeUrl, auth }
    } catch {
      return null
    }
  }
}
