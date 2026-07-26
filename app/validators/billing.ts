import vine from '@vinejs/vine'
import { CHANNEL_TYPES } from '#services/messaging/constants'

export const checkoutValidator = vine.create({
  type: vine.enum(['subscription', 'channel_slot', 'ai_credits'] as const),
  planCode: vine.string().trim().optional(),
  channelType: vine.enum(CHANNEL_TYPES).optional(),
  quantity: vine.number().min(1).max(1000).optional(),
})
