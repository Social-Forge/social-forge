import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

/**
 * Long-running worker: consumes the AI queue and generates auto-replies in the
 * context of a conversation, debiting the tenant's AI credits.
 *
 *   node ace worker:ai
 */
export default class WorkerAi extends BaseCommand {
  static commandName = 'worker:ai'
  static description = 'Consume the AI queue and generate auto-replies'
  static options: CommandOptions = { startApp: true, staysAlive: true }

  async run() {
    const { default: queueConsumer } = await import('#services/messaging/queue_consumer')
    const { default: AiReplyService } = await import('#services/ai/ai_reply_service')
    const { default: rabbitmq } = await import('#services/messaging/rabbitmq')
    const { EXCHANGES, QUEUES } = await import('#services/messaging/topology')

    await queueConsumer.start<import('#services/ai/ai_reply_service').AiReplyJob>(
      {
        exchange: EXCHANGES.ai,
        queue: QUEUES.aiReply,
        prefetch: 5,
        maxRetries: 2,
        retryDelayMs: 2000,
      },
      (payload) => AiReplyService.process(payload)
    )

    this.logger.info('ai-agent worker running (Ctrl+C to stop)')
    this.app.terminating(async () => {
      await rabbitmq.close()
    })
  }
}
