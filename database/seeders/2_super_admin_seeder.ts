import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'
import env from '#start/env'
import User from '#models/user'
import Role, { ROLES } from '#models/role'

/**
 * Seeds the platform super admin from DEFAULT_ADMIN_* env. The super admin is
 * platform-level (tenant_id = null) and pre-verified. No-op if env is unset.
 */
export default class extends BaseSeeder {
  async run() {
    const email = env.get('DEFAULT_ADMIN_EMAIL')
    const password = env.get('DEFAULT_ADMIN_PASSWORD')
    if (!email || !password) {
      return
    }

    const role = await Role.findByOrFail('name', ROLES.superAdmin.name)

    await User.updateOrCreate(
      { email },
      {
        email,
        password,
        fullName: 'Super Admin',
        roleId: role.id,
        tenantId: null,
        status: 'active',
        emailVerifiedAt: DateTime.now(),
      }
    )
  }
}
