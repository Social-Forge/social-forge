import vine from '@vinejs/vine'
import { UPLOAD_EXTNAMES } from '#services/storage/media_helpers'

/** A single media file, 1 byte–5 MB, image/video/document. */
export const uploadValidator = vine.create({
  file: vine.file({
    size: '5mb',
    extnames: [...UPLOAD_EXTNAMES],
  }),
})
export const deleteUploadValidator = vine.compile(
  vine.object({
    key: vine.string().trim().minLength(1),
  })
)
