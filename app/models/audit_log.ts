import { AuditLogSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

/**
 * Immutable record of a security-relevant action. Not `TenantScoped`: rows can
 * be platform-level (super admin, `tenant_id = null`) and reads are scoped
 * explicitly by the caller. Never updated or deleted from application code.
 */
export default class AuditLog extends AuditLogSchema {
  @belongsTo(() => User, { foreignKey: 'actorId' })
  declare actor: BelongsTo<typeof User>
}
