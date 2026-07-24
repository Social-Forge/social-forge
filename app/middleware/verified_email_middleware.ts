import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class VerifiedEmailMiddleware {
  async handle({ auth, response }: HttpContext, next: NextFn) {
    const user = auth.getUserOrFail()
    if (!user.emailVerifiedAt) {
      return response.redirect().toPath('/verify-email')
    }

    return next()
  }
}
