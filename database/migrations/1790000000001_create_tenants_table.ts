import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tenants'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()')).notNullable()
      table.string('name').notNullable()
      table.string('slug').notNullable().unique()
      // trial | active | suspended | cancelled
      table.string('status').notNullable().defaultTo('trial')
      // free | pro (billing plan code — full plans table lands in Phase 7)
      table.string('plan').notNullable().defaultTo('free')
      table.timestamp('trial_ends_at').nullable()
      table.jsonb('settings').notNullable().defaultTo('{}')
      table.timestamp('created_at').notNullable().defaultTo(this.raw('CURRENT_TIMESTAMP'))
      table.timestamp('updated_at').nullable().defaultTo(this.raw('CURRENT_TIMESTAMP'))

      table.index(['status'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
