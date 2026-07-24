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

  // mongodb
  MONGODB_HOST_PORT: Env.schema.string(),
  MONGO_INITDB_ROOT_USERNAME: Env.schema.string(),
  MONGO_INITDB_ROOT_PASSWORD: Env.schema.string.optional(),
  MONGO_INITDB_DATABASE: Env.schema.string(),

  // RabbitMQ
  HEALTHCHECK_ENQUEUE_ENABLED: Env.schema.boolean.optional(),
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
  CENTRIFUGO_TOKEN_SECRET: Env.schema.string(),
  CENTRIFUGO_API_KEY: Env.schema.string(),
  CENTRIFUGO_ADMIN_PASSWORD: Env.schema.string(),
  CENTRIFUGO_ADMIN_SECRET: Env.schema.string(),

  // Other
  ENABLE_REGISTRATION: Env.schema.boolean.optional(),
  DEFAULT_ADMIN_EMAIL: Env.schema.string.optional(),
  DEFAULT_ADMIN_PASSWORD: Env.schema.string.optional(),
})
