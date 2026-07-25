import env from '#start/env'
import logger from '@adonisjs/core/services/logger'
import type { WahaEngine } from '#services/messaging/constants'

/**
 * HTTP client for the self-hosted WAHA cluster. Each WAHA engine runs as its
 * own container (gows / noweb / webjs) with a distinct base URL + API key; a
 * channel selects the engine and owns one WAHA "session".
 *
 * Endpoint paths target the current WAHA API. They are centralized here so a
 * WAHA version bump only touches this file.
 */
type EngineConfig = { url: string; apiKey: string }

const DEFAULT_URLS: Record<WahaEngine, string> = {
  webjs: 'http://localhost:3000',
  noweb: 'http://localhost:3001',
  gows: 'http://localhost:3002',
}

/** WAHA webhook events we subscribe to per session. */
export const WAHA_WEBHOOK_EVENTS = [
  'message',
  'message.any',
  'message.ack',
  'session.status',
  'call.received',
] as const

export type WahaSendMedia = {
  type: 'image' | 'video' | 'audio' | 'document'
  url?: string
  data?: string // base64
  mimetype?: string
  filename?: string
  caption?: string
}

class WahaClient {
  #engineConfig(engine: WahaEngine): EngineConfig {
    const upper = engine.toUpperCase() as Uppercase<WahaEngine>
    return {
      url: env.get(`WAHA_${upper}_URL`, DEFAULT_URLS[engine]),
      apiKey: env.get(`WAHA_${upper}_API_KEY`, ''),
    }
  }

  async #request<T = any>(
    engine: WahaEngine,
    method: string,
    path: string,
    body?: unknown,
    timeoutMs = 15000
  ): Promise<T> {
    const { url, apiKey } = this.#engineConfig(engine)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(`${url}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Api-Key': apiKey,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      })
      const text = await res.text()
      const data = text ? JSON.parse(text) : null
      if (!res.ok) {
        throw new Error(`WAHA ${method} ${path} -> ${res.status}: ${text.slice(0, 300)}`)
      }
      return data as T
    } finally {
      clearTimeout(timer)
    }
  }

  /** Create + start a session wired to our webhook receiver. */
  async createSession(engine: WahaEngine, name: string, webhookUrl: string, webhookSecret: string) {
    return this.#request(engine, 'POST', '/api/sessions', {
      name,
      start: true,
      config: {
        webhooks: [
          {
            url: webhookUrl,
            events: WAHA_WEBHOOK_EVENTS,
            hmac: { key: webhookSecret },
            retries: { attempts: 3, delaySeconds: 2 },
          },
        ],
      },
    })
  }

  async getSession(engine: WahaEngine, name: string) {
    return this.#request(engine, 'GET', `/api/sessions/${name}`)
  }

  async startSession(engine: WahaEngine, name: string) {
    return this.#request(engine, 'POST', `/api/sessions/${name}/start`)
  }

  async stopSession(engine: WahaEngine, name: string) {
    return this.#request(engine, 'POST', `/api/sessions/${name}/stop`)
  }

  async logoutSession(engine: WahaEngine, name: string) {
    return this.#request(engine, 'POST', `/api/sessions/${name}/logout`)
  }

  async deleteSession(engine: WahaEngine, name: string) {
    return this.#request(engine, 'DELETE', `/api/sessions/${name}`)
  }

  /** Fetch the pairing QR code as a base64 PNG data URI. */
  async getQrImage(engine: WahaEngine, name: string): Promise<string> {
    const { url, apiKey } = this.#engineConfig(engine)
    const res = await fetch(`${url}/api/${name}/auth/qr?format=image`, {
      headers: { 'X-Api-Key': apiKey, 'Accept': 'image/png' },
    })
    if (!res.ok) {
      throw new Error(`WAHA QR ${name} -> ${res.status}`)
    }
    const buffer = Buffer.from(await res.arrayBuffer())
    return `data:image/png;base64,${buffer.toString('base64')}`
  }

  async sendText(
    engine: WahaEngine,
    session: string,
    chatId: string,
    text: string,
    replyTo?: string
  ) {
    return this.#request(engine, 'POST', '/api/sendText', {
      session,
      chatId,
      text,
      reply_to: replyTo,
    })
  }

  async sendMedia(engine: WahaEngine, session: string, chatId: string, media: WahaSendMedia) {
    const endpoint =
      media.type === 'image'
        ? '/api/sendImage'
        : media.type === 'video'
          ? '/api/sendVideo'
          : media.type === 'audio'
            ? '/api/sendVoice'
            : '/api/sendFile'

    const file = media.url
      ? { url: media.url }
      : { data: media.data, mimetype: media.mimetype, filename: media.filename }

    return this.#request(engine, 'POST', endpoint, {
      session,
      chatId,
      file,
      caption: media.caption,
    })
  }

  /** Best-effort auto-reject of an incoming call (GOWS engine). */
  async rejectCall(engine: WahaEngine, session: string, callId: string) {
    try {
      return await this.#request(engine, 'POST', `/api/${session}/calls/${callId}/reject`)
    } catch (error) {
      logger.warn({ err: error, session, callId }, 'failed to reject WAHA call')
      return null
    }
  }
}

export default new WahaClient()
