import vine from '@vinejs/vine'
import { MESSAGE_CONTENT_TYPES } from '#services/messaging/constants'

export const sendMessageValidator = vine.create({
  contentType: vine.enum(MESSAGE_CONTENT_TYPES).optional(),
  body: vine.string().trim().maxLength(4096).nullable().optional(),
  mediaUrl: vine.string().url().nullable().optional(),
  replyToId: vine.string().uuid().nullable().optional(),
  // WhatsApp Business template (required outside the 24h window).
  template: vine
    .object({
      name: vine.string().trim(),
      languageCode: vine.string().trim().optional(),
    })
    .optional(),
})
