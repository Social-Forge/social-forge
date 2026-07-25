import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import TenantContext from '#services/tenant_context'

/**
 * Establishes the per-request tenant scope. Runs after the `auth` middleware:
 * it preloads the authenticated user's role (+ tenant) for RBAC checks, then
 * wraps the rest of the request in `TenantContext` so every tenant-scoped
 * model query is filtered automatically.
 *
 * Super admins have `tenantId = null`; the context is then unscoped and they
 * operate platform-wide.
 */
export default class TenantMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user
    if (!user) {
      return next()
    }

    // Preload role for authorization; preload tenant when the user has one.
    // FK-null relations resolve to null rather than throwing.
    await user.load('role')
    if (user.tenantId) {
      await user.load('tenant')
    }

    return TenantContext.run(user.tenantId, () => next())
  }
}
