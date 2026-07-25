import Message from '#models/message'
import Contact from '#models/contact'
import TenantContext from '#services/tenant_context'
import rabbitmq from '#services/messaging/rabbitmq'
import { EXCHANGES } from '#services/messaging/topology'
import searchService, { COLLECTIONS } from '#services/search/search_service'

export type SearchEntity = 'message' | 'contact'
export type SearchJob = {
  op: 'upsert' | 'delete'
  type: SearchEntity
  id: string
  tenantId: string
}

/**
 * Bridges Postgres writes into the Typesense index. Producers publish light
 * `SearchJob`s to `sf.search`; the search worker calls `process()`, which loads
 * the entity in its tenant scope and upserts/removes the corresponding document.
 */
export default class SearchIndexer {
  /** Fire-and-forget: enqueue an index job (best-effort — never blocks writes). */
  static async enqueue(op: SearchJob['op'], type: SearchEntity, id: string, tenantId: string) {
    if (!searchService.available) return
    await rabbitmq.publish(EXCHANGES.search, `${type}.${op}`, { op, type, id, tenantId })
  }

  static async process(job: SearchJob): Promise<void> {
    if (job.op === 'delete') {
      await searchService.remove(
        job.type === 'message' ? COLLECTIONS.messages : COLLECTIONS.contacts,
        job.id
      )
      return
    }

    await TenantContext.run(job.tenantId, async () => {
      if (job.type === 'message') {
        const message = await Message.query()
          .where('id', job.id)
          .preload('conversation', (q) => q.preload('contact'))
          .first()
        if (!message) return
        const doc = searchService.messageDoc(
          message,
          message.conversation?.contact?.displayName ?? '',
          message.conversation?.channelId ?? ''
        )
        await searchService.upsert(COLLECTIONS.messages, doc)
      } else {
        const contact = await Contact.find(job.id)
        if (!contact) return
        await searchService.upsert(COLLECTIONS.contacts, searchService.contactDoc(contact))
      }
    })
  }
}
