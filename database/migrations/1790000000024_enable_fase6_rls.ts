import { BaseSchema } from '@adonisjs/lucid/schema'

/** Tenant RLS backstop for the Phase 6 tables (see 1790000000005). */
const TENANT_TABLES = ['labels', 'conversation_labels', 'quick_replies'] as const

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
