import vine from '@vinejs/vine'

/** Editable contact fields. email/phone/notes live in the `attributes` jsonb. */
export const updateContactValidator = vine.create({
  displayName: vine.string().trim().minLength(1).maxLength(120).optional(),
  email: vine.string().trim().email().nullable().optional(),
  phone: vine.string().trim().maxLength(40).nullable().optional(),
  notes: vine.string().trim().maxLength(2000).nullable().optional(),
})
