import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Role from '#models/role'
import TeamPolicy from '#policies/team_policy'
import { createTeamMemberValidator, updateTeamMemberValidator } from '#validators/team'

/**
 * Manage a tenant's team members (Supervisors + Agents). Owner-only writes,
 * enforced by `TeamPolicy`; reads are tenant-scoped by the `TenantScoped` mixin.
 */
export default class TeamController {
  async index({ bouncer, response }: HttpContext) {
    await bouncer.with(TeamPolicy).authorize('viewAny')
    const members = await User.query()
      .preload('role')
      .whereHas('role', (query) => query.whereIn('name', ['supervisor', 'agent']))
      .orderBy('full_name', 'asc')
    return response.ok(members)
  }

  async store({ bouncer, request, auth, response }: HttpContext) {
    await bouncer.with(TeamPolicy).authorize('create')
    const payload = await request.validateUsing(createTeamMemberValidator)
    const role = await Role.findByOrFail('name', payload.role)

    const member = await User.create({
      fullName: payload.fullName,
      email: payload.email,
      password: payload.password,
      roleId: role.id,
      tenantId: auth.user!.tenantId!,
      status: 'active',
    })

    return response.created(member)
  }

  async update({ bouncer, params, request, response }: HttpContext) {
    const target = await User.findOrFail(params.id)
    await bouncer.with(TeamPolicy).authorize('update', target)

    const payload = await request.validateUsing(updateTeamMemberValidator(target.id))

    if (payload.role) {
      const role = await Role.findByOrFail('name', payload.role)
      target.roleId = role.id
    }
    if (payload.fullName !== undefined) target.fullName = payload.fullName
    if (payload.email !== undefined) target.email = payload.email
    if (payload.status !== undefined) target.status = payload.status

    await target.save()
    return response.ok(target)
  }

  async destroy({ bouncer, params, response }: HttpContext) {
    const target = await User.findOrFail(params.id)
    await bouncer.with(TeamPolicy).authorize('delete', target)
    await target.delete()
    return response.noContent()
  }
}
