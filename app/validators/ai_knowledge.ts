import vine from '@vinejs/vine'

export const createKnowledgeValidator = vine.create({
  aiAgentId: vine.string().uuid(),
  title: vine.string().trim().minLength(1).maxLength(200),
  content: vine.string().trim().minLength(1).maxLength(20000),
})

export const updateKnowledgeValidator = vine.create({
  title: vine.string().trim().minLength(1).maxLength(200).optional(),
  content: vine.string().trim().minLength(1).maxLength(20000).optional(),
})
