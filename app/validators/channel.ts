import vine from '@vinejs/vine'
import { CHANNEL_TYPES, WAHA_ENGINES } from '#services/messaging/constants'

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
