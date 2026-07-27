import type { HttpContext } from '@adonisjs/core/http'
import Tenant from '#models/tenant'
import User from '#models/user'
import Subscription from '#models/subscription'
import Invoice from '#models/invoice'
import Plan from '#models/plan'
import TenantContext from '#services/tenant_context'
import AiCreditService from '#services/ai/ai_credit_service'
import { updateTenantValidator } from '#validators/super_admin'

const num = (rows: any[], key = 'total') => Number((rows[0] as any)?.$extras?.[key] ?? 0)

/**
 * Platform-wide administration for super admins. All queries run bypassed
 * (cross-tenant) — the super-admin middleware guards the route.
 */
export default class SuperAdminController {
  async metrics({ response }: HttpContext) {
    return TenantContext.runBypassed(async () => {
      const [tenants, users, activeSubs, paid, credits] = await Promise.all([
        Tenant.query().count('* as total'),
        User.query().count('* as total'),
        Subscription.query().whereIn('status', ['active', 'trialing']).count('* as total'),
        Invoice.query().where('status', 'paid').count('* as total').sum('amount as revenue'),
        Tenant.query().sum('ai_credits as total'),
      ])

      return response.ok({
        tenants: num(tenants),
        users: num(users),
        activeSubscriptions: num(activeSubs),
        paidInvoices: num(paid),
        revenue: num(paid, 'revenue'),
        aiCreditsOutstanding: num(credits),
      })
    })
  }

  async tenants({ request, response }: HttpContext) {
    return TenantContext.runBypassed(async () => {
      const page = Number(request.input('page', 1))
      const search = String(request.input('q', '')).trim()

      const query = Tenant.query().orderBy('created_at', 'desc')
      if (search) {
        query.where((q) => {
          q.whereILike('name', `%${search}%`).orWhereILike('slug', `%${search}%`)
        })
      }
      const tenants = await query.paginate(page, 30)
      return response.ok(tenants)
    })
  }

  async plans({ response }: HttpContext) {
    const plans = await Plan.query().orderBy('sort', 'asc')
    return response.ok(plans)
  }

  async updateTenant({ params, request, response }: HttpContext) {
    const payload = await request.validateUsing(updateTenantValidator)
    return TenantContext.runBypassed(async () => {
      const tenant = await Tenant.findOrFail(params.id)
      if (payload.plan !== undefined) tenant.plan = payload.plan
      if (payload.status !== undefined) tenant.status = payload.status
      await tenant.save()

      if (payload.grantCredits) {
        await AiCreditService.grant(tenant.id, payload.grantCredits, 'adjustment')
        await tenant.refresh()
      }
      return response.ok(tenant)
    })
  }
}
