import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider, type AccessToken } from '@adonisjs/auth/access_tokens'
import { belongsTo, manyToMany, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany, HasMany } from '@adonisjs/lucid/types/relations'
import { TenantScoped } from '#models/mixins/tenant_scoped'
import Role, { type RoleName } from '#models/role'
import Tenant from '#models/tenant'
import Division from '#models/division'
import OauthProvider from '#models/oauth_provider'

export default class User extends compose(UserSchema, withAuthFinder(hash), TenantScoped) {
  @belongsTo(() => Role)
  declare role: BelongsTo<typeof Role>

  @belongsTo(() => Tenant)
  declare tenant: BelongsTo<typeof Tenant>

  @manyToMany(() => Division, {
    pivotTable: 'division_members',
    pivotForeignKey: 'user_id',
    pivotRelatedForeignKey: 'division_id',
    pivotTimestamps: true,
  })
  declare divisions: ManyToMany<typeof Division>

  @hasMany(() => OauthProvider)
  declare oauthProviders: HasMany<typeof OauthProvider>

  get initials() {
    const [first, last] = this.fullName ? this.fullName.split(' ') : this.email.split('@')
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }

    return `${first.slice(0, 2)}`.toUpperCase()
  }

  /**
   * Role checks below require the `role` relation to be loaded (the `tenant`
   * middleware preloads it for authenticated requests). They fail closed:
   * an unloaded role reads as no authority.
   */
  get isSuperAdmin() {
    return this.role?.name === 'super_admin'
  }

  hasRole(name: RoleName) {
    return this.role?.name === name
  }

  /** True when the user's role level is >= the given threshold. */
  atLeast(level: number) {
    return (this.role?.level ?? 0) >= level
  }

  static accessTokens = DbAccessTokensProvider.forModel(User, {
    expiresIn: '7 days',
    prefix: 'oat_',
    table: 'auth_access_tokens',
    type: 'auth_token',
    tokenSecretLength: 40,
  })
  currentAccessToken?: AccessToken
}
