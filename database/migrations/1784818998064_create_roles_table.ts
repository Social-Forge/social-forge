import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'roles'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()')).notNullable()
      table.string('name').notNullable()
      table.integer('level').defaultTo(0)
      table.text('description').nullable()
      table.timestamp('created_at').notNullable().defaultTo(this.raw('CURRENT_TIMESTAMP'))
      table.timestamp('updated_at').nullable().defaultTo(this.raw('CURRENT_TIMESTAMP'))

      table.unique(['name', 'level'])
      table.index(['level'])
      table.index(['name'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
