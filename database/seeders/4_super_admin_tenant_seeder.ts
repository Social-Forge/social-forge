import { BaseSeeder } from '@adonisjs/lucid/seeders'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import Tenant from '#models/tenant'
import User from '#models/user'
import env from '#start/env'
import Plan from '#models/plan'
import Subscription from '#models/subscription'
import EntitlementService from '#services/entitlement_service'

const TRIAL_DAYS = 3652

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return base || 'tenant'
}

export default class extends BaseSeeder {
  async run() {
    return db.transaction(async (trx) => {
      const adminUser = await User.findByOrFail('email', env.get('DEFAULT_ADMIN_EMAIL'), {
        client: trx,
      })

      const tenant = await Tenant.create(
        {
          name: adminUser.fullName || 'Admin Social Forge',
          slug: await this.uniqueSlug(adminUser.fullName || 'Admin Social Forge', trx),
          status: 'active',
          plan: 'pro',
          trialEndsAt: DateTime.now().plus({ days: TRIAL_DAYS }),
          aiCredits: EntitlementService.planAiCredits('pro'),
        },
        { client: trx }
      )

      adminUser.merge({
        tenantId: tenant.id,
      })

      const proPlan = await Plan.findBy('code', 'pro', { client: trx })
      if (proPlan) {
        await Subscription.create(
          {
            tenantId: tenant.id,
            planId: proPlan.id,
            status: 'active',
            currentPeriodStart: DateTime.now(),
            currentPeriodEnd: DateTime.now().plus({ days: TRIAL_DAYS }),
          },
          { client: trx }
        )
      }
    })
  }

  async uniqueSlug(name: string, trx: TransactionClientContract): Promise<string> {
    const base = slugify(name)
    let slug = base
    let suffix = 1
    while (await Tenant.query({ client: trx }).where('slug', slug).first()) {
      suffix += 1
      slug = `${base}-${suffix}`
    }
    return slug
  }
}
