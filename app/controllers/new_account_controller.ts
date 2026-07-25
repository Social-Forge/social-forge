import { signupValidator } from '#validators/user'
import TenantService from '#services/tenant_service'
import type { HttpContext } from '@adonisjs/core/http'

export default class NewAccountController {
  async create({ inertia }: HttpContext) {
    return inertia.render('auth/signup', {})
  }

  async store({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(signupValidator)

    // Provision the tenant + its Owner atomically, then sign the Owner in.
    const { owner } = await TenantService.register(payload)

    await auth.use('web').login(owner)
    response.redirect().toRoute('app.chats.index')
  }
}
