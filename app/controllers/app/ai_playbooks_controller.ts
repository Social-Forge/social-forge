import type { HttpContext } from '@adonisjs/core/http'
import AiPlaybook from '#models/ai_playbook'
import AiAgent from '#models/ai_agent'
import AiAgentPolicy from '#policies/ai_agent_policy'
import { createPlaybookValidator, updatePlaybookValidator } from '#validators/ai_advanced'

/** Training playbooks — keyword-triggered response rules for a sales agent. */
export default class AiPlaybooksController {
  async index({ bouncer, request, response }: HttpContext) {
    await bouncer.with(AiAgentPolicy).authorize('viewAny')
    const query = AiPlaybook.query().orderBy('priority', 'desc')
    if (request.input('agentId')) query.where('ai_agent_id', request.input('agentId'))
    return response.ok(await query)
  }

  async store({ bouncer, request, response }: HttpContext) {
    await bouncer.with(AiAgentPolicy).authorize('create')
    const payload = await request.validateUsing(createPlaybookValidator)

    const agent = await AiAgent.find(payload.aiAgentId)
    if (!agent) return response.badRequest({ message: 'AI agent not found.' })

    const playbook = await AiPlaybook.create({
      tenantId: agent.tenantId,
      aiAgentId: agent.id,
      name: payload.name,
      keywords: payload.keywords,
      instruction: payload.instruction,
      assetIds: payload.assetIds ?? [],
      priority: payload.priority ?? 0,
      isActive: payload.isActive ?? true,
    })
    return response.created(playbook)
  }

  async update({ bouncer, params, request, response }: HttpContext) {
    await bouncer.with(AiAgentPolicy).authorize('create')
    const playbook = await AiPlaybook.findOrFail(params.id)
    const payload = await request.validateUsing(updatePlaybookValidator)

    if (payload.name !== undefined) playbook.name = payload.name
    if (payload.keywords !== undefined) playbook.keywords = payload.keywords
    if (payload.instruction !== undefined) playbook.instruction = payload.instruction
    if (payload.assetIds !== undefined) playbook.assetIds = payload.assetIds
    if (payload.priority !== undefined) playbook.priority = payload.priority
    if (payload.isActive !== undefined) playbook.isActive = payload.isActive

    await playbook.save()
    return response.ok(playbook)
  }

  async destroy({ bouncer, params, response }: HttpContext) {
    await bouncer.with(AiAgentPolicy).authorize('create')
    const playbook = await AiPlaybook.findOrFail(params.id)
    await playbook.delete()
    return response.noContent()
  }
}
