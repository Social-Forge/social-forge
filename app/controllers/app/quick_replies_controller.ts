import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import QuickReply from '#models/quick_reply'
import Conversation from '#models/conversation'
import CatalogPolicy from '#policies/catalog_policy'
import MinioService from '#services/storage/minio_service'
import OutboundService from '#services/messaging/outbound_service'
import { buildQuickReplyContent } from '#services/catalog/quick_reply_content'
import { ROLES } from '#models/role'
import { hasServiceWindow, type ChannelType } from '#services/messaging/constants'
import type { MediaItem } from '#services/storage/media_helpers'
import {
  createQuickReplyValidator,
  sendQuickReplyValidator,
  updateQuickReplyValidator,
} from '#validators/catalog'

/**
 * Canned replies expanded via the "/shortcut" picker in the chat composer.
 * Text replies expand into the composer; media replies are sent directly via
 * the `send` action. Readable by any agent; managed by Supervisors+.
 */
export default class QuickRepliesController {
  async index({ bouncer, response }: HttpContext) {
    await bouncer.with(CatalogPolicy).authorize('viewAny')
    const replies = await QuickReply.query().orderBy('shortcut', 'asc')
    return response.ok(replies.map((r) => this.#serialize(r)))
  }

  async store({ bouncer, request, auth, response }: HttpContext) {
    await bouncer.with(CatalogPolicy).authorize('manage')
    const payload = await request.validateUsing(createQuickReplyValidator)

    const exists = await QuickReply.query().where('shortcut', payload.shortcut).first()
    if (exists) {
      return response.conflict({ message: 'A quick reply with that shortcut already exists.' })
    }

    const content = buildQuickReplyContent(
      payload.contentType ?? 'text',
      payload.body ?? null,
      (payload.mediaItems as MediaItem[] | undefined) ?? []
    )
    if ('error' in content) return response.unprocessableEntity({ message: content.error })

    const reply = await QuickReply.create({
      tenantId: auth.user!.tenantId!,
      shortcut: payload.shortcut,
      contentType: content.contentType,
      body: content.body,
      media: content.media,
    })
    return response.created(this.#serialize(reply))
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

    // Re-validate the content whenever type/body/media may have changed.
    const contentType = payload.contentType ?? reply.contentType
    const body = payload.body !== undefined ? payload.body : reply.body
    const items =
      payload.mediaItems !== undefined ? (payload.mediaItems as MediaItem[]) : reply.mediaItems
    const content = buildQuickReplyContent(contentType, body, items)
    if ('error' in content) return response.unprocessableEntity({ message: content.error })

    reply.contentType = content.contentType
    reply.body = content.body
    reply.media = content.media
    await reply.save()
    return response.ok(this.#serialize(reply))
  }

  async destroy({ bouncer, params, response }: HttpContext) {
    await bouncer.with(CatalogPolicy).authorize('manage')
    const reply = await QuickReply.findOrFail(params.id)
    await reply.delete()
    return response.noContent()
  }

  /** Send a quick reply (incl. its media) into a conversation. */
  async send({ auth, params, request, response }: HttpContext) {
    const user = auth.user!
    const conversation = await Conversation.findOrFail(params.id)

    const allowed = user.atLeast(ROLES.supervisor.level) || conversation.assignedAgentId === user.id
    if (!allowed) {
      return response.forbidden({ message: 'You are not assigned to this conversation.' })
    }

    const { quickReplyId } = await request.validateUsing(sendQuickReplyValidator)
    const reply = await QuickReply.findOrFail(quickReplyId)

    // Meta channels: free-form sends require an open 24-hour window.
    await conversation.load('channel')
    if (hasServiceWindow(conversation.channel.type as ChannelType)) {
      const expires = conversation.serviceWindowExpiresAt
      if (!expires || expires.toMillis() < DateTime.now().toMillis()) {
        return response.unprocessableEntity({
          message: 'Outside the 24-hour customer service window.',
        })
      }
    }

    const items = reply.mediaItems
    const body = reply.body

    if (!items.length) {
      await OutboundService.send(user, conversation, { contentType: 'text', body })
      return response.created({ sent: 1 })
    }

    // First media carries the caption; the rest are sent as separate messages.
    let sent = 0
    for (const [i, item] of items.entries()) {
      const url = await MinioService.presignedGetUrl(item.key).catch(() => null)
      if (!url) continue
      await OutboundService.send(user, conversation, {
        contentType: item.type,
        body: i === 0 ? body : null,
        mediaUrl: url,
      })
      sent++
    }
    return response.created({ sent })
  }

  #serialize(reply: QuickReply) {
    return { ...reply.serialize(), mediaItems: reply.mediaItems }
  }
}
