import type User from '#models/user'
import encryption from '@adonisjs/core/services/encryption'
import router from '@adonisjs/core/services/router'
import mail from '@adonisjs/mail/services/main'

type AuthToken = {
  purpose: 'verify-email' | 'reset-password'
  userId: string
  email: string
  password?: string
}

function absoluteUrl(origin: string, route: string, token: string) {
  return `${origin}${router.makeUrl(route, { token })}`
}

export async function sendVerificationEmail(user: User, origin: string) {
  const token = encryption.encrypt(
    { purpose: 'verify-email', userId: user.id, email: user.email } satisfies AuthToken,
    '24 hours'
  )
  const url = absoluteUrl(origin, 'email.verify', token)

  await mail.send((message) => {
    message
      .to(user.email)
      .subject('Verify your email address')
      .html(
        `<h1>Verify your email</h1><p>Confirm your Social Forge account by clicking the link below.</p><p><a href="${url}">Verify email address</a></p><p>This link expires in 24 hours.</p>`
      )
  })
}

export async function sendPasswordResetEmail(user: User, origin: string) {
  const token = encryption.encrypt(
    {
      purpose: 'reset-password',
      userId: user.id,
      email: user.email,
      password: user.password,
    } satisfies AuthToken,
    '1 hour'
  )
  const url = absoluteUrl(origin, 'password.reset', token)

  await mail.send((message) => {
    message
      .to(user.email)
      .subject('Reset your password')
      .html(
        `<h1>Reset your password</h1><p>Use the secure link below to choose a new password.</p><p><a href="${url}">Reset password</a></p><p>This link expires in 1 hour. Ignore this email if you did not request it.</p>`
      )
  })
}

export function decryptAuthToken(token: string) {
  return encryption.decrypt<AuthToken>(token)
}
