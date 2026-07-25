import { BaseSchema } from '@adonisjs/lucid/schema'

/** Tenant RLS backstop for the knowledge base (see 1790000000005). */
export default class extends BaseSchema {
  async up() {
    this.schema.raw('ALTER TABLE ai_knowledge ENABLE ROW LEVEL SECURITY')
    this.schema.raw('ALTER TABLE ai_knowledge FORCE ROW LEVEL SECURITY')
    this.schema.raw(`
      CREATE POLICY tenant_isolation ON ai_knowledge
      USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
      WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid)
    `)
  }

  async down() {
    this.schema.raw('DROP POLICY IF EXISTS tenant_isolation ON ai_knowledge')
    this.schema.raw('ALTER TABLE ai_knowledge DISABLE ROW LEVEL SECURITY')
  }
}
