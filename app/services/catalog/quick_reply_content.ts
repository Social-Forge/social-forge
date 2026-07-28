import type { MediaItem } from '#services/storage/media_helpers'

export type QuickReplyContent = { contentType: string; body: string | null; media: unknown | null }

/**
 * Validate a quick reply's content against its type rules and produce the
 * persisted `{ contentType, body, media }`:
 *   - text   → body only, no media
 *   - hybrid → body + exactly 1 media file
 *   - image/video/document → 1–5 media files (all same kind), optional caption
 *
 * Returns `{ error }` when the combination is invalid.
 */
export function buildQuickReplyContent(
  contentType: string,
  body: string | null,
  items: MediaItem[]
): QuickReplyContent | { error: string } {
  const text = body?.trim() || null

  if (contentType === 'text') {
    if (!text) return { error: 'A text quick reply needs a message body.' }
    return { contentType, body: text, media: null }
  }

  if (contentType === 'hybrid') {
    if (!text) return { error: 'A hybrid quick reply needs a message body.' }
    if (items.length !== 1) return { error: 'A hybrid quick reply needs exactly one media file.' }
    return { contentType, body: text, media: { items } }
  }

  // image | video | document
  if (!items.length) return { error: `A ${contentType} quick reply needs at least one file.` }
  if (items.length > 5) return { error: 'A quick reply can hold at most 5 media files.' }
  if (items.some((i) => i.type !== contentType)) {
    return { error: `All files must be of type "${contentType}".` }
  }
  return { contentType, body: text, media: { items } }
}
