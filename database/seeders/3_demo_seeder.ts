import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Tenant from '#models/tenant'
import Division from '#models/division'
import User from '#models/user'
import Role, { ROLES } from '#models/role'
import TenantService from '#services/tenant_service'

/**
 * Demo tenant for local development + tests: one Owner, one division, one Agent.
 * Guarded by slug so re-running the seeder is idempotent. Never runs in prod.
 */
export default class extends BaseSeeder {
  static environment = ['development', 'testing']

  async run() {
    if (await Tenant.findBy('slug', 'demo-store')) {
      return
    }

    const { tenant } = await TenantService.register({
      tenantName: 'Demo Store',
      fullName: 'Demo Owner',
      email: 'owner@demo.test',
      password: 'password',
    })

    const agentRole = await Role.findByOrFail('name', ROLES.agent.name)

    const division = await Division.create({
      tenantId: tenant.id,
      name: 'General',
      description: 'Default division',
    })

    const agent = await User.create({
      fullName: 'Demo Agent',
      email: 'agent@demo.test',
      password: 'password',
      tenantId: tenant.id,
      roleId: agentRole.id,
      status: 'active',
    })

    await division.related('members').attach([agent.id])
  }
}
