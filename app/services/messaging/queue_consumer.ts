import logger from '@adonisjs/core/services/logger'
import rabbitmq from '#services/messaging/rabbitmq'
import { EXCHANGES, type ExchangeName, type QueueName } from '#services/messaging/topology'

export type ConsumeOptions = {
  exchange: ExchangeName
  queue: QueueName
  /** Topic binding key (default '#' = everything on the exchange). */
  routingKey?: string
  /** Unacked messages allowed in flight per consumer. */
  prefetch?: number
  /** In-delivery retry attempts before dead-lettering. */
  maxRetries?: number
  /** Base delay between in-delivery retries (exponential backoff). */
  retryDelayMs?: number
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Thin wrapper over an amqplib channel that wires a durable work queue with a
 * dead-letter queue and drives a JSON message handler with bounded in-delivery
 * retries + exponential backoff. On final failure the message is dead-lettered
 * to `<queue>.dlq` (via the sf.dlx exchange) for inspection/replay rather than
 * being lost or infinitely requeued.
 */
export class QueueConsumer {
  async start<T = any>(
    options: ConsumeOptions,
    handler: (payload: T, raw: import('amqplib').ConsumeMessage) => Promise<void>
  ): Promise<void> {
    const {
      exchange,
      queue,
      routingKey = '#',
      prefetch = 10,
      maxRetries = 3,
      retryDelayMs = 1000,
    } = options

    const channel = await rabbitmq.channel()
    const deadLetterKey = queue

    // Dead-letter queue: terminal failures land here.
    await channel.assertQueue(`${queue}.dlq`, { durable: true })
    await channel.bindQueue(`${queue}.dlq`, EXCHANGES.deadLetter, deadLetterKey)

    // Main work queue → dead-letters to sf.dlx on nack(requeue=false).
    await channel.assertQueue(queue, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': EXCHANGES.deadLetter,
        'x-dead-letter-routing-key': deadLetterKey,
      },
    })
    await channel.bindQueue(queue, exchange, routingKey)
    await channel.prefetch(prefetch)

    logger.info({ queue, exchange, routingKey }, 'worker consuming')

    await channel.consume(queue, async (message: import('amqplib').ConsumeMessage | null) => {
      if (!message) return

      let payload: T
      try {
        payload = JSON.parse(message.content.toString()) as T
      } catch (error) {
        logger.error({ err: error, queue }, 'unparseable message → dead-lettering')
        channel.nack(message, false, false)
        return
      }

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          await handler(payload, message)
          channel.ack(message)
          return
        } catch (error) {
          const last = attempt === maxRetries
          logger.error(
            { err: error, queue, attempt, maxRetries },
            last ? 'handler failed → dead-lettering' : 'handler failed → retrying'
          )
          if (last) {
            channel.nack(message, false, false)
            return
          }
          await sleep(retryDelayMs * attempt)
        }
      }
    })
  }
}

export default new QueueConsumer()
