import { SubscriptionSchema } from '#database/schema'
import { TenantScoped } from '#models/mixins/tenant_scoped'
import { compose } from '@adonisjs/core/helpers'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Tenant from '#models/tenant'
import Plan from '#models/plan'

export default class Subscription extends compose(SubscriptionSchema, TenantScoped) {
  @belongsTo(() => Tenant)
  declare tenant: BelongsTo<typeof Tenant>

  @belongsTo(() => Plan)
  declare plan: BelongsTo<typeof Plan>

  get isActive(): boolean {
    return this.status === 'active' || this.status === 'trialing'
  }
}
