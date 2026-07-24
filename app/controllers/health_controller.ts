import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'
import db from '@adonisjs/lucid/services/db'
import redis from '@adonisjs/redis/services/main'
import rabbitmq from '#services/messaging/rabbitmq'

type ServiceStatus = { status: 'up' | 'down'; error?: string; latencyMs: number }

async function check(fn: () => Promise<unknown>): Promise<ServiceStatus> {
  const started = Date.now()
  try {
    await fn()
    return { status: 'up', latencyMs: Date.now() - started }
  } catch (error) {
    return {
      status: 'down',
      error: error instanceof Error ? error.message : String(error),
      latencyMs: Date.now() - started,
    }
  }
}

/** HTTP GET with a hard timeout so a hung dependency can't stall the probe. */
async function httpOk(url: string, timeoutMs = 3000): Promise<void> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`)
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Liveness/readiness probe for the whole Social Forge stack. Returns 200 when
 * every dependency is reachable, 503 otherwise. Used by Docker healthchecks,
 * Nginx upstream checks, and manual verification during Phase 0.
 */
export default class HealthController {
  async index({ response }: HttpContext) {
    const centrifugoUrl = env.get('CENTRIFUGO_URL', 'http://127.0.0.1:8000')
    const typesenseUrl = `${env.get('TYPESENSE_PROTOCOL', 'http')}://${env.get('TYPESENSE_HOST', '127.0.0.1')}:${env.get('TYPESENSE_PORT', 8108)}`
    const minioUrl = env.get('MINIO_SERVER_URL', 'http://127.0.0.1:9000')

    const [postgres, redisStatus, rabbit, minio, centrifugo, typesense] = await Promise.all([
      check(() => db.rawQuery('select 1')),
      check(() => redis.ping()),
      check(() => rabbitmq.channel()),
      check(() => httpOk(`${minioUrl}/minio/health/ready`)),
      check(() => httpOk(`${centrifugoUrl}/health`)),
      check(() => httpOk(`${typesenseUrl}/health`)),
    ])

    const services = {
      postgres,
      redis: redisStatus,
      rabbitmq: rabbit,
      minio,
      centrifugo,
      typesense,
    }
    const healthy = Object.values(services).every((s) => s.status === 'up')

    return response.status(healthy ? 200 : 503).json({
      status: healthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services,
    })
  }
}
