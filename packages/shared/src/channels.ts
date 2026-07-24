/**
 * Channel types supported by Social Forge. Shared across the web backend,
 * workers, and (later) the mobile app so the normalized message model stays
 * consistent everywhere.
 */
export const CHANNEL_TYPES = [
  'whatsapp_waha',
  'whatsapp_meta',
  'messenger',
  'instagram',
  'telegram',
] as const

export type ChannelType = (typeof CHANNEL_TYPES)[number]

/** WAHA engines (see ARCHITECTURE.md D9 — GOWS default, NOWEB fallback). */
export const WAHA_ENGINES = ['gows', 'noweb', 'webjs'] as const
export type WahaEngine = (typeof WAHA_ENGINES)[number]

/** Channels that authenticate via a WAHA self-hosted session. */
export const WAHA_CHANNELS: ChannelType[] = ['whatsapp_waha']

/** Channels that authenticate via Meta Graph API tokens. */
export const META_CHANNELS: ChannelType[] = ['whatsapp_meta', 'messenger', 'instagram']

/** True when a channel is subject to Meta's 24-hour customer service window. */
export function hasServiceWindow(channel: ChannelType): boolean {
  return channel === 'whatsapp_meta' || channel === 'messenger' || channel === 'instagram'
}
