import type { HttpContext } from '@adonisjs/core/http'
import searchService, { COLLECTIONS } from '#services/search/search_service'

/**
 * Full-text search across the tenant's messages and contacts (Typesense).
 * Results are tenant-scoped by the search layer's `filter_by`; each hit carries
 * a `_highlight` map for the UI to render match snippets.
 */
export default class SearchController {
  async index({ auth, request, response }: HttpContext) {
    const query = String(request.input('q', '')).trim()
    const tenantId = auth.user!.tenantId!

    if (!query) {
      return response.ok({ query, messages: [], contacts: [], available: searchService.available })
    }

    const [messages, contacts] = await Promise.all([
      searchService.search(COLLECTIONS.messages, query, tenantId),
      searchService.search(COLLECTIONS.contacts, query, tenantId),
    ])

    return response.ok({ query, messages, contacts, available: searchService.available })
  }
}
