import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'audit_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()')).notNullable()
      // Nullable: platform-level (super admin) actions have no tenant.
      table.uuid('tenant_id').nullable().references('id').inTable('tenants').onDelete('CASCADE')
      // Nullable: system / unauthenticated actors.
      table.uuid('actor_id').nullable().references('id').inTable('users').onDelete('SET NULL')

      table.string('action').notNullable() // e.g. channel.create, billing.checkout
      table.string('entity_type').nullable() // e.g. channel, ai_agent, tenant
      table.string('entity_id').nullable()
      table.jsonb('metadata').nullable()
      table.string('ip_address').nullable()

      table.timestamp('created_at').notNullable().defaultTo(this.raw('CURRENT_TIMESTAMP'))

      table.index(['tenant_id', 'created_at'])
      table.index(['action'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
