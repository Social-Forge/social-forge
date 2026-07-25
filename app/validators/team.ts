import vine from '@vinejs/vine'

const email = () => vine.string().trim().email().maxLength(254)

/** Owners manage Supervisors + Agents only — never other Owners via this API. */
const teamRole = () => vine.enum(['supervisor', 'agent'] as const)
const memberStatus = () => vine.enum(['active', 'suspended'] as const)

export const createTeamMemberValidator = vine.create({
  fullName: vine.string().trim().nullable(),
  email: email().unique({ table: 'users', column: 'email' }),
  password: vine.string().minLength(8).maxLength(72),
  role: teamRole(),
})

export const updateTeamMemberValidator = (userId: string) =>
  vine.create({
    fullName: vine.string().trim().nullable().optional(),
    email: email()
      .unique({
        table: 'users',
        column: 'email',
        caseInsensitive: true,
        filter(query) {
          query.whereNot('id', userId)
        },
      })
      .optional(),
    role: teamRole().optional(),
    status: memberStatus().optional(),
  })
