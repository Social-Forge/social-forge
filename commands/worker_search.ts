import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

/**
 * Long-running worker: syncs Postgres writes into the Typesense search index.
 *
 *   node ace worker:search
 */
export default class WorkerSearch extends BaseCommand {
  static commandName = 'worker:search'
  static description = 'Consume the search queue and index documents into Typesense'
  static options: CommandOptions = { startApp: true, staysAlive: true }

  async run() {
    const { default: queueConsumer } = await import('#services/messaging/queue_consumer')
    const { default: SearchIndexer } = await import('#services/search/search_indexer')
    const { default: searchService } = await import('#services/search/search_service')
    const { default: rabbitmq } = await import('#services/messaging/rabbitmq')
    const { EXCHANGES, QUEUES } = await import('#services/messaging/topology')

    await searchService.ensureCollections()

    await queueConsumer.start<import('#services/search/search_indexer').SearchJob>(
      { exchange: EXCHANGES.search, queue: QUEUES.searchIndex, prefetch: 20 },
      (payload) => SearchIndexer.process(payload)
    )

    this.logger.info('search-indexer worker running (Ctrl+C to stop)')
    this.app.terminating(async () => {
      await rabbitmq.close()
    })
  }
}
