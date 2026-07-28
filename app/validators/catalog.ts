import vine from '@vinejs/vine'
import { mediaItemSchema } from '#validators/media'

const QUICK_REPLY_TYPES = ['text', 'image', 'video', 'document', 'hybrid'] as const

export const createLabelValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(40),
  color: vine
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
})

export const updateLabelValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(40).optional(),
  color: vine
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
})

export const createQuickReplyValidator = vine.create({
  shortcut: vine
    .string()
    .trim()
    .minLength(1)
    .maxLength(40)
    .regex(/^[a-zA-Z0-9_-]+$/),
  contentType: vine.enum(QUICK_REPLY_TYPES).optional(),
  body: vine.string().trim().maxLength(4000).nullable().optional(),
  mediaItems: vine.array(mediaItemSchema).maxLength(5).optional(),
})

export const sendQuickReplyValidator = vine.create({
  quickReplyId: vine.string().uuid(),
})

export const updateQuickReplyValidator = vine.create({
  shortcut: vine
    .string()
    .trim()
    .minLength(1)
    .maxLength(40)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
  contentType: vine.enum(QUICK_REPLY_TYPES).optional(),
  body: vine.string().trim().maxLength(4000).nullable().optional(),
  mediaItems: vine.array(mediaItemSchema).maxLength(5).optional(),
})
