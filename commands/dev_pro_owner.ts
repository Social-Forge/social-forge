import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

/**
 * Dev helper: put an owner account on the **Pro** plan for end-to-end testing
 * (connect channels, send messages, AI replies) without going through a real
 * Xendit payment. Upgrades an existing owner, or creates one when `--password`
 * is given. Mirrors `BillingService.#activateSubscription` so entitlements stay
 * consistent.
 *
 *   node ace dev:pro-owner siti.jahhrah10@gmail.com --password=Secret123!
 *   node ace dev:pro-owner new.owner@test.local --password=Secret123! --name="Test Store"
 */
export default class DevProOwner extends BaseCommand {
  static commandName = 'dev:pro-owner'
  static description = 'Upgrade (or create) an owner account to the Pro plan for testing'
  static options: CommandOptions = { startApp: true }

  @args.string({ description: 'Owner email address' })
  declare email: string

  @flags.string({ description: 'Set/reset the account password (required to create a new owner)' })
  declare password?: string

  @flags.string({ description: 'Full name / store name when creating a new owner' })
  declare name?: string

  async run() {
    const { DateTime } = await import('luxon')
    const { default: TenantContext } = await import('#services/tenant_context')
    const { default: User } = await import('#models/user')
    const { default: Tenant } = await import('#models/tenant')
    const { default: Plan } = await import('#models/plan')
    const { default: Subscription } = await import('#models/subscription')
    const { default: Role, ROLES } = await import('#models/role')
    const { default: AiCreditService } = await import('#services/ai/ai_credit_service')
    const { default: TenantService } = await import('#services/tenant_service')
    const { default: billingConfig } = await import('#config/billing')

    await TenantContext.runBypassed(async () => {
      const plan = await Plan.findBy('code', 'pro')
      if (!plan) {
        this.logger.error('The "pro" plan is not seeded. Run: node ace db:seed')
        this.exitCode = 1
        return
      }

      // Resolve or create the owner.
      let user = await User.findBy('email', this.email)
      if (!user) {
        if (!this.password) {
          this.logger.error(`No user "${this.email}". Pass --password to create a new owner.`)
          this.exitCode = 1
          return
        }
        const { owner } = await TenantService.register({
          tenantName: this.name ?? `${this.email.split('@')[0]} Store`,
          fullName: this.name ?? 'Pro Tester',
          email: this.email,
          password: this.password,
        })
        user = owner
        this.logger.info(`created new owner + tenant for ${this.email}`)
      } else if (this.password) {
        user.password = this.password // hashed by the auth finder on save
        await user.save()
        this.logger.info('password updated')
      }

      if (!user.tenantId) {
        this.logger.error('This user has no tenant (is it a super admin?). Aborting.')
        this.exitCode = 1
        return
      }
      const tenant = await Tenant.find(user.tenantId)
      if (!tenant) {
        this.logger.error('Tenant not found for this user.')
        this.exitCode = 1
        return
      }

      // Ensure the account has the Owner role.
      const ownerRole = await Role.findBy('name', ROLES.owner.name)
      if (ownerRole && user.roleId !== ownerRole.id) {
        user.roleId = ownerRole.id
        await user.save()
        this.logger.info('role set to owner')
      }

      // Activate the Pro subscription (mirrors the paid-invoice webhook path).
      const now = DateTime.now()
      const periodEnd = now.plus({ days: billingConfig.periodDays })

      tenant.plan = plan.code
      tenant.status = 'active'
      await tenant.save()

      const sub = await Subscription.findBy('tenant_id', tenant.id)
      if (sub) {
        sub.planId = plan.id
        sub.status = 'active'
        sub.currentPeriodStart = now
        sub.currentPeriodEnd = periodEnd
        sub.cancelAtPeriodEnd = false
        await sub.save()
      } else {
        await Subscription.create({
          tenantId: tenant.id,
          planId: plan.id,
          status: 'active',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        })
      }

      // Top up AI credits to the Pro bundle (idempotent — only tops up).
      const target = plan.featuresConfig.aiCredits ?? 0
      const current = await AiCreditService.balance(tenant.id)
      if (target > current) await AiCreditService.grant(tenant.id, target - current, 'grant')

      this.logger.success(`✔ ${this.email} is now on the Pro plan`)
      this.logger.info(`  tenant      : ${tenant.name} (${tenant.id})`)
      this.logger.info(`  plan/status : ${tenant.plan} · ${tenant.status}`)
      this.logger.info(`  period ends : ${periodEnd.toISODate()}`)
      this.logger.info(`  AI credits  : ${await AiCreditService.balance(tenant.id)}`)
      if (this.password) this.logger.info(`  login       : ${this.email} / ${this.password}`)
    })
  }
}
