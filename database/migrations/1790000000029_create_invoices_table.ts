import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'invoices'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()')).notNullable()
      table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE')

      // Human-friendly sequential-ish reference (e.g. SF-XXXXXXXX).
      table.string('number').notNullable().unique()
      // pending | paid | expired | failed
      table.string('status').notNullable().defaultTo('pending')
      table.integer('amount').notNullable()
      table.string('currency').notNullable().defaultTo('IDR')
      table.string('description').notNullable()
      // What paying this invoice does: { type: 'subscription'|'addon', planCode?, addon? }
      table.jsonb('purpose').notNullable().defaultTo('{}')

      // Payment provider linkage.
      table.string('provider').notNullable().defaultTo('xendit')
      table.string('provider_invoice_id').nullable()
      table.text('checkout_url').nullable()

      table.timestamp('paid_at').nullable()
      table.timestamp('expires_at').nullable()

      table.timestamp('created_at').notNullable().defaultTo(this.raw('CURRENT_TIMESTAMP'))
      table.timestamp('updated_at').nullable().defaultTo(this.raw('CURRENT_TIMESTAMP'))

      table.index(['tenant_id', 'created_at'])
      table.index(['provider_invoice_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
