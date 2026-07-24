export * from './channels.js'
export * from './roles.js'

/** Message content types (normalized across all channels). */
export const MESSAGE_CONTENT_TYPES = [
  'text',
  'image',
  'video',
  'audio',
  'document',
  'location',
  'template',
  'link',
  'sticker',
  'contact',
] as const
export type MessageContentType = (typeof MESSAGE_CONTENT_TYPES)[number]

/** Delivery status of an outbound (or received) message. */
export const MESSAGE_STATUSES = ['pending', 'sent', 'delivered', 'read', 'failed'] as const
export type MessageStatus = (typeof MESSAGE_STATUSES)[number]

/** Direction of a message relative to the tenant. */
export type MessageDirection = 'in' | 'out'

/** Who authored a message. */
export type MessageSenderType = 'contact' | 'agent' | 'ai' | 'system'
