import type { HttpContext } from '@adonisjs/core/http'
import AnalyticsService from '#services/analytics/analytics_service'
import { ROLES } from '#models/role'

/** Reporting dashboards. Supervisors+ only (aggregate, tenant-scoped). */
export default class AnalyticsController {
  #guard({ auth, response }: HttpContext): { tenantId: string; days: number } | null {
    const user = auth.user!
    if (!user.atLeast(ROLES.supervisor.level)) {
      response.forbidden({ message: 'Analytics require a supervisor or owner role.' })
      return null
    }
    return { tenantId: user.tenantId!, days: 30 }
  }

  #days(ctx: HttpContext): number {
    const raw = Number(ctx.request.input('days', 30))
    if (!Number.isFinite(raw)) return 30
    return Math.min(90, Math.max(7, Math.round(raw)))
  }

  async overview(ctx: HttpContext) {
    const g = this.#guard(ctx)
    if (!g) return
    return ctx.response.ok(await AnalyticsService.overview(g.tenantId, this.#days(ctx)))
  }

  async agents(ctx: HttpContext) {
    const g = this.#guard(ctx)
    if (!g) return
    return ctx.response.ok(await AnalyticsService.agents(g.tenantId, this.#days(ctx)))
  }

  async ai(ctx: HttpContext) {
    const g = this.#guard(ctx)
    if (!g) return
    return ctx.response.ok(await AnalyticsService.ai(g.tenantId, this.#days(ctx)))
  }

  async sla(ctx: HttpContext) {
    const g = this.#guard(ctx)
    if (!g) return
    return ctx.response.ok(await AnalyticsService.sla(g.tenantId, this.#days(ctx)))
  }

  async contacts(ctx: HttpContext) {
    const g = this.#guard(ctx)
    if (!g) return
    return ctx.response.ok(await AnalyticsService.contacts(g.tenantId, this.#days(ctx)))
  }
}
