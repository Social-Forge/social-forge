import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Role, { ROLES } from '#models/role'

const DESCRIPTIONS: Record<string, string> = {
  super_admin: 'Platform administrator — manages all tenants and billing.',
  owner: 'Tenant owner — full control within their workspace.',
  supervisor: 'Manages agents, channels, and conversations within their divisions.',
  agent: 'Customer service agent — handles assigned conversations.',
}

export default class extends BaseSeeder {
  async run() {
    for (const { name, level } of Object.values(ROLES)) {
      await Role.updateOrCreate({ name }, { name, level, description: DESCRIPTIONS[name] })
    }
  }
}
