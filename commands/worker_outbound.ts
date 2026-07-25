import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

/**
 * Long-running worker: delivers outbound messages to their providers.
 *
 *   node ace worker:outbound
 */
export default class WorkerOutbound extends BaseCommand {
  static commandName = 'worker:outbound'
  static description = 'Consume the outbound queue and deliver messages to providers'
  static options: CommandOptions = { startApp: true, staysAlive: true }

  async run() {
    const { default: queueConsumer } = await import('#services/messaging/queue_consumer')
    const { default: OutboundDispatcher } = await import('#services/messaging/outbound_dispatcher')
    const { default: rabbitmq } = await import('#services/messaging/rabbitmq')
    const { EXCHANGES, QUEUES } = await import('#services/messaging/topology')

    await queueConsumer.start<import('#services/messaging/outbound_dispatcher').OutboundJob>(
      {
        exchange: EXCHANGES.outbound,
        queue: QUEUES.outboundDispatch,
        prefetch: 10,
        maxRetries: 5,
        retryDelayMs: 1500,
      },
      (payload) => OutboundDispatcher.dispatch(payload)
    )

    this.logger.info('outbound-dispatcher worker running (Ctrl+C to stop)')
    this.app.terminating(async () => {
      await rabbitmq.close()
    })
  }
}
