import type { HttpContext } from '@adonisjs/core/http'
import AuditLog from '#models/audit_log'
import { ROLES } from '#models/role'

/** Read-only audit trail for the tenant. Owner only. */
export default class AuditLogsController {
  async index({ auth, request, response }: HttpContext) {
    const user = auth.user!
    if (!user.atLeast(ROLES.owner.level)) {
      return response.forbidden({ message: 'Only the owner can view the audit log.' })
    }

    const page = Number(request.input('page', 1))
    const action = String(request.input('action', '')).trim()

    const query = AuditLog.query()
      .where('tenant_id', user.tenantId!)
      .preload('actor', (q) => q.select(['id', 'full_name', 'email']))
      .orderBy('created_at', 'desc')
    if (action) query.where('action', action)

    const logs = await query.paginate(page, 50)
    return response.ok(logs)
  }
}
