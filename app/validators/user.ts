import vine from '@vinejs/vine'

const email = () => vine.string().email().maxLength(254)
const password = () => vine.string().minLength(8).maxLength(32)

export const signupValidator = vine.create({
  tenantName: vine.string().trim().minLength(2).maxLength(80),
  fullName: vine.string().nullable(),
  email: email().unique({ table: 'users', column: 'email' }),
  password: password().confirmed({
    confirmationField: 'passwordConfirmation',
  }),
})
export const emailValidator = vine.create({ email: email() })

export const loginValidator = vine.create({
  email: email(),
  password: vine.string(),
})

export const resetPasswordValidator = vine.create({
  token: vine.string(),
  password: password().confirmed({ confirmationField: 'passwordConfirmation' }),
})

export const inviteTeamValidator = vine.create({
  fullName: vine.string(),
  email: email().unique({ table: 'users', column: 'email' }),
  password: vine.string().minLength(8).maxLength(32),
  role: vine.enum(['admin', 'user'] as const),
})

export const updateUserValidator = (userId: number) =>
  vine.create({
    fullName: vine.string().trim().nullable(),
    email: email().unique({
      table: 'users',
      column: 'email',
      caseInsensitive: true,
      filter(query) {
        query.whereNot('id', userId)
      },
    }),
    role: vine.enum(['admin', 'user'] as const),
  })
export const deleteUsersValidator = vine.create({
  ids: vine.array(vine.number().positive()).minLength(1),
})

export const updateOwnProfiileValidator = (userId: number) =>
  vine.create({
    fullName: vine.string().trim().nullable(),
    email: email().unique({
      table: 'users',
      column: 'email',
      caseInsensitive: true,
      filter(query) {
        query.whereNot('id', userId)
      },
    }),
  })

export const updateProfilePasswordValidator = vine.create({
  password: password().confirmed({ confirmationField: 'passwordConfirmation' }),
})
