import type { HttpContext } from '@adonisjs/core/http'
import Division from '#models/division'
import User from '#models/user'
import DivisionPolicy from '#policies/division_policy'
import {
  createDivisionValidator,
  updateDivisionValidator,
  assignMembersValidator,
} from '#validators/division'

/**
 * Division CRUD + membership. All reads are tenant-scoped automatically by the
 * `TenantScoped` mixin; authorization is enforced by `DivisionPolicy`.
 */
export default class DivisionsController {
  async index({ bouncer, response }: HttpContext) {
    await bouncer.with(DivisionPolicy).authorize('viewAny')
    const divisions = await Division.query().preload('members').orderBy('name', 'asc')
    return response.ok(divisions)
  }

  async store({ bouncer, request, auth, response }: HttpContext) {
    await bouncer.with(DivisionPolicy).authorize('create')
    const payload = await request.validateUsing(createDivisionValidator)

    const division = await Division.create({
      tenantId: auth.user!.tenantId!,
      name: payload.name,
      description: payload.description ?? null,
    })

    return response.created(division)
  }

  async update({ bouncer, params, request, response }: HttpContext) {
    const division = await Division.findOrFail(params.id)
    await bouncer.with(DivisionPolicy).authorize('update', division)

    const payload = await request.validateUsing(updateDivisionValidator)
    division.merge({ name: payload.name, description: payload.description ?? null })
    await division.save()

    return response.ok(division)
  }

  async destroy({ bouncer, params, response }: HttpContext) {
    const division = await Division.findOrFail(params.id)
    await bouncer.with(DivisionPolicy).authorize('delete', division)
    await division.delete()
    return response.noContent()
  }

  /**
   * Replace a division's members. Cross-tenant user ids are filtered out by the
   * tenant-scoped `User` query, so members can never leak across tenants.
   */
  async assignMembers({ bouncer, params, request, response }: HttpContext) {
    const division = await Division.findOrFail(params.id)
    await bouncer.with(DivisionPolicy).authorize('update', division)

    const { userIds } = await request.validateUsing(assignMembersValidator)
    const validUsers = await User.query().whereIn('id', userIds)
    await division.related('members').sync(validUsers.map((user) => user.id))

    return response.ok({ memberIds: validUsers.map((user) => user.id) })
  }
}
