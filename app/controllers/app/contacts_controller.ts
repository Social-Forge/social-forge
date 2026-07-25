import type { HttpContext } from '@adonisjs/core/http'
import Contact from '#models/contact'
import SearchIndexer from '#services/search/search_indexer'
import ContactPolicy from '#policies/contact_policy'
import { updateContactValidator } from '#validators/contact'

type ContactAttributes = { email?: string | null; phone?: string | null; notes?: string | null }

export default class ContactsController {
  async index({ bouncer, request, response }: HttpContext) {
    await bouncer.with(ContactPolicy).authorize('viewAny')
    const page = Number(request.input('page', 1))
    const search = String(request.input('q', '')).trim()
    const blocked = request.input('blocked')

    const query = Contact.query().preload('channel').orderBy('display_name', 'asc')
    if (request.input('channelId')) query.where('channel_id', request.input('channelId'))
    if (blocked !== undefined) query.where('is_blocked', blocked === 'true' || blocked === true)
    if (search) {
      query.where((q) => {
        q.whereILike('display_name', `%${search}%`).orWhereILike('external_id', `%${search}%`)
      })
    }

    const contacts = await query.paginate(page, 30)
    return response.ok(contacts)
  }

  async show({ bouncer, params, response }: HttpContext) {
    const contact = await Contact.query().where('id', params.id).preload('channel').firstOrFail()
    await bouncer.with(ContactPolicy).authorize('view', contact)
    return response.ok(contact)
  }

  async update({ bouncer, params, request, response }: HttpContext) {
    const contact = await Contact.findOrFail(params.id)
    await bouncer.with(ContactPolicy).authorize('update', contact)
    const payload = await request.validateUsing(updateContactValidator)

    if (payload.displayName !== undefined) contact.displayName = payload.displayName

    const attrs = (contact.attributes as ContactAttributes | null) ?? {}
    if (payload.email !== undefined) attrs.email = payload.email
    if (payload.phone !== undefined) attrs.phone = payload.phone
    if (payload.notes !== undefined) attrs.notes = payload.notes
    contact.attributes = attrs

    await contact.save()
    await SearchIndexer.enqueue('upsert', 'contact', contact.id, contact.tenantId)
    return response.ok(contact)
  }

  async block({ bouncer, params, response }: HttpContext) {
    return this.#setBlocked(params.id, true, bouncer, response)
  }

  async unblock({ bouncer, params, response }: HttpContext) {
    return this.#setBlocked(params.id, false, bouncer, response)
  }

  async destroy({ bouncer, params, response }: HttpContext) {
    const contact = await Contact.findOrFail(params.id)
    await bouncer.with(ContactPolicy).authorize('delete', contact)
    await contact.delete()
    await SearchIndexer.enqueue('delete', 'contact', contact.id, contact.tenantId)
    return response.noContent()
  }

  /** Export all contacts as a CSV download. */
  async exportCsv({ bouncer, response }: HttpContext) {
    await bouncer.with(ContactPolicy).authorize('viewAny')
    const contacts = await Contact.query().preload('channel').orderBy('display_name', 'asc')

    const header = ['Name', 'Channel', 'External ID', 'Email', 'Phone', 'Blocked', 'Created At']
    const rows = contacts.map((c) => {
      const attrs = (c.attributes as ContactAttributes | null) ?? {}
      return [
        c.displayName ?? '',
        c.channel?.name ?? c.channel?.type ?? '',
        c.externalId,
        attrs.email ?? '',
        attrs.phone ?? '',
        c.isBlocked ? 'yes' : 'no',
        c.createdAt?.toISO() ?? '',
      ]
    })

    const csv = [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n')
    response.header('Content-Type', 'text/csv; charset=utf-8')
    response.header('Content-Disposition', 'attachment; filename="contacts.csv"')
    return response.send(csv)
  }

  async #setBlocked(
    id: string,
    blocked: boolean,
    bouncer: HttpContext['bouncer'],
    response: HttpContext['response']
  ) {
    const contact = await Contact.findOrFail(id)
    await bouncer.with(ContactPolicy).authorize('update', contact)
    contact.isBlocked = blocked
    await contact.save()
    return response.ok({ id: contact.id, isBlocked: contact.isBlocked })
  }
}

/** Quote a CSV cell when it contains a comma, quote, or newline. */
function csvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
