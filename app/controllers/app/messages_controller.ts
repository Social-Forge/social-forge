import type { HttpContext } from '@adonisjs/core/http'
import Conversation from '#models/conversation'
import OutboundService from '#services/messaging/outbound_service'
import { sendMessageValidator } from '#validators/message'
import { ROLES } from '#models/role'

export default class MessagesController {
  /** Send an outbound message in a conversation (enqueues via the outbox). */
  async store({ auth, params, request, response }: HttpContext) {
    const user = auth.user!
    const conversation = await Conversation.findOrFail(params.id)

    // Supervisors+ may send anywhere in the tenant; agents only where assigned.
    const allowed = user.atLeast(ROLES.supervisor.level) || conversation.assignedAgentId === user.id
    if (!allowed) {
      return response.forbidden({ message: 'You are not assigned to this conversation.' })
    }

    const payload = await request.validateUsing(sendMessageValidator)
    const message = await OutboundService.send(user, conversation, payload)
    return response.created(message)
  }
}
