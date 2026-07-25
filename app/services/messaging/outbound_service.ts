import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import Message from '#models/message'
import MessageOutbox from '#models/message_outbox'
import rabbitmq from '#services/messaging/rabbitmq'
import centrifugo from '#services/realtime/centrifugo_service'
import { EXCHANGES } from '#services/messaging/topology'
import type Conversation from '#models/conversation'
import type User from '#models/user'
import type { MessageContentType } from '#services/messaging/constants'

export type SendMessageInput = {
  contentType?: MessageContentType
  body?: string | null
  mediaUrl?: string | null
  replyToId?: string | null
}

/**
 * Enqueues an outbound message using the transactional outbox pattern: the
 * message (status=pending) and its outbox row are written atomically, then the
 * work item is published to RabbitMQ for the dispatcher. Clients see the
 * pending message immediately via an optimistic broadcast.
 */
export default class OutboundService {
  static async send(
    user: User,
    conversation: Conversation,
    input: SendMessageInput
  ): Promise<Message> {
    const contentType = input.contentType ?? 'text'
    const media = input.mediaUrl ? { url: input.mediaUrl } : null

    const message = await db.transaction(async (trx) => {
      const created = await Message.create(
        {
          tenantId: user.tenantId!,
          conversationId: conversation.id,
          direction: 'out',
          senderType: 'agent',
          senderId: user.id,
          contentType,
          body: input.body ?? null,
          media,
          replyToId: input.replyToId ?? null,
          status: 'pending',
        },
        { client: trx }
      )

      await MessageOutbox.create(
        { tenantId: user.tenantId!, messageId: created.id, status: 'pending' },
        { client: trx }
      )

      conversation.useTransaction(trx)
      conversation.lastMessageAt = DateTime.now()
      await conversation.save()

      return created
    })

    await rabbitmq.publish(
      EXCHANGES.outbound,
      'waha.send',
      { messageId: message.id, tenantId: user.tenantId },
      { messageId: message.id }
    )

    await centrifugo.publish(centrifugo.conversationChannel(user.tenantId!, conversation.id), {
      type: 'message.new',
      message: message.serialize(),
    })

    return message
  }
}
