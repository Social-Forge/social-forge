import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import encryption from '@adonisjs/core/services/encryption'
import string from '@adonisjs/core/helpers/string'
import User from '#models/user'
import OauthProvider from '#models/oauth_provider'
import TenantService from '#services/tenant_service'

const ALLOWED_PROVIDERS = ['google', 'github', 'facebook'] as const
type OAuthProviderName = (typeof ALLOWED_PROVIDERS)[number]

function isAllowedProvider(value: string): value is OAuthProviderName {
  return (ALLOWED_PROVIDERS as readonly string[]).includes(value)
}

export default class OAuthController {
  async redirect({ params, ally, response }: HttpContext) {
    if (!isAllowedProvider(params.provider)) {
      return response.notFound('Unknown OAuth provider')
    }
    return ally.use(params.provider).redirect()
  }

  async callback({ params, ally, auth, response, session }: HttpContext) {
    if (!isAllowedProvider(params.provider)) {
      return response.notFound('Unknown OAuth provider')
    }
    const provider = params.provider
    const social = ally.use(provider)

    if (social.hasError()) {
      session.flash('error', `Failed to authenticate with ${provider}.`)
      return response.redirect('/login')
    }
    if (social.accessDenied()) {
      session.flash('error', `Access was denied by ${provider}.`)
      return response.redirect('/login')
    }
    if (social.stateMisMatch()) {
      session.flash('error', 'Request expired. Please try again.')
      return response.redirect('/login')
    }

    try {
      const socialUser = await social.user()

      // 1) Known identity (provider + provider_id) → sign straight in.
      const existingLink = await OauthProvider.query()
        .where('provider_name', provider)
        .where('provider_id', socialUser.id)
        .preload('user')
        .first()

      if (existingLink) {
        await auth.use('web').login(existingLink.user)
        return response.redirect().toRoute('app.chats.index')
      }

      // A verified email is required to create or link a local account.
      const email = socialUser.email
      if (!email) {
        session.flash('error', `${provider} did not share an email address.`)
        return response.redirect('/login')
      }
      const emailVerified = socialUser.emailVerificationState === 'verified'

      let user = await User.findBy('email', email)

      // Never auto-link an unverified provider email to an existing account —
      // that would allow account takeover. Require a password login to link.
      if (user && !emailVerified) {
        session.flash(
          'error',
          `Your ${provider} email is not verified. Sign in with your password to link ${provider}.`
        )
        return response.redirect('/login')
      }

      // New account → provision a tenant + owner.
      if (!user) {
        const displayName = socialUser.name || socialUser.nickName || email.split('@')[0]
        const { owner } = await TenantService.register({
          email,
          fullName: displayName,
          password: string.random(32),
          tenantName: displayName,
          avatar: socialUser.avatarUrl || null,
        })
        user = owner
        if (emailVerified) {
          user.emailVerifiedAt = DateTime.now()
          await user.save()
        }
      }

      await OauthProvider.create({
        userId: user.id,
        providerName: provider,
        providerId: socialUser.id,
        // Access tokens are sensitive — store them encrypted at rest.
        accessToken: socialUser.token.token ? encryption.encrypt(socialUser.token.token) : null,
      })

      await auth.use('web').login(user)
      session.flash('success', `Signed in with ${provider}.`)
      return response.redirect().toRoute('app.chats.index')
    } catch {
      session.flash('error', `Failed to sign in with ${provider}.`)
      return response.redirect('/login')
    }
  }
}
