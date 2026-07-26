import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'payment_events'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()')).notNullable()
      table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE')
      table.uuid('invoice_id').nullable().references('id').inTable('invoices').onDelete('SET NULL')

      table.string('provider').notNullable().defaultTo('xendit')
      table.string('event_type').notNullable()
      // Provider event id — used to dedup webhook redeliveries.
      table.string('external_id').nullable().unique()
      table.jsonb('payload').notNullable().defaultTo('{}')

      table.timestamp('created_at').notNullable().defaultTo(this.raw('CURRENT_TIMESTAMP'))

      table.index(['tenant_id', 'created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
