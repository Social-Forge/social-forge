import type { HttpContext } from '@adonisjs/core/http'
import QuickReply from '#models/quick_reply'
import CatalogPolicy from '#policies/catalog_policy'
import { createQuickReplyValidator, updateQuickReplyValidator } from '#validators/catalog'

/**
 * Canned replies expanded via the "/shortcut" picker in the chat composer.
 * Readable by any agent; managed by Supervisors+.
 */
export default class QuickRepliesController {
  async index({ bouncer, response }: HttpContext) {
    await bouncer.with(CatalogPolicy).authorize('viewAny')
    const replies = await QuickReply.query().orderBy('shortcut', 'asc')
    return response.ok(replies)
  }

  async store({ bouncer, request, auth, response }: HttpContext) {
    await bouncer.with(CatalogPolicy).authorize('manage')
    const payload = await request.validateUsing(createQuickReplyValidator)

    const exists = await QuickReply.query().where('shortcut', payload.shortcut).first()
    if (exists) {
      return response.conflict({ message: 'A quick reply with that shortcut already exists.' })
    }

    const reply = await QuickReply.create({
      tenantId: auth.user!.tenantId!,
      shortcut: payload.shortcut,
      contentType: payload.contentType ?? 'text',
      body: payload.body ?? null,
      media: payload.media ?? null,
    })
    return response.created(reply)
  }

  async update({ bouncer, params, request, response }: HttpContext) {
    await bouncer.with(CatalogPolicy).authorize('manage')
    const reply = await QuickReply.findOrFail(params.id)
    const payload = await request.validateUsing(updateQuickReplyValidator)

    if (payload.shortcut !== undefined && payload.shortcut !== reply.shortcut) {
      const clash = await QuickReply.query()
        .where('shortcut', payload.shortcut)
        .whereNot('id', reply.id)
        .first()
      if (clash) {
        return response.conflict({ message: 'A quick reply with that shortcut already exists.' })
      }
      reply.shortcut = payload.shortcut
    }
    if (payload.contentType !== undefined) reply.contentType = payload.contentType
    if (payload.body !== undefined) reply.body = payload.body
    if (payload.media !== undefined) reply.media = payload.media
    await reply.save()
    return response.ok(reply)
  }

  async destroy({ bouncer, params, response }: HttpContext) {
    await bouncer.with(CatalogPolicy).authorize('manage')
    const reply = await QuickReply.findOrFail(params.id)
    await reply.delete()
    return response.noContent()
  }
}
