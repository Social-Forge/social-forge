import vine from '@vinejs/vine'
import { CHANNEL_TYPES, WAHA_ENGINES } from '#services/messaging/constants'
import { mediaItemSchema } from '#validators/media'

/**
 * Per-channel auto first-reply: a canned message sent to a brand-new contact's
 * first message. Overridden (and ignored) when the channel has an AI agent.
 */
export const firstReplySchema = vine.object({
  enabled: vine.boolean(),
  contentType: vine.enum(['text', 'image', 'video', 'document', 'hybrid']),
  body: vine.string().trim().maxLength(4000).nullable().optional(),
  mediaItems: vine.array(mediaItemSchema).maxLength(5).optional(),
})

export const createChannelValidator = vine.create({
  type: vine.enum(CHANNEL_TYPES),
  name: vine.string().trim().minLength(2).maxLength(80),
  divisionId: vine.string().uuid().nullable().optional(),
  // WAHA engine choice (defaults to gows when omitted).
  wahaEngine: vine.enum(WAHA_ENGINES).optional(),
})

export const updateChannelValidator = vine.create({
  name: vine.string().trim().minLength(2).maxLength(80).optional(),
  divisionId: vine.string().uuid().nullable().optional(),
  // AI agent that auto-replies on this channel (null = no bot).
  aiAgentId: vine.string().uuid().nullable().optional(),
  firstReply: firstReplySchema.nullable().optional(),
})

/**
 * Provider credentials for Meta/Telegram channels. Values are stored encrypted.
 * Keys are provider-specific:
 *   - telegram:        botToken
 *   - messenger / IG:  pageAccessToken
 *   - whatsapp_meta:   accessToken (+ externalId = phone_number_id)
 */
export const configureChannelValidator = vine.create({
  credentials: vine.record(vine.string()),
  externalId: vine.string().trim().nullable().optional(),
})
