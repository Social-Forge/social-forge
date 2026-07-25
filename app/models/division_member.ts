import { DivisionMemberSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Division from '#models/division'
import User from '#models/user'

/**
 * Pivot between divisions and their members (supervisors + agents). Scoped to a
 * tenant transitively via its division, so it does not carry `tenant_id` and is
 * not `TenantScoped` directly.
 */
export default class DivisionMember extends DivisionMemberSchema {
  @belongsTo(() => Division)
  declare division: BelongsTo<typeof Division>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
