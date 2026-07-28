/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  // Node
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.string(),

  // App
  APP_KEY: Env.schema.secret(),
  APP_URL: Env.schema.string(),

  // Session
  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory', 'database'] as const),
  LIMITER_STORE: Env.schema.enum(['redis', 'memory'] as const),

  // Mail
  MAIL_MAILER: Env.schema.enum(['smtp', 'resend'] as const),
  MAIL_FROM_NAME: Env.schema.string(),
  MAIL_FROM_ADDRESS: Env.schema.string(),
  RESEND_API_KEY: Env.schema.string(),
  SMTP_HOST: Env.schema.string.optional(),
  SMTP_PORT: Env.schema.number.optional(),
  SMTP_USER: Env.schema.string.optional(),
  SMTP_PASSWORD: Env.schema.string.optional(),
  SMTP_FROM_NAME: Env.schema.string.optional(),
  SMTP_FROM_EMAIL: Env.schema.string.optional(),

  // Database (PostgreSQL)
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  // Redis
  REDIS_HOST: Env.schema.string({ format: 'host' }),
  REDIS_PORT: Env.schema.number(),
  REDIS_PASSWORD: Env.schema.string.optional(),

  // RabbitMQ
  RABBITMQ_URL: Env.schema.string.optional(),
  RABBITMQ_HOST: Env.schema.string.optional(),
  RABBITMQ_PORT: Env.schema.number.optional(),
  RABBITMQ_USER: Env.schema.string.optional(),
  RABBITMQ_PASSWORD: Env.schema.string.optional(),
  RABBITMQ_VHOST: Env.schema.string.optional(),

  // Minio
  MINIO_ACCESS_KEY: Env.schema.string(),
  MINIO_SECRET_KEY: Env.schema.string(),
  MINIO_REGION: Env.schema.string(),
  MINIO_BUCKET: Env.schema.string(),
  MINIO_BROWSER_REDIRECT_URL: Env.schema.string(),
  MINIO_SERVER_URL: Env.schema.string(),

  // Centrifugo
  CENTRIFUGO_URL: Env.schema.string.optional(),
  // Public websocket URL the browser connects to (e.g. wss://ws.domain in prod)
  CENTRIFUGO_WS_URL: Env.schema.string.optional(),
  CENTRIFUGO_TOKEN_SECRET: Env.schema.string(),
  CENTRIFUGO_API_KEY: Env.schema.string(),
  CENTRIFUGO_ADMIN_PASSWORD: Env.schema.string(),
  CENTRIFUGO_ADMIN_SECRET: Env.schema.string(),

  // Meta (Messenger / Instagram / WhatsApp Business — Graph API)
  META_APP_ID: Env.schema.string.optional(),
  META_APP_SECRET: Env.schema.string.optional(),
  META_WEBHOOK_VERIFY_TOKEN: Env.schema.string.optional(),
  META_GRAPH_API_VERSION: Env.schema.string.optional(),

  // Telegram (Bot API)
  TELEGRAM_WEBHOOK_SECRET: Env.schema.string.optional(),

  // WAHA (WhatsApp) — per-engine base URL + API key
  // Public URL WAHA uses to reach our webhook (e.g. http://host.docker.internal:3333 in dev)
  WAHA_WEBHOOK_BASE_URL: Env.schema.string.optional(),
  WAHA_WEBJS_URL: Env.schema.string.optional(),
  WAHA_WEBJS_API_KEY: Env.schema.string.optional(),
  WAHA_NOWEB_URL: Env.schema.string.optional(),
  WAHA_NOWEB_API_KEY: Env.schema.string.optional(),
  WAHA_GOWS_URL: Env.schema.string.optional(),
  WAHA_GOWS_API_KEY: Env.schema.string.optional(),

  // Typesense (search)
  TYPESENSE_API_KEY: Env.schema.string.optional(),
  TYPESENSE_HOST: Env.schema.string.optional(),
  TYPESENSE_PORT: Env.schema.number.optional(),
  TYPESENSE_PROTOCOL: Env.schema.enum.optional(['http', 'https'] as const),

  // Billing — Xendit (Phase 7)
  XENDIT_SECRET_KEY: Env.schema.string.optional(),
  XENDIT_PUBLIC_KEY: Env.schema.string.optional(),
  XENDIT_WEBHOOK_TOKEN: Env.schema.string.optional(),
  XENDIT_API_URL: Env.schema.string.optional(),
  MIDTRANS_MERCHANT_ID: Env.schema.string.optional(),
  MIDTRANS_SERVER_KEY: Env.schema.string.optional(),
  MIDTRANS_CLIENT_KEY: Env.schema.string.optional(),
  MIDTRANS_IS_PRODUCTION: Env.schema.boolean.optional(),
  PAYPAL_CLIENT_ID: Env.schema.string.optional(),
  PAYPAL_CLIENT_SECRET: Env.schema.string.optional(),
  PAYPAL_WEBHOOK_ID: Env.schema.string.optional(),
  PAYPAL_MODE: Env.schema.enum.optional(['sandbox', 'production'] as const),

  // AI providers (Phase 5) — bundled auto-reply / webchat bot
  AI_DEFAULT_PROVIDER: Env.schema.enum.optional(['claude', 'openai'] as const),
  AI_DEFAULT_MODEL: Env.schema.string.optional(),
  ANTHROPIC_API_KEY: Env.schema.string.optional(),
  OPENAI_API_KEY: Env.schema.string.optional(),

  // Observability & hardening (Phase 9)
  // Cloudflare Turnstile CAPTCHA (signup + webchat). No-op when secret unset.
  TURNSTILE_SECRET_KEY: Env.schema.string.optional(),
  TURNSTILE_SITE_KEY: Env.schema.string.optional(),
  // Sentry / GlitchTip DSN for error reporting. No-op when unset.
  ERROR_REPORTING_DSN: Env.schema.string.optional(),

  // Other
  ENABLE_REGISTRATION: Env.schema.boolean.optional(),
  DEFAULT_ADMIN_EMAIL: Env.schema.string.optional(),
  DEFAULT_ADMIN_PASSWORD: Env.schema.string.optional(),

  // Social OAuth
  GOOGLE_CLIENT_ID: Env.schema.string(),
  GOOGLE_CLIENT_SECRET: Env.schema.string(),
  GOOGLE_CALLBACK_URL: Env.schema.string.optional(),
  GITHUB_CLIENT_ID: Env.schema.string(),
  GITHUB_CLIENT_SECRET: Env.schema.string(),
  GITHUB_CALLBACK_URL: Env.schema.string.optional(),
  FACEBOOK_CLIENT_ID: Env.schema.string(),
  FACEBOOK_CLIENT_SECRET: Env.schema.string(),
  FACEBOOK_CALLBACK_URL: Env.schema.string.optional(),

  // Drive Storage
  DRIVE_DISK: Env.schema.enum(['fs', 's3'] as const),
  AWS_ACCESS_KEY_ID: Env.schema.string(),
  AWS_SECRET_ACCESS_KEY: Env.schema.string(),
  AWS_REGION: Env.schema.string(),
  S3_BUCKET: Env.schema.string(),
})
