import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import Tenant from '#models/tenant'
import User from '#models/user'
import Role, { ROLES } from '#models/role'
import EntitlementService from '#services/entitlement_service'

const TRIAL_DAYS = 14

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return base || 'tenant'
}

export type RegisterTenantInput = {
  tenantName: string
  fullName: string | null
  email: string
  password: string
  avatar?: string | null
}

export default class TenantService {
  /** Find a slug not yet taken, appending -2, -3, … on collision. */
  static async uniqueSlug(name: string, trx: TransactionClientContract): Promise<string> {
    const base = slugify(name)
    let slug = base
    let suffix = 1
    while (await Tenant.query({ client: trx }).where('slug', slug).first()) {
      suffix += 1
      slug = `${base}-${suffix}`
    }
    return slug
  }

  /**
   * Provision a new tenant with its Owner in a single transaction. Used by
   * public signup and by seeders. The Owner role must be seeded beforehand.
   */
  static async register(input: RegisterTenantInput): Promise<{ tenant: Tenant; owner: User }> {
    return db.transaction(async (trx) => {
      const ownerRole = await Role.findByOrFail('name', ROLES.owner.name, { client: trx })

      const tenant = await Tenant.create(
        {
          name: input.tenantName,
          slug: await this.uniqueSlug(input.tenantName, trx),
          status: 'trial',
          plan: 'free',
          trialEndsAt: DateTime.now().plus({ days: TRIAL_DAYS }),
          aiCredits: EntitlementService.planAiCredits('free'),
        },
        { client: trx }
      )

      const owner = await User.create(
        {
          fullName: input.fullName,
          email: input.email,
          password: input.password,
          tenantId: tenant.id,
          roleId: ownerRole.id,
          status: 'active',
          avatar: input.avatar,
        },
        { client: trx }
      )

      return { tenant, owner }
    })
  }
}
