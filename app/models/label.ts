import { LabelSchema } from '#database/schema'
import { TenantScoped } from '#models/mixins/tenant_scoped'
import { compose } from '@adonisjs/core/helpers'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Tenant from '#models/tenant'

export default class Label extends compose(LabelSchema, TenantScoped) {
  @belongsTo(() => Tenant)
  declare tenant: BelongsTo<typeof Tenant>
}
