import vine from '@vinejs/vine'

const name = () => vine.string().trim().minLength(2).maxLength(80)
const description = () => vine.string().trim().maxLength(500).nullable().optional()

export const createDivisionValidator = vine.create({
  name: name(),
  description: description(),
})

export const updateDivisionValidator = vine.create({
  name: name(),
  description: description(),
})

export const assignMembersValidator = vine.create({
  userIds: vine.array(vine.string().uuid()),
})
