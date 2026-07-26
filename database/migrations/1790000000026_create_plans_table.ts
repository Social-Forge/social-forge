import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'plans'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()')).notNullable()

      // free | pro | ... — stable identifier used across the app.
      table.string('code').notNullable().unique()
      table.string('name').notNullable()
      // Price in minor units (IDR has none, so this is whole rupiah).
      table.integer('price').notNullable().defaultTo(0)
      table.string('currency').notNullable().defaultTo('IDR')
      // month | year
      table.string('interval').notNullable().defaultTo('month')
      // Entitlements: { channels: {type: n}, agents, aiCredits, aiAgents, quickReplies }
      table.jsonb('features').notNullable().defaultTo('{}')
      table.boolean('is_active').notNullable().defaultTo(true)
      table.integer('sort').notNullable().defaultTo(0)

      table.timestamp('created_at').notNullable().defaultTo(this.raw('CURRENT_TIMESTAMP'))
      table.timestamp('updated_at').nullable().defaultTo(this.raw('CURRENT_TIMESTAMP'))
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
