import vine from '@vinejs/vine'

export const MEDIA_KINDS = ['image', 'video', 'document'] as const

/** A persisted media reference: a durable MinIO `key` + its kind. */
export const mediaItemSchema = vine.object({
  key: vine.string().trim().minLength(1).maxLength(300),
  type: vine.enum(MEDIA_KINDS),
  name: vine.string().trim().maxLength(300).nullable().optional(),
  size: vine.number().min(0).nullable().optional(),
})
