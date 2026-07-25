import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Null tenant_id = platform-level user (super admin).
      table.uuid('tenant_id').nullable().references('id').inTable('tenants').onDelete('CASCADE')
      table.uuid('role_id').nullable().references('id').inTable('roles').onDelete('RESTRICT')
      // active | invited | suspended
      table.string('status').notNullable().defaultTo('active')

      table.index(['tenant_id'])
      table.index(['role_id'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('tenant_id')
      table.dropColumn('role_id')
      table.dropColumn('status')
    })
  }
}
