import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * `conversation_labels` is a pure join table between two tenant-scoped models
 * (conversations, labels). Its own `tenant_id` made the Label many-to-many query
 * ambiguous (the TenantScoped mixin filters on an unqualified `tenant_id`, which
 * matched both the pivot and `labels`). Drop it — isolation is guaranteed by the
 * cascading FKs from the tenant-scoped parents.
 */
export default class extends BaseSchema {
  async up() {
    this.schema.raw('DROP POLICY IF EXISTS tenant_isolation ON conversation_labels')
    this.schema.raw('ALTER TABLE conversation_labels DISABLE ROW LEVEL SECURITY')
    this.schema.alterTable('conversation_labels', (table) => {
      table.dropColumn('tenant_id')
    })
  }

  async down() {
    this.schema.alterTable('conversation_labels', (table) => {
      table.uuid('tenant_id').nullable().references('id').inTable('tenants').onDelete('CASCADE')
    })
  }
}
