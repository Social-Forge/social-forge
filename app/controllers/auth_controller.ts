import User from '#models/user'
import {
  decryptAuthToken,
  sendPasswordResetEmail,
  sendVerificationEmail,
} from '#services/auth_mail_service'
import { emailValidator, resetPasswordValidator } from '#validators/user'
import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'

function origin(request: HttpContext['request']) {
  return `${request.protocol()}://${request.host()}`
}

export default class AuthController {
  async forgotPassword({ inertia }: HttpContext) {
    return inertia.render('auth/forgot-password', {})
  }

  async sendResetLink({ request, response, session }: HttpContext) {
    const { email } = await request.validateUsing(emailValidator)
    const user = await User.findBy('email', email)

    try {
      if (user) {
        await sendPasswordResetEmail(user, origin(request))
      }
    } catch {
      session.flash(
        'error',
        'The reset email could not be sent. Check the SMTP configuration and try again.'
      )
      return response.redirect().back()
    }

    session.flash('success', 'If an account exists for that email, a reset link has been sent.')
    return response.redirect().back()
  }

  async resetPassword({ params, inertia, response, session }: HttpContext) {
    const payload = decryptAuthToken(params.token)
    if (!payload || payload.purpose !== 'reset-password') {
      session.flash('error', 'This password reset link is invalid or has expired.')
      return response.redirect().toPath('/forgot-password')
    }

    return inertia.render('auth/reset-password', { token: params.token, email: payload.email })
  }

  async updatePassword({ request, response, session }: HttpContext) {
    const { token, password } = await request.validateUsing(resetPasswordValidator)
    const payload = decryptAuthToken(token)
    const user = payload ? await User.find(payload.userId) : null

    if (
      !payload ||
      payload.purpose !== 'reset-password' ||
      !user ||
      user.email !== payload.email ||
      user.password !== payload.password
    ) {
      session.flash('error', 'This password reset link is invalid or has expired.')
      return response.redirect().toPath('/forgot-password')
    }

    user.password = password
    await user.save()
    session.flash('success', 'Your password has been updated. You can now log in.')
    return response.redirect().toRoute('session.create')
  }

  async verificationNotice({ inertia }: HttpContext) {
    return inertia.render('auth/verify-email', {})
  }
  async resendVerification({ auth, request, response, session }: HttpContext) {
    const user = auth.user!
    if (user.emailVerifiedAt) {
      return response.redirect().toRoute('app.chats.index')
    }

    try {
      await sendVerificationEmail(user, origin(request))
    } catch {
      session.flash(
        'error',
        'The verification email could not be sent. Check the SMTP configuration and try again.'
      )
      return response.redirect().back()
    }
    session.flash('success', 'A new verification link has been sent to your email.')
    return response.redirect().back()
  }

  async verifyEmail({ params, auth, response, session }: HttpContext) {
    const payload = decryptAuthToken(params.token)
    const user = payload ? await User.find(payload.userId) : null

    if (!payload || payload.purpose !== 'verify-email' || !user || user.email !== payload.email) {
      session.flash('error', 'This verification link is invalid or has expired.')
      return response.redirect().toRoute('session.create')
    }

    user.emailVerifiedAt = DateTime.now()
    await user.save()
    await auth.use('web').login(user)
    session.flash('success', 'Your email address has been verified.')
    return response.redirect().toRoute('app.chats.index')
  }
}
