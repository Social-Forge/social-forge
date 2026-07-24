import env from '#start/env'

/**
 * Typesense connection settings for the Social Forge search layer.
 *
 * The search collections + a `search-indexer` worker that syncs Postgres ->
 * Typesense are built in Phase 6. This config only centralises the connection
 * details so the health check and future client share one source of truth.
 */
const typesenseConfig = {
  apiKey: env.get('TYPESENSE_API_KEY', ''),
  nodes: [
    {
      host: env.get('TYPESENSE_HOST', '127.0.0.1'),
      port: env.get('TYPESENSE_PORT', 8108),
      protocol: env.get('TYPESENSE_PROTOCOL', 'http'),
    },
  ],
  /** Seconds a search request may take before Typesense aborts it. */
  connectionTimeoutSeconds: 5,
}

export default typesenseConfig
