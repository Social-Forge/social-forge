import type { HttpContext } from '@adonisjs/core/http'
import Label from '#models/label'
import Conversation from '#models/conversation'
import CatalogPolicy from '#policies/catalog_policy'
import centrifugo from '#services/realtime/centrifugo_service'
import { createLabelValidator, updateLabelValidator } from '#validators/catalog'

export default class LabelsController {
  async index({ bouncer, response }: HttpContext) {
    await bouncer.with(CatalogPolicy).authorize('viewAny')
    const labels = await Label.query().orderBy('name', 'asc')
    return response.ok(labels)
  }

  async store({ bouncer, request, auth, response }: HttpContext) {
    await bouncer.with(CatalogPolicy).authorize('manage')
    const payload = await request.validateUsing(createLabelValidator)

    const exists = await Label.query().where('name', payload.name).first()
    if (exists) return response.conflict({ message: 'A label with that name already exists.' })

    const label = await Label.create({
      tenantId: auth.user!.tenantId!,
      name: payload.name,
      color: payload.color ?? '#64748b',
    })
    return response.created(label)
  }

  async update({ bouncer, params, request, response }: HttpContext) {
    await bouncer.with(CatalogPolicy).authorize('manage')
    const label = await Label.findOrFail(params.id)
    const payload = await request.validateUsing(updateLabelValidator)

    if (payload.name !== undefined && payload.name !== label.name) {
      const clash = await Label.query().where('name', payload.name).whereNot('id', label.id).first()
      if (clash) return response.conflict({ message: 'A label with that name already exists.' })
      label.name = payload.name
    }
    if (payload.color !== undefined) label.color = payload.color
    await label.save()
    return response.ok(label)
  }

  async destroy({ bouncer, params, response }: HttpContext) {
    await bouncer.with(CatalogPolicy).authorize('manage')
    const label = await Label.findOrFail(params.id)
    await label.delete()
    return response.noContent()
  }

  /** Attach a label to a conversation. */
  async attach({ bouncer, params, request, response }: HttpContext) {
    await bouncer.with(CatalogPolicy).authorize('viewAny')
    const conversation = await Conversation.findOrFail(params.conversationId)
    const labelId = String(request.input('labelId', ''))
    const label = await Label.find(labelId)
    if (!label) return response.badRequest({ message: 'Label not found.' })

    // sync (detach=false) is idempotent — adds without removing existing labels.
    await conversation.related('labels').sync([label.id], false)
    await this.#broadcast(conversation)
    return response.ok({ conversationId: conversation.id, labelId: label.id })
  }

  /** Detach a label from a conversation. */
  async detach({ bouncer, params, response }: HttpContext) {
    await bouncer.with(CatalogPolicy).authorize('viewAny')
    const conversation = await Conversation.findOrFail(params.conversationId)
    await conversation.related('labels').detach([params.labelId])
    await this.#broadcast(conversation)
    return response.noContent()
  }

  async #broadcast(conversation: Conversation) {
    const labels = await conversation.related('labels').query()
    await centrifugo.publish(centrifugo.inboxChannel(conversation.tenantId), {
      type: 'conversation.labels',
      conversationId: conversation.id,
      labels: labels.map((l) => l.serialize()),
    })
  }
}
