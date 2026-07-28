import logger from '@adonisjs/core/services/logger'
import MinioService from '#services/storage/minio_service'
import OutboundService from '#services/messaging/outbound_service'
import type Channel from '#models/channel'
import type Conversation from '#models/conversation'
import type { MessageContentType } from '#services/messaging/constants'

/**
 * Per-channel canned first-reply for brand-new contacts. Sent once when a
 * contact writes for the very first time. An AI agent on the channel overrides
 * this entirely (the AI worker handles the greeting), so this is a no-op when a
 * bot is attached.
 */
export default class AutoReplyService {
  static async maybeSendFirstReply(channel: Channel, conversation: Conversation): Promise<void> {
    // AI overrides the canned first-reply.
    if (channel.aiAgentId) return

    const cfg = channel.firstReplyConfig
    if (!cfg?.enabled) return

    const body = cfg.body?.trim() || null
    const items = cfg.mediaItems ?? []

    try {
      if (cfg.contentType === 'text') {
        if (body) await OutboundService.sendAi(conversation, body)
        return
      }

      if (cfg.contentType === 'hybrid') {
        const first = items[0]
        const url = first ? await MinioService.presignedGetUrl(first.key).catch(() => null) : null
        if (url && first) {
          await OutboundService.sendAi(conversation, body, {
            contentType: first.type as MessageContentType,
            mediaUrl: url,
          })
        } else if (body) {
          await OutboundService.sendAi(conversation, body)
        }
        return
      }

      // image | video | document → up to 5 media; the first carries the caption.
      for (const [i, item] of items.entries()) {
        const url = await MinioService.presignedGetUrl(item.key).catch(() => null)
        if (!url) continue
        await OutboundService.sendAi(conversation, i === 0 ? body : null, {
          contentType: item.type as MessageContentType,
          mediaUrl: url,
        })
      }
    } catch (error) {
      logger.error({ err: error, channelId: channel.id }, 'failed to send channel first-reply')
    }
  }
}
