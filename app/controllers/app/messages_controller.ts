import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Conversation from '#models/conversation'
import OutboundService from '#services/messaging/outbound_service'
import { sendMessageValidator } from '#validators/message'
import { ROLES } from '#models/role'
import { hasServiceWindow, type ChannelType } from '#services/messaging/constants'

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

    // Meta channels: free-form replies are only allowed inside the 24-hour
    // customer service window; outside it, an approved template is required.
    await conversation.load('channel')
    const isTemplate = (payload.contentType ?? 'text') === 'template' || !!payload.template
    if (hasServiceWindow(conversation.channel.type as ChannelType) && !isTemplate) {
      const expires = conversation.serviceWindowExpiresAt
      if (!expires || expires.toMillis() < DateTime.now().toMillis()) {
        return response.unprocessableEntity({
          message:
            'Outside the 24-hour customer service window. Send an approved template instead.',
        })
      }
    }

    const message = await OutboundService.send(user, conversation, payload)
    return response.created(message)
  }
}
