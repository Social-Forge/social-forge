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
})
