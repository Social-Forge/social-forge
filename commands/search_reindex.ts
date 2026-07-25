import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

/**
 * One-shot: (re)create the Typesense collections and bulk-index every message
 * and contact directly (bypassing the queue). Run after a schema change or to
 * backfill an empty index.
 *
 *   node ace search:reindex
 */
export default class SearchReindex extends BaseCommand {
  static commandName = 'search:reindex'
  static description = 'Rebuild the Typesense index from Postgres'
  static options: CommandOptions = { startApp: true }

  async run() {
    const { default: Message } = await import('#models/message')
    const { default: Contact } = await import('#models/contact')
    const { default: TenantContext } = await import('#services/tenant_context')
    const { default: searchService, COLLECTIONS } = await import('#services/search/search_service')

    if (!searchService.available) {
      this.logger.warning('TYPESENSE_API_KEY not set — skipping reindex')
      return
    }

    await searchService.ensureCollections()

    // Bypass tenant scoping to walk every row; the docs carry tenant_id.
    await TenantContext.runBypassed(async () => {
      const contacts = await Contact.query()
      for (const contact of contacts) {
        await searchService.upsert(COLLECTIONS.contacts, searchService.contactDoc(contact))
      }
      this.logger.info(`indexed ${contacts.length} contacts`)

      const messages = await Message.query().preload('conversation', (q) => q.preload('contact'))
      for (const message of messages) {
        const doc = searchService.messageDoc(
          message,
          message.conversation?.contact?.displayName ?? '',
          message.conversation?.channelId ?? ''
        )
        await searchService.upsert(COLLECTIONS.messages, doc)
      }
      this.logger.info(`indexed ${messages.length} messages`)
    })

    this.logger.success('reindex complete')
  }
}
