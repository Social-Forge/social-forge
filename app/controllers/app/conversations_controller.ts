import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import Conversation from '#models/conversation'
import Message from '#models/message'
import ConversationEvent from '#models/conversation_event'
import centrifugo from '#services/realtime/centrifugo_service'
import { ROLES } from '#models/role'

const assignValidator = vine.create({ agentId: vine.string().uuid().optional() })

/**
 * Chat portal endpoints. Reads are tenant-scoped by the mixin; agents are
 * limited to their assigned conversations. Every mutation logs a
 * conversation_event and broadcasts to the tenant inbox + conversation channels.
 */
export default class ConversationsController {
  async index({ auth, response }: HttpContext) {
    const user = auth.user!
    const query = Conversation.query()
      .preload('contact')
      .preload('channel')
      .preload('labels')
      .preload('messages', (q) => q.groupLimit(1).groupOrderBy('created_at', 'desc'))
      .orderBy('last_message_at', 'desc')
      .limit(200)

    if (!user.atLeast(ROLES.supervisor.level)) {
      query.where('assigned_agent_id', user.id)
    }

    return response.ok(await query)
  }

  async messages({ params, response }: HttpContext) {
    const conversation = await Conversation.findOrFail(params.id)
    const messages = await Message.query()
      .where('conversation_id', conversation.id)
      .whereNull('deleted_at')
      .orderBy('created_at', 'asc')
      .limit(300)
    return response.ok(messages)
  }

  async markRead({ params, response }: HttpContext) {
    const conversation = await Conversation.findOrFail(params.id)
    conversation.unreadCount = 0
    await conversation.save()
    await this.#broadcast(conversation)
    return response.ok(conversation)
  }

  async assign({ auth, params, request, response }: HttpContext) {
    const user = auth.user!
    const conversation = await Conversation.findOrFail(params.id)
    const { agentId } = await request.validateUsing(assignValidator)

    // Supervisors+ can assign anyone; agents can only claim for themselves.
    const target = agentId && user.atLeast(ROLES.supervisor.level) ? agentId : user.id
    conversation.assignedAgentId = target
    conversation.status = 'open'
    await conversation.save()
    await this.#logEvent(conversation, user.id, 'assigned', { agentId: target })
    await this.#broadcast(conversation)
    return response.ok(conversation)
  }

  async unassign({ auth, params, response }: HttpContext) {
    const conversation = await Conversation.findOrFail(params.id)
    conversation.assignedAgentId = null
    conversation.status = 'unassigned'
    await conversation.save()
    await this.#logEvent(conversation, auth.user!.id, 'unassigned', {})
    await this.#broadcast(conversation)
    return response.ok(conversation)
  }

  async complete({ auth, params, response }: HttpContext) {
    const conversation = await Conversation.findOrFail(params.id)
    conversation.status = 'completed'
    await conversation.save()
    await this.#logEvent(conversation, auth.user!.id, 'completed', {})
    await this.#broadcast(conversation)
    return response.ok(conversation)
  }

  async reopen({ auth, params, response }: HttpContext) {
    const conversation = await Conversation.findOrFail(params.id)
    conversation.status = conversation.assignedAgentId ? 'open' : 'unassigned'
    await conversation.save()
    await this.#logEvent(conversation, auth.user!.id, 'reopened', {})
    await this.#broadcast(conversation)
    return response.ok(conversation)
  }

  async #logEvent(
    conversation: Conversation,
    actorId: string,
    type: string,
    metadata: Record<string, unknown>
  ) {
    await ConversationEvent.create({
      tenantId: conversation.tenantId,
      conversationId: conversation.id,
      actorId,
      type,
      metadata,
    })
  }

  async #broadcast(conversation: Conversation) {
    await centrifugo.publish(centrifugo.inboxChannel(conversation.tenantId), {
      type: 'conversation.updated',
      conversation: conversation.serialize(),
    })
  }
}
