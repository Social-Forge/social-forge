import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'ai_agents'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()')).notNullable()
      table.uuid('tenant_id').notNullable().references('id').inTable('tenants').onDelete('CASCADE')

      table.string('name').notNullable()
      // claude | openai
      table.string('provider').notNullable().defaultTo('claude')
      // e.g. claude-opus-4-8, claude-haiku-4-5, gpt-4o-mini
      table.string('model').notNullable()
      table.text('system_prompt').notNullable()
      // Only sent to providers that accept sampling params (e.g. OpenAI).
      table.float('temperature').nullable()
      table.integer('max_tokens').notNullable().defaultTo(1024)

      // Master switch for auto-reply on channels this agent is attached to.
      table.boolean('auto_reply_enabled').notNullable().defaultTo(true)
      // { enabled, timezone, schedule: {mon:[["09:00","17:00"]],...},
      //   outsideAction: 'silent'|'reply', outsideMessage }
      table.jsonb('working_hours').nullable()

      table.boolean('is_active').notNullable().defaultTo(true)

      table.timestamp('created_at').notNullable().defaultTo(this.raw('CURRENT_TIMESTAMP'))
      table.timestamp('updated_at').nullable().defaultTo(this.raw('CURRENT_TIMESTAMP'))

      table.index(['tenant_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
