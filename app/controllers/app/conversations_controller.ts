import type { HttpContext } from '@adonisjs/core/http'
import Conversation from '#models/conversation'
import Message from '#models/message'
import { ROLES } from '#models/role'

/**
 * Read endpoints for the chat portal. Reads are tenant-scoped by the mixin; the
 * rich filtering + assignment views arrive with the chat UI in Phase 4.
 */
export default class ConversationsController {
  async index({ auth, response }: HttpContext) {
    const user = auth.user!
    const query = Conversation.query()
      .preload('contact')
      .preload('channel')
      .orderBy('last_message_at', 'desc')
      .limit(100)

    // Agents only see conversations assigned to them; supervisors+ see all.
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
      .limit(200)
    return response.ok(messages)
  }
}
