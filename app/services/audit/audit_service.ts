import logger from '@adonisjs/core/services/logger'
import type { HttpContext } from '@adonisjs/core/http'
import AuditLog from '#models/audit_log'

export type AuditEntry = {
  action: string
  tenantId?: string | null
  actorId?: string | null
  entityType?: string | null
  entityId?: string | null
  metadata?: Record<string, unknown> | null
  ipAddress?: string | null
}

/**
 * Best-effort audit trail for security-relevant actions (channel/agent/team/
 * billing changes, super-admin actions). Failures are logged, never thrown —
 * auditing must not break the user action it records.
 */
export default class AuditService {
  static async record(entry: AuditEntry): Promise<void> {
    try {
      await AuditLog.create({
        action: entry.action,
        tenantId: entry.tenantId ?? null,
        actorId: entry.actorId ?? null,
        entityType: entry.entityType ?? null,
        entityId: entry.entityId ?? null,
        metadata: entry.metadata ?? null,
        ipAddress: entry.ipAddress ?? null,
      })
    } catch (error) {
      logger.error({ err: error, action: entry.action }, 'failed to write audit log')
    }
  }

  /** Convenience: derive actor + tenant + IP from the request context. */
  static async fromContext(
    ctx: HttpContext,
    action: string,
    extra: Partial<AuditEntry> = {}
  ): Promise<void> {
    const user = ctx.auth?.user
    await this.record({
      action,
      tenantId: extra.tenantId ?? user?.tenantId ?? null,
      actorId: user?.id ?? null,
      ipAddress: ctx.request.ip(),
      ...extra,
    })
  }
}
