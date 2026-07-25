import type { MessageContentType } from '#services/messaging/constants'
import type { NormalizedInboundMessage } from '#services/messaging/types'

/**
 * Parses a Telegram Bot API update into the shared normalized shape.
 *
 * Telegram `message_id` is unique per chat, not globally, so the provider
 * message id is composed as `{chatId}:{messageId}` to stay globally unique.
 */
export const TelegramAdapter = {
  compositeId(chatId: string | number, messageId: string | number): string {
    return `${chatId}:${messageId}`
  },

  parseUpdate(update: any): NormalizedInboundMessage | null {
    const message = update?.message ?? update?.edited_message
    if (!message?.chat?.id || !message.message_id) return null

    const chatId = String(message.chat.id)
    const from = message.from ?? {}
    const name =
      [from.first_name, from.last_name].filter(Boolean).join(' ') || from.username || null

    let contentType: MessageContentType = 'text'
    let media: NormalizedInboundMessage['media'] = null

    if (Array.isArray(message.photo) && message.photo.length) {
      contentType = 'image'
      const largest = message.photo[message.photo.length - 1]
      media = {
        url: null,
        mimeType: 'image/jpeg',
        filename: null,
        providerMediaId: largest.file_id,
      }
    } else if (message.video) {
      contentType = 'video'
      media = {
        url: null,
        mimeType: message.video.mime_type ?? null,
        filename: message.video.file_name ?? null,
        providerMediaId: message.video.file_id,
      }
    } else if (message.voice || message.audio) {
      contentType = 'audio'
      const node = message.voice ?? message.audio
      media = {
        url: null,
        mimeType: node.mime_type ?? null,
        filename: null,
        providerMediaId: node.file_id,
      }
    } else if (message.document) {
      contentType = 'document'
      media = {
        url: null,
        mimeType: message.document.mime_type ?? null,
        filename: message.document.file_name ?? null,
        providerMediaId: message.document.file_id,
      }
    } else if (message.sticker) {
      contentType = 'sticker'
      media = {
        url: null,
        mimeType: null,
        filename: null,
        providerMediaId: message.sticker.file_id,
      }
    } else if (message.location) {
      contentType = 'location'
    }

    return {
      providerMessageId: this.compositeId(chatId, message.message_id),
      externalContactId: chatId,
      contactName: name,
      fromMe: Boolean(from.is_bot),
      contentType,
      body: message.text ?? message.caption ?? null,
      media,
      timestamp: Number(message.date) || Math.floor(Date.now() / 1000),
    }
  },
}
