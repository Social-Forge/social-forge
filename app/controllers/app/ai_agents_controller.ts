import type { HttpContext } from '@adonisjs/core/http'
import AiAgent from '#models/ai_agent'
import AiAgentPolicy from '#policies/ai_agent_policy'
import AiCreditService from '#services/ai/ai_credit_service'
import AiCreditLedger from '#models/ai_credit_ledger'
import AuditService from '#services/audit/audit_service'
import aiRegistry from '#services/ai/registry'
import { AI_MODELS } from '#config/ai'
import { createAiAgentValidator, updateAiAgentValidator } from '#validators/ai_agent'
import type { AiProviderId } from '#services/ai/types'

export default class AiAgentsController {
  async index({ bouncer, response }: HttpContext) {
    await bouncer.with(AiAgentPolicy).authorize('viewAny')
    const agents = await AiAgent.query().orderBy('created_at', 'desc')
    return response.ok(agents)
  }

  async store({ bouncer, request, auth, response }: HttpContext) {
    await bouncer.with(AiAgentPolicy).authorize('create')
    const payload = await request.validateUsing(createAiAgentValidator)

    const agent = await AiAgent.create({
      tenantId: auth.user!.tenantId!,
      name: payload.name,
      provider: payload.provider,
      model: payload.model,
      systemPrompt: payload.systemPrompt,
      temperature: payload.temperature ?? null,
      maxTokens: payload.maxTokens ?? 1024,
      autoReplyEnabled: payload.autoReplyEnabled ?? true,
      workingHours: payload.workingHours ?? null,
      persona: payload.persona ?? null,
      safety: payload.safety ?? null,
      guardrails: payload.guardrails ?? null,
      isActive: payload.isActive ?? true,
    })

    await AuditService.record({
      action: 'ai_agent.create',
      tenantId: agent.tenantId,
      actorId: auth.user!.id,
      entityType: 'ai_agent',
      entityId: agent.id,
      metadata: { name: agent.name, provider: agent.provider, model: agent.model },
      ipAddress: request.ip(),
    })
    return response.created(agent)
  }

  async show({ bouncer, params, response }: HttpContext) {
    const agent = await AiAgent.findOrFail(params.id)
    await bouncer.with(AiAgentPolicy).authorize('view', agent)
    return response.ok(agent)
  }

  async update({ bouncer, params, request, response }: HttpContext) {
    const agent = await AiAgent.findOrFail(params.id)
    await bouncer.with(AiAgentPolicy).authorize('update', agent)
    const payload = await request.validateUsing(updateAiAgentValidator)

    if (payload.name !== undefined) agent.name = payload.name
    if (payload.provider !== undefined) agent.provider = payload.provider
    if (payload.model !== undefined) agent.model = payload.model
    if (payload.systemPrompt !== undefined) agent.systemPrompt = payload.systemPrompt
    if (payload.temperature !== undefined) agent.temperature = payload.temperature
    if (payload.maxTokens !== undefined) agent.maxTokens = payload.maxTokens
    if (payload.autoReplyEnabled !== undefined) agent.autoReplyEnabled = payload.autoReplyEnabled
    if (payload.workingHours !== undefined) agent.workingHours = payload.workingHours
    if (payload.persona !== undefined) agent.persona = payload.persona
    if (payload.safety !== undefined) agent.safety = payload.safety
    if (payload.guardrails !== undefined) agent.guardrails = payload.guardrails
    if (payload.isActive !== undefined) agent.isActive = payload.isActive

    await agent.save()
    return response.ok(agent)
  }

  async destroy({ bouncer, params, request, auth, response }: HttpContext) {
    const agent = await AiAgent.findOrFail(params.id)
    await bouncer.with(AiAgentPolicy).authorize('delete', agent)
    await agent.delete()
    await AuditService.record({
      action: 'ai_agent.delete',
      tenantId: agent.tenantId,
      actorId: auth.user!.id,
      entityType: 'ai_agent',
      entityId: agent.id,
      metadata: { name: agent.name },
      ipAddress: request.ip(),
    })
    return response.noContent()
  }

  /** Available models + which providers are configured, for the agent form. */
  async models({ bouncer, response }: HttpContext) {
    await bouncer.with(AiAgentPolicy).authorize('viewAny')
    const models = Object.entries(AI_MODELS).map(([id, m]) => ({
      id,
      label: m.label,
      provider: m.provider,
    }))
    const configured: Record<AiProviderId, boolean> = {
      claude: aiRegistry.isConfigured('claude'),
      openai: aiRegistry.isConfigured('openai'),
    }
    return response.ok({ models, configured })
  }

  /** Current AI credit balance + recent ledger entries. */
  async credits({ bouncer, auth, response }: HttpContext) {
    await bouncer.with(AiAgentPolicy).authorize('viewAny')
    const tenantId = auth.user!.tenantId!
    const balance = await AiCreditService.balance(tenantId)
    const ledger = await AiCreditLedger.query().orderBy('created_at', 'desc').limit(50)
    return response.ok({ balance, ledger })
  }
}
