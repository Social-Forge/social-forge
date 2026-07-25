import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

/**
 * Long-running worker: consumes the inbound queue and normalizes provider
 * events into persisted messages + realtime broadcasts.
 *
 *   node ace worker:inbound
 */
export default class WorkerInbound extends BaseCommand {
  static commandName = 'worker:inbound'
  static description = 'Consume the inbound queue and normalize provider events'
  static options: CommandOptions = { startApp: true, staysAlive: true }

  async run() {
    const { default: queueConsumer } = await import('#services/messaging/queue_consumer')
    const { default: InboundRouter } = await import('#services/messaging/inbound/inbound_router')
    const { default: rabbitmq } = await import('#services/messaging/rabbitmq')
    const { EXCHANGES, QUEUES } = await import('#services/messaging/topology')

    await queueConsumer.start<import('#services/messaging/types').InboundJob>(
      { exchange: EXCHANGES.inbound, queue: QUEUES.inboundNormalize, prefetch: 20 },
      (payload) => InboundRouter.process(payload)
    )

    this.logger.info('inbound-normalizer worker running (Ctrl+C to stop)')
    this.app.terminating(async () => {
      await rabbitmq.close()
    })
  }
}
