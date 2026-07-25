import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Extends the tenant RLS backstop to the AI tables (see
 * 1790000000005_enable_tenant_rls). Dormant until a non-superuser app role is
 * wired in Phase 9; the policy reads `app.current_tenant` set by middleware.
 */
const TENANT_TABLES = ['ai_agents', 'ai_credit_ledger'] as const

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
