/** Media classification shared by uploads, quick replies, and channel auto-replies. */
export type MediaKind = 'image' | 'video' | 'document'

const IMAGE_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp']
const VIDEO_EXT = ['mp4', 'mov', 'webm']

/** Allowed upload extensions across the app (matches the upload validator). */
export const UPLOAD_EXTNAMES = [...IMAGE_EXT, ...VIDEO_EXT, 'pdf'] as const

export function mediaKindFromExt(extname: string): MediaKind {
  const ext = extname.toLowerCase()
  if (VIDEO_EXT.includes(ext)) return 'video'
  if (IMAGE_EXT.includes(ext)) return 'image'
  return 'document'
}

/** One stored media reference. `key` is the durable MinIO object key; URLs are
 *  minted fresh at send time (presigned URLs expire). */
export type MediaItem = {
  key: string
  type: MediaKind
  name?: string | null
  size?: number | null
}
