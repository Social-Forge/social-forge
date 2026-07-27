import vine from '@vinejs/vine'

export const createPlaybookValidator = vine.create({
  aiAgentId: vine.string().uuid(),
  name: vine.string().trim().minLength(1).maxLength(120),
  keywords: vine.array(vine.string().trim().maxLength(120)),
  instruction: vine.string().trim().minLength(1).maxLength(4000),
  assetIds: vine.array(vine.string().uuid()).optional(),
  priority: vine.number().min(0).max(100).optional(),
  isActive: vine.boolean().optional(),
})

export const updatePlaybookValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(120).optional(),
  keywords: vine.array(vine.string().trim().maxLength(120)).optional(),
  instruction: vine.string().trim().minLength(1).maxLength(4000).optional(),
  assetIds: vine.array(vine.string().uuid()).optional(),
  priority: vine.number().min(0).max(100).optional(),
  isActive: vine.boolean().optional(),
})

export const uploadAssetValidator = vine.create({
  aiAgentId: vine.string().uuid(),
  name: vine.string().trim().minLength(1).maxLength(160),
  description: vine.string().trim().maxLength(500).nullable().optional(),
  file: vine.file({
    size: '25mb',
    extnames: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'webm', 'pdf'],
  }),
})
