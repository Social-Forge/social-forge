import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

/**
 * Audit Row-Level Security on the tenant-scoped tables. RLS is the dormant DB
 * backstop to the application-level `TenantScoped` scoping; it only enforces
 * once the app connects as a dedicated non-superuser role (see
 * deploy/rls/setup-app-role.sql). This verifies the policies/flags are present.
 *
 *   node ace rls:check
 */
const TENANT_TABLES = [
  'channels',
  'contacts',
  'conversations',
  'messages',
  'message_outbox',
  'labels',
  'quick_replies',
  'ai_agents',
  'ai_credit_ledger',
  'ai_knowledge',
  'ai_playbooks',
  'ai_assets',
  'subscriptions',
  'subscription_addons',
  'invoices',
  'payment_events',
]

export default class RlsCheck extends BaseCommand {
  static commandName = 'rls:check'
  static description = 'Report Row-Level Security status on tenant-scoped tables'
  static options: CommandOptions = { startApp: true }

  async run() {
    const { default: db } = await import('@adonisjs/lucid/services/db')

    const result = await db.rawQuery(
      `select c.relname as table, c.relrowsecurity as rls_enabled,
         (select count(*) from pg_policy p where p.polrelid = c.oid) as policy_count
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relname = any(?)
       order by c.relname`,
      [TENANT_TABLES]
    )
    const rows = result.rows as { table: string; rls_enabled: boolean; policy_count: number }[]

    const found = new Set(rows.map((r) => r.table))
    let ok = true

    for (const table of TENANT_TABLES) {
      const row = rows.find((r) => r.table === table)
      if (!row) {
        this.logger.warning(`${table}: table not found`)
        continue
      }
      const enabled = row.rls_enabled
      const policies = Number(row.policy_count)
      if (enabled && policies > 0) {
        this.logger.success(`${table}: RLS enabled, ${policies} policy(ies)`)
      } else {
        ok = false
        this.logger.error(
          `${table}: RLS ${enabled ? 'enabled' : 'DISABLED'}, ${policies} policy(ies)`
        )
      }
    }

    for (const table of TENANT_TABLES) {
      if (!found.has(table)) ok = false
    }

    if (ok) {
      this.logger.success('All tenant-scoped tables have RLS enabled with policies.')
    } else {
      this.logger.warning(
        'Some tables lack RLS. This is expected until the dedicated app role is applied (deploy/rls/setup-app-role.sql).'
      )
      this.exitCode = 1
    }
  }
}
