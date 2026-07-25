import { DivisionSchema } from '#database/schema'
import { TenantScoped } from '#models/mixins/tenant_scoped'
import { compose } from '@adonisjs/core/helpers'
import { belongsTo, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import Tenant from '#models/tenant'
import User from '#models/user'

export default class Division extends compose(DivisionSchema, TenantScoped) {
  @belongsTo(() => Tenant)
  declare tenant: BelongsTo<typeof Tenant>

  @manyToMany(() => User, {
    pivotTable: 'division_members',
    pivotForeignKey: 'division_id',
    pivotRelatedForeignKey: 'user_id',
    pivotTimestamps: true,
  })
  declare members: ManyToMany<typeof User>
}
