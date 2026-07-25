import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

/**
 * Long-running worker: mirrors Meta/Telegram media into MinIO.
 *
 *   node ace worker:media
 */
export default class WorkerMedia extends BaseCommand {
  static commandName = 'worker:media'
  static description = 'Consume the media queue and mirror provider media to MinIO'
  static options: CommandOptions = { startApp: true, staysAlive: true }

  async run() {
    const { default: queueConsumer } = await import('#services/messaging/queue_consumer')
    const { default: MediaMirror } = await import('#services/messaging/media_mirror')
    const { default: rabbitmq } = await import('#services/messaging/rabbitmq')
    const { EXCHANGES, QUEUES } = await import('#services/messaging/topology')

    await queueConsumer.start<import('#services/messaging/media_mirror').MediaJob>(
      { exchange: EXCHANGES.media, queue: QUEUES.mediaMirror, prefetch: 5, maxRetries: 3 },
      (payload) => MediaMirror.process(payload)
    )

    this.logger.info('media-mirror worker running (Ctrl+C to stop)')
    this.app.terminating(async () => {
      await rabbitmq.close()
    })
  }
}
