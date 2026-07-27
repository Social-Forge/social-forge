import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Restricts a route to platform super admins. Runs after `auth`; loads the
 * user's role if needed and rejects anyone who isn't a super admin. Super-admin
 * routes are NOT tenant-scoped — the controller queries across all tenants.
 */
export default class SuperAdminMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user
    if (!user) return ctx.response.unauthorized({ message: 'Authentication required.' })
    if (!user.role) await user.load('role')
    if (!user.isSuperAdmin) {
      return ctx.response.forbidden({ message: 'Super admin access only.' })
    }
    return next()
  }
}
