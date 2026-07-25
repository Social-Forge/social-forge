/**
 * Domain enums for the messaging pipeline. Kept app-local (mirrors
 * `@socialforge/shared`) so the backend build never depends on the workspace
 * package resolving raw TypeScript.
 */
export const CHANNEL_TYPES = [
  'whatsapp_waha',
  'whatsapp_meta',
  'messenger',
  'instagram',
  'telegram',
] as const
export type ChannelType = (typeof CHANNEL_TYPES)[number]

export const WAHA_ENGINES = ['gows', 'noweb', 'webjs'] as const
export type WahaEngine = (typeof WAHA_ENGINES)[number]

export const CHANNEL_STATUSES = ['disconnected', 'connecting', 'connected', 'failed'] as const
export type ChannelStatus = (typeof CHANNEL_STATUSES)[number]

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

export const MESSAGE_STATUSES = ['pending', 'sent', 'delivered', 'read', 'failed'] as const
export type MessageStatus = (typeof MESSAGE_STATUSES)[number]

export type MessageDirection = 'in' | 'out'
export type MessageSenderType = 'contact' | 'agent' | 'ai' | 'system'

/** Channels subject to Meta's 24-hour customer service window. */
export function hasServiceWindow(type: ChannelType): boolean {
  return type === 'whatsapp_meta' || type === 'messenger' || type === 'instagram'
}
