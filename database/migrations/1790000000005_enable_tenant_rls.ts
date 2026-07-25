import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Row-Level Security backstop for tenant-scoped tables (ARCHITECTURE.md §6).
 *
 * The PRIMARY isolation mechanism is application-level scoping (the
 * `TenantScoped` Lucid mixin). RLS is the second safety net: even a query that
 * forgets its tenant filter is blocked at the database.
 *
 * NOTE: PostgreSQL superusers BYPASS RLS. The app currently connects as the
 * `postgres` superuser, so these policies are defined-but-dormant until a
 * dedicated non-superuser application role is wired in Phase 9 (Hardening).
 * The policy reads `app.current_tenant`, which the `tenant` middleware already
 * sets per request, so enforcement flips on the moment that role lands.
 */
const TENANT_TABLES = ['divisions'] as const

export default class extends BaseSchema {
  async up() {
    for (const table of TENANT_TABLES) {
      this.schema.raw(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`)
      this.schema.raw(`ALTER TABLE ${table} FORCE ROW LEVEL SECURITY`)
      this.schema.raw(`
        CREATE POLICY tenant_isolation ON ${table}
        USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
        WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid)
      `)
    }
  }

  async down() {
    for (const table of TENANT_TABLES) {
      this.schema.raw(`DROP POLICY IF EXISTS tenant_isolation ON ${table}`)
      this.schema.raw(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY`)
    }
  }
}
