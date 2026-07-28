import { signupValidator } from '#validators/user'
import TenantService from '#services/tenant_service'
import TurnstileService from '#services/security/turnstile_service'
import type { HttpContext } from '@adonisjs/core/http'

export default class NewAccountController {
  async create({ inertia }: HttpContext) {
    // Expose the site key so the page can render the Turnstile widget (null = off).
    return inertia.render('auth/signup', { turnstileSiteKey: TurnstileService.siteKey })
  }

  async store({ request, response, session, auth }: HttpContext) {
    const payload = await request.validateUsing(signupValidator)

    // Bot protection (no-op when Turnstile isn't configured).
    const token = request.input('cf-turnstile-response')
    if (!(await TurnstileService.verify(token, request.ip()))) {
      session.flash('errors', { captcha: 'CAPTCHA verification failed. Please try again.' })
      return response.redirect().back()
    }

    // Provision the tenant + its Owner atomically, then sign the Owner in.
    const { owner } = await TenantService.register(payload)

    await auth.use('web').login(owner)
    response.redirect().toRoute('app.chats.index')
  }
}
