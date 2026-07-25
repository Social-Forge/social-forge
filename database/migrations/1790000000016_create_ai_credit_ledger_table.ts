import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'ai_credit_ledger'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()')).notNullable()
      table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE')

      // Signed change: positive = grant/top-up, negative = debit (AI reply).
      table.integer('delta').notNullable()
      // Running balance after applying this entry (matches tenants.ai_credits).
      table.integer('balance_after').notNullable()
      // grant | topup | debit | adjustment
      table.string('reason').notNullable()

      // Metering context for debits (nullable for grants/top-ups).
      table.string('model').nullable()
      table.integer('input_tokens').nullable()
      table.integer('output_tokens').nullable()
      table.decimal('cost_usd', 12, 6).nullable()
      table.uuid('conversation_id').nullable()
      table.uuid('message_id').nullable()

      table.timestamp('created_at').notNullable().defaultTo(this.raw('CURRENT_TIMESTAMP'))

      table.index(['tenant_id', 'created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
