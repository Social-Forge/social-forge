import vine from '@vinejs/vine'

export const updateTenantValidator = vine.create({
  plan: vine.string().trim().optional(),
  status: vine.enum(['trial', 'active', 'suspended', 'canceled'] as const).optional(),
  grantCredits: vine.number().min(1).max(1000000).optional(),
})
