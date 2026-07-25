import type { MessageContentType, MessageStatus } from '#services/messaging/constants'

/** Provider media reference, normalized across channels. */
export type NormalizedMedia = {
  url: string | null
  mimeType: string | null
  filename: string | null
  /** Provider handle to fetch the bytes later (Telegram file_id, Meta media id). */
  providerMediaId?: string | null
}

/** A single inbound message, normalized from any provider webhook. */
export type NormalizedInboundMessage = {
  providerMessageId: string
  externalContactId: string
  contactName: string | null
  contactAvatar?: string | null
  fromMe: boolean
  contentType: MessageContentType
  body: string | null
  media: NormalizedMedia | null
  /** Epoch seconds. */
  timestamp: number
}

export type DeliveryStatusUpdate = {
  providerMessageId: string
  status: MessageStatus
}

/** Provider families routed by the inbound worker. */
export type InboundProvider = 'waha' | 'meta' | 'telegram'

/** Envelope published to the inbound exchange by a webhook receiver. */
export type InboundJob = {
  provider: InboundProvider
  channelId: string
  tenantId: string
  event: string
  payload: any
  receivedAt: string
}
