import { BaseModel, beforeFind, beforeFetch, beforePaginate } from '@adonisjs/lucid/orm'
import type { NormalizeConstructor } from '@adonisjs/core/types/helpers'
import type { ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'
import TenantContext from '#services/tenant_context'

type AnyQuery = ModelQueryBuilderContract<typeof BaseModel>

/**
 * Mixin that auto-scopes every read on a model to the active tenant
 * (`TenantContext`). Apply only to models that have a `tenant_id` column.
 *
 * Reads (find / fetch / paginate) are filtered automatically. Writes are NOT
 * — callers must set `tenant_id` explicitly on create, which keeps intent
 * obvious and avoids surprising inserts. When there is no active tenant
 * (login, workers, super-admin `runBypassed`), scoping is skipped.
 */
export function TenantScoped<Model extends NormalizeConstructor<typeof BaseModel>>(
  superclass: Model
) {
  class TenantScopedModel extends superclass {
    @beforeFind()
    @beforeFetch()
    static scopeToTenant(query: AnyQuery) {
      if (!TenantContext.isScoped) return
      query.where(`${query.model.table}.tenant_id`, TenantContext.current()!)
    }

    @beforePaginate()
    static scopeToTenantPaginate(queries: [AnyQuery, AnyQuery]) {
      if (!TenantContext.isScoped) return
      const [countQuery, query] = queries
      const column = `${query.model.table}.tenant_id`
      const tenantId = TenantContext.current()!
      countQuery.where(column, tenantId)
      query.where(column, tenantId)
    }
  }

  return TenantScopedModel
}
