import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Advanced sales-agent configuration (Phase 5.6):
 *  - persona:    { agentName, soul, styleTone, gender, characterStyle, greeting }
 *  - safety:     { avoidTopics: string[], onSensitive: 'handoff'|'disclaimer', escalationMessage }
 *  - guardrails: string[] of hard rules the agent must always follow
 */
export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('ai_agents', (table) => {
      table.jsonb('persona').nullable()
      table.jsonb('safety').nullable()
      table.jsonb('guardrails').nullable()
    })
  }

  async down() {
    this.schema.alterTable('ai_agents', (table) => {
      table.dropColumn('persona')
      table.dropColumn('safety')
      table.dropColumn('guardrails')
    })
  }
}
