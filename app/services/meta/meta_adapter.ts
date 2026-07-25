import type { MessageContentType, MessageStatus } from '#services/messaging/constants'
import type { NormalizedInboundMessage, DeliveryStatusUpdate } from '#services/messaging/types'

/**
 * Parses Meta webhook entries into the shared normalized shape. Handles both
 * the Messenger/Instagram `messaging[]` structure and the WhatsApp Business
 * `changes[].value` structure (which are quite different).
 */
export type MetaObject = 'page' | 'instagram' | 'whatsapp_business_account'

export type MetaParseResult = {
  messages: NormalizedInboundMessage[]
  statuses: DeliveryStatusUpdate[]
}

const WA_TYPE_MAP: Record<string, MessageContentType> = {
  text: 'text',
  image: 'image',
  video: 'video',
  audio: 'audio',
  voice: 'audio',
  document: 'document',
  location: 'location',
  sticker: 'sticker',
  contacts: 'contact',
}

const WA_STATUS_MAP: Record<string, MessageStatus> = {
  sent: 'sent',
  delivered: 'delivered',
  read: 'read',
  failed: 'failed',
}

const MESSENGER_ATTACHMENT_MAP: Record<string, MessageContentType> = {
  image: 'image',
  video: 'video',
  audio: 'audio',
  file: 'document',
}

export const MetaAdapter = {
  parseEntry(object: MetaObject, entry: any): MetaParseResult {
    if (object === 'whatsapp_business_account') {
      return this.parseWhatsApp(entry)
    }
    return this.parseMessenger(entry)
  },

  /** Resolve the provider-side account id used to map an entry to a channel. */
  resolveExternalId(object: MetaObject, entry: any): string | null {
    if (object === 'whatsapp_business_account') {
      return entry?.changes?.[0]?.value?.metadata?.phone_number_id ?? null
    }
    return entry?.id ?? null
  },

  parseWhatsApp(entry: any): MetaParseResult {
    const messages: NormalizedInboundMessage[] = []
    const statuses: DeliveryStatusUpdate[] = []

    for (const change of entry?.changes ?? []) {
      const value = change?.value
      if (!value) continue

      const nameByWaId = new Map<string, string>()
      for (const contact of value.contacts ?? []) {
        if (contact?.wa_id) nameByWaId.set(String(contact.wa_id), contact?.profile?.name ?? '')
      }

      for (const m of value.messages ?? []) {
        const type = String(m.type ?? 'text')
        const contentType = WA_TYPE_MAP[type] ?? 'text'
        const mediaNode = m[type]
        const hasMedia = ['image', 'video', 'audio', 'document', 'sticker'].includes(type)

        messages.push({
          providerMessageId: String(m.id),
          externalContactId: String(m.from),
          contactName: nameByWaId.get(String(m.from)) || null,
          fromMe: false,
          contentType,
          body: m.text?.body ?? mediaNode?.caption ?? null,
          media: hasMedia
            ? {
                url: null,
                mimeType: mediaNode?.mime_type ?? null,
                filename: mediaNode?.filename ?? null,
                providerMediaId: mediaNode?.id ?? null,
              }
            : null,
          timestamp: Number(m.timestamp) || Math.floor(Date.now() / 1000),
        })
      }

      for (const s of value.statuses ?? []) {
        const status = WA_STATUS_MAP[String(s.status)]
        if (status) statuses.push({ providerMessageId: String(s.id), status })
      }
    }

    return { messages, statuses }
  },

  parseMessenger(entry: any): MetaParseResult {
    const messages: NormalizedInboundMessage[] = []
    const statuses: DeliveryStatusUpdate[] = []

    for (const event of entry?.messaging ?? []) {
      // Delivery / read receipts.
      if (event.delivery?.mids) {
        for (const mid of event.delivery.mids) {
          statuses.push({ providerMessageId: String(mid), status: 'delivered' })
        }
        continue
      }
      if (event.read) continue // Messenger read is watermark-based; skip for now.

      const message = event.message
      if (!message || message.is_echo) continue

      const attachment = message.attachments?.[0]
      const contentType = attachment
        ? (MESSENGER_ATTACHMENT_MAP[attachment.type] ?? 'document')
        : 'text'

      messages.push({
        providerMessageId: String(message.mid),
        externalContactId: String(event.sender?.id),
        contactName: null, // requires a Graph profile lookup
        fromMe: false,
        contentType,
        body: message.text ?? null,
        media: attachment?.payload?.url
          ? { url: attachment.payload.url, mimeType: null, filename: null }
          : null,
        timestamp: event.timestamp
          ? Math.floor(Number(event.timestamp) / 1000)
          : Math.floor(Date.now() / 1000),
      })
    }

    return { messages, statuses }
  },
}
