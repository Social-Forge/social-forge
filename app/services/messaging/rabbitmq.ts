import env from '#start/env'
import logger from '@adonisjs/core/services/logger'
import { EXCHANGES, TOPIC_EXCHANGES, type ExchangeName } from '#services/messaging/topology'

/**
 * Thin, generic RabbitMQ connection manager + publisher for the Social Forge
 * async pipeline. It maintains a single lazily-established connection/channel
 * shared across the process, asserts the topic exchanges on connect, and
 * exposes a small `publish()` API. Consumers (workers) are built on top of the
 * same channel in later phases.
 *
 * Typing note: the installed `amqplib` is loaded dynamically and treated as
 * `any` to stay resilient across minor API/version differences. The public
 * surface of this service is fully typed.
 */
type PublishOptions = {
  /** Delivery persisted to disk (survives broker restart). Default: true. */
  persistent?: boolean
  /** Message TTL in milliseconds. */
  expiration?: number
  /** Correlation id for tracing/idempotency. */
  messageId?: string
  /** Arbitrary AMQP headers. */
  headers?: Record<string, unknown>
}

class RabbitMQService {
  #connection: any = null
  #channel: any = null
  #connecting: Promise<void> | null = null

  /**
   * Object-form connection options — avoids URL-encoding issues when the
   * password contains reserved characters like `@`. Falls back to RABBITMQ_URL
   * when provided.
   */
  connectionConfig(): string | Record<string, unknown> {
    const url = env.get('RABBITMQ_URL')
    if (url) return url

    return {
      protocol: 'amqp',
      hostname: env.get('RABBITMQ_HOST', '127.0.0.1'),
      port: Number(env.get('RABBITMQ_PORT', 5672)),
      username: env.get('RABBITMQ_USER', 'guest'),
      password: env.get('RABBITMQ_PASSWORD', 'guest'),
      vhost: env.get('RABBITMQ_VHOST', '/'),
      heartbeat: 30,
    }
  }

  /** True once a live channel is available. */
  isConnected(): boolean {
    return this.#channel !== null
  }

  async #establish(): Promise<void> {
    const amqp: any = await import('amqplib')
    const connect = amqp.connect ?? amqp.default?.connect

    const conn = await connect(this.connectionConfig())
    const channel = await conn.createChannel()

    // Assert the durable topic exchanges + the dead-letter exchange so
    // publishers never race a missing exchange.
    for (const exchange of TOPIC_EXCHANGES) {
      await channel.assertExchange(exchange, 'topic', { durable: true })
    }
    await channel.assertExchange(EXCHANGES.deadLetter, 'topic', { durable: true })

    conn.on('error', (err: Error) => logger.error({ err }, 'rabbitmq connection error'))
    conn.on('close', () => {
      logger.warn('rabbitmq connection closed')
      this.#connection = null
      this.#channel = null
    })

    this.#connection = conn
    this.#channel = channel
    logger.info('rabbitmq connected + exchanges asserted')
  }

  /** Ensure a live connection/channel, coalescing concurrent connects. */
  async channel(): Promise<any> {
    if (this.#channel) return this.#channel
    if (!this.#connecting) {
      this.#connecting = this.#establish().finally(() => {
        this.#connecting = null
      })
    }
    await this.#connecting
    return this.#channel
  }

  /**
   * Publish a JSON payload to an exchange with a routing key.
   * Returns true if the broker accepted the message into its buffer.
   */
  async publish(
    exchange: ExchangeName,
    routingKey: string,
    payload: unknown,
    options: PublishOptions = {}
  ): Promise<boolean> {
    const channel = await this.channel()
    const body = Buffer.from(JSON.stringify(payload))

    return channel.publish(exchange, routingKey, body, {
      persistent: options.persistent ?? true,
      contentType: 'application/json',
      messageId: options.messageId,
      expiration: options.expiration,
      headers: options.headers,
      timestamp: Date.now(),
    })
  }

  /** Gracefully close the channel + connection (used on app shutdown). */
  async close(): Promise<void> {
    try {
      await this.#channel?.close()
      await this.#connection?.close()
    } catch (err) {
      logger.error({ err }, 'error while closing rabbitmq')
    } finally {
      this.#channel = null
      this.#connection = null
    }
  }
}

export default new RabbitMQService()
