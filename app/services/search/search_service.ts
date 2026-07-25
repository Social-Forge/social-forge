import { createHmac } from 'node:crypto'
import env from '#start/env'
import logger from '@adonisjs/core/services/logger'
import type Message from '#models/message'
import type Contact from '#models/contact'

/** Typesense collection names. */
export const COLLECTIONS = {
  messages: 'messages',
  contacts: 'contacts',
} as const

export type SearchCollection = (typeof COLLECTIONS)[keyof typeof COLLECTIONS]

type MessageDoc = {
  id: string
  tenant_id: string
  conversation_id: string
  channel_id: string
  contact_name: string
  body: string
  direction: string
  created_at: number
}

type ContactDoc = {
  id: string
  tenant_id: string
  channel_id: string
  display_name: string
  external_id: string
  created_at: number
}

/** Collection schemas asserted at startup / reindex. */
const SCHEMAS: Record<
  SearchCollection,
  { name: string; fields: any[]; default_sorting_field?: string }
> = {
  messages: {
    name: COLLECTIONS.messages,
    fields: [
      { name: 'tenant_id', type: 'string', facet: true },
      { name: 'conversation_id', type: 'string' },
      { name: 'channel_id', type: 'string' },
      { name: 'contact_name', type: 'string' },
      { name: 'body', type: 'string' },
      { name: 'direction', type: 'string' },
      { name: 'created_at', type: 'int64' },
    ],
    default_sorting_field: 'created_at',
  },
  contacts: {
    name: COLLECTIONS.contacts,
    fields: [
      { name: 'tenant_id', type: 'string', facet: true },
      { name: 'channel_id', type: 'string' },
      { name: 'display_name', type: 'string' },
      { name: 'external_id', type: 'string' },
      { name: 'created_at', type: 'int64' },
    ],
    default_sorting_field: 'created_at',
  },
}

/** `query_by` fields per collection. */
const QUERY_BY: Record<SearchCollection, string> = {
  messages: 'body,contact_name',
  contacts: 'display_name,external_id',
}

/**
 * Typesense search layer over raw HTTP (the repo has no typesense client dep,
 * mirroring the WAHA/Meta/Centrifugo HTTP style). Search is best-effort: when
 * Typesense is unconfigured or unreachable, indexing is a no-op and search
 * returns empty results so the chat pipeline never breaks.
 */
class SearchService {
  get available(): boolean {
    return Boolean(env.get('TYPESENSE_API_KEY'))
  }

  // --- document mappers (pure) ---------------------------------------------
  messageDoc(message: Message, contactName: string, channelId: string): MessageDoc {
    return {
      id: message.id,
      tenant_id: message.tenantId,
      conversation_id: message.conversationId,
      channel_id: channelId,
      contact_name: contactName,
      body: message.body ?? '',
      direction: message.direction,
      created_at: Math.floor((message.createdAt?.toMillis() ?? Date.now()) / 1000),
    }
  }

  contactDoc(contact: Contact): ContactDoc {
    return {
      id: contact.id,
      tenant_id: contact.tenantId,
      channel_id: contact.channelId,
      display_name: contact.displayName ?? '',
      external_id: contact.externalId,
      created_at: Math.floor((contact.createdAt?.toMillis() ?? Date.now()) / 1000),
    }
  }

  /**
   * Typesense scoped search key: embeds a `tenant_id` filter into an HMAC-signed
   * key so a browser can search directly without seeing other tenants' data.
   */
  scopedSearchKey(searchKey: string, tenantId: string): string {
    const params = JSON.stringify({ filter_by: `tenant_id:=${tenantId}` })
    const digest = createHmac('sha256', searchKey).update(params).digest('base64')
    return Buffer.from(digest + searchKey.slice(0, 4) + params).toString('base64')
  }

  // --- HTTP client ----------------------------------------------------------
  #base(): string {
    const protocol = env.get('TYPESENSE_PROTOCOL', 'http')
    const host = env.get('TYPESENSE_HOST', '127.0.0.1')
    const port = env.get('TYPESENSE_PORT', 8108)
    return `${protocol}://${host}:${port}`
  }

  #headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-TYPESENSE-API-KEY': env.get('TYPESENSE_API_KEY', ''),
    }
  }

  /** Create the collections if they don't exist (idempotent). */
  async ensureCollections(): Promise<void> {
    if (!this.available) return
    for (const schema of Object.values(SCHEMAS)) {
      try {
        const res = await fetch(`${this.#base()}/collections`, {
          method: 'POST',
          headers: this.#headers(),
          body: JSON.stringify(schema),
        })
        // 409 = already exists → fine.
        if (!res.ok && res.status !== 409) {
          logger.warn({ status: res.status, collection: schema.name }, 'typesense create failed')
        }
      } catch (error) {
        logger.error({ err: error, collection: schema.name }, 'typesense create error')
      }
    }
  }

  /** Upsert a document into a collection. */
  async upsert(collection: SearchCollection, doc: Record<string, unknown>): Promise<void> {
    if (!this.available) return
    try {
      await fetch(`${this.#base()}/collections/${collection}/documents?action=upsert`, {
        method: 'POST',
        headers: this.#headers(),
        body: JSON.stringify(doc),
      })
    } catch (error) {
      logger.error({ err: error, collection }, 'typesense upsert error')
    }
  }

  /** Remove a document by id (ignores not-found). */
  async remove(collection: SearchCollection, id: string): Promise<void> {
    if (!this.available) return
    try {
      await fetch(`${this.#base()}/collections/${collection}/documents/${id}`, {
        method: 'DELETE',
        headers: this.#headers(),
      })
    } catch (error) {
      logger.error({ err: error, collection, id }, 'typesense remove error')
    }
  }

  /**
   * Search a collection, scoped to a tenant. Returns hit documents with an added
   * `_highlight` map. Empty array when search is unavailable.
   */
  async search(
    collection: SearchCollection,
    query: string,
    tenantId: string,
    perPage = 20
  ): Promise<Array<Record<string, any>>> {
    if (!this.available || !query.trim()) return []
    const params = new URLSearchParams({
      q: query,
      query_by: QUERY_BY[collection],
      filter_by: `tenant_id:=${tenantId}`,
      per_page: String(perPage),
      sort_by: '_text_match:desc,created_at:desc',
      highlight_full_fields: QUERY_BY[collection],
    })
    try {
      const res = await fetch(
        `${this.#base()}/collections/${collection}/documents/search?${params}`,
        { headers: this.#headers() }
      )
      if (!res.ok) return []
      const data: any = await res.json()
      return (data.hits ?? []).map((hit: any) => ({
        ...hit.document,
        _highlight: hit.highlight ?? {},
      }))
    } catch (error) {
      logger.error({ err: error, collection }, 'typesense search error')
      return []
    }
  }
}

export default new SearchService()
