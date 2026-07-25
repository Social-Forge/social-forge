import { TenantSchema } from '#database/schema'
import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Division from '#models/division'

export default class Tenant extends TenantSchema {
  @hasMany(() => User)
  declare users: HasMany<typeof User>

  @hasMany(() => Division)
  declare divisions: HasMany<typeof Division>

  get isOnTrial() {
    return this.status === 'trial'
  }
}
