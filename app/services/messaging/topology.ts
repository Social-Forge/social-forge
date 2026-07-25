/**
 * Messaging topology for the Social Forge async pipeline.
 *
 * Every exchange is a durable `topic` exchange. Producers and consumers assert
 * the exchanges/queues they use at startup (idempotent), so the topology lives
 * here as the single source of truth — no broker-side definitions.json import
 * is required, and it survives broker restarts and fresh production deploys.
 *
 * Queue wiring (bindings, DLX, retry) is added per-worker in Phase 2+ when the
 * consumers are built. Phase 0 only needs the exchanges to exist.
 */
export const EXCHANGES = {
  /** Raw inbound events from channels (WAHA / Meta / Telegram webhooks). */
  inbound: 'sf.inbound',
  /** Outbound messages to be delivered to a provider. */
  outbound: 'sf.outbound',
  /** AI auto-reply / webchat bot jobs. */
  ai: 'sf.ai',
  /** Media mirror jobs (provider URL -> MinIO). */
  media: 'sf.media',
  /** Search index upsert jobs (-> Typesense). */
  search: 'sf.search',
  /** Push / email notification jobs. */
  notifications: 'sf.notifications',
  /** Dead-letter exchange for failed messages after retries are exhausted. */
  deadLetter: 'sf.dlx',
} as const

export type ExchangeName = (typeof EXCHANGES)[keyof typeof EXCHANGES]

/** All non-DLX exchanges, asserted on connect so publishers never race. */
export const TOPIC_EXCHANGES: ExchangeName[] = [
  EXCHANGES.inbound,
  EXCHANGES.outbound,
  EXCHANGES.ai,
  EXCHANGES.media,
  EXCHANGES.search,
  EXCHANGES.notifications,
]

/** Durable work queues consumed by the worker processes. */
export const QUEUES = {
  inboundNormalize: 'inbound.normalize',
  outboundDispatch: 'outbound.dispatch',
  mediaMirror: 'media.mirror',
} as const

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES]
