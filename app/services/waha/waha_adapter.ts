import type { MessageContentType, MessageStatus } from '#services/messaging/constants'

/**
 * Translates raw WAHA webhook payloads into the normalized message shape used
 * across the pipeline. Keeps all WAHA-specific field knowledge in one place.
 */
export type NormalizedInbound = {
  providerMessageId: string
  externalContactId: string
  contactName: string | null
  fromMe: boolean
  contentType: MessageContentType
  body: string | null
  media: NormalizedMedia | null
  timestamp: number // epoch seconds
}

export type NormalizedMedia = {
  url: string | null
  mimeType: string | null
  filename: string | null
}

const TYPE_MAP: Record<string, MessageContentType> = {
  chat: 'text',
  text: 'text',
  image: 'image',
  video: 'video',
  ptt: 'audio',
  audio: 'audio',
  voice: 'audio',
  document: 'document',
  location: 'location',
  sticker: 'sticker',
  vcard: 'contact',
  contact: 'contact',
}

export const WahaAdapter = {
  mapContentType(wahaType: string | undefined): MessageContentType {
    return TYPE_MAP[wahaType ?? ''] ?? 'text'
  },

  /** WAHA ack levels → delivery status. */
  mapAckStatus(ack: number | undefined): MessageStatus | null {
    switch (ack) {
      case 1:
        return 'sent'
      case 2:
        return 'delivered'
      case 3:
      case 4:
        return 'read'
      default:
        return null
    }
  },

  /**
   * Parse a WAHA `message` / `message.any` payload. Returns null when the
   * payload isn't a usable chat message.
   */
  parseMessage(wahaBody: any): NormalizedInbound | null {
    const m = wahaBody?.payload
    if (!m || !m.id || !m.from) return null

    const media: NormalizedMedia | null = m.hasMedia
      ? {
          url: m.media?.url ?? null,
          mimeType: m.media?.mimetype ?? null,
          filename: m.media?.filename ?? null,
        }
      : null

    return {
      providerMessageId: String(m.id),
      externalContactId: String(m.from),
      contactName: m._data?.notifyName ?? m.notifyName ?? null,
      fromMe: Boolean(m.fromMe),
      contentType: this.mapContentType(m.type),
      body: m.body ?? m.caption ?? null,
      media,
      timestamp: Number(m.timestamp) || Math.floor(Date.now() / 1000),
    }
  },

  /** Parse a `message.ack` payload → { providerMessageId, status }. */
  parseAck(wahaBody: any): { providerMessageId: string; status: MessageStatus } | null {
    const m = wahaBody?.payload
    const id = m?.id ?? m?.ids?.[0]
    if (!id) return null
    const status = this.mapAckStatus(m?.ack)
    if (!status) return null
    return { providerMessageId: String(id), status }
  },
}
