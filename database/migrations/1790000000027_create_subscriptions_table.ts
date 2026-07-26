import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'subscriptions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()')).notNullable()
      table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE')
      table.uuid('plan_id').notNullable().references('id').inTable('plans').onDelete('RESTRICT')

      // trialing | active | past_due | canceled | expired
      table.string('status').notNullable().defaultTo('trialing')
      table.timestamp('current_period_start').nullable()
      table.timestamp('current_period_end').nullable()
      table.boolean('cancel_at_period_end').notNullable().defaultTo(false)

      table.timestamp('created_at').notNullable().defaultTo(this.raw('CURRENT_TIMESTAMP'))
      table.timestamp('updated_at').nullable().defaultTo(this.raw('CURRENT_TIMESTAMP'))

      // One active subscription row per tenant.
      table.unique(['tenant_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
