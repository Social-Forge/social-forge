import type { HttpContext } from '@adonisjs/core/http'
import AiKnowledge from '#models/ai_knowledge'
import AiAgent from '#models/ai_agent'
import AiAgentPolicy from '#policies/ai_agent_policy'
import RagService from '#services/ai/rag_service'
import { createKnowledgeValidator, updateKnowledgeValidator } from '#validators/ai_knowledge'

/**
 * Knowledge base entries per AI agent. On create/update the content is embedded
 * (when an embeddings provider is configured) so the RAG retriever can ground
 * replies. Owner-managed; tenant-scoped.
 */
export default class AiKnowledgeController {
  async index({ bouncer, request, response }: HttpContext) {
    await bouncer.with(AiAgentPolicy).authorize('viewAny')
    const agentId = request.input('agentId')
    const query = AiKnowledge.query().orderBy('created_at', 'desc')
    if (agentId) query.where('ai_agent_id', agentId)
    // Don't ship raw embedding vectors to the client.
    const rows = await query.select([
      'id',
      'ai_agent_id',
      'title',
      'content',
      'token_count',
      'created_at',
      'updated_at',
    ])
    return response.ok(rows)
  }

  async store({ bouncer, request, response }: HttpContext) {
    await bouncer.with(AiAgentPolicy).authorize('create')
    const payload = await request.validateUsing(createKnowledgeValidator)

    const agent = await AiAgent.find(payload.aiAgentId)
    if (!agent) return response.badRequest({ message: 'AI agent not found.' })

    const embedding = await RagService.embed(payload.content)
    const entry = await AiKnowledge.create({
      tenantId: agent.tenantId,
      aiAgentId: agent.id,
      title: payload.title,
      content: payload.content,
      embedding,
      tokenCount: Math.ceil(payload.content.length / 4),
    })

    return response.created(this.#serialize(entry))
  }

  async update({ bouncer, params, request, response }: HttpContext) {
    await bouncer.with(AiAgentPolicy).authorize('create')
    const entry = await AiKnowledge.findOrFail(params.id)
    const payload = await request.validateUsing(updateKnowledgeValidator)

    if (payload.title !== undefined) entry.title = payload.title
    if (payload.content !== undefined) {
      entry.content = payload.content
      entry.tokenCount = Math.ceil(payload.content.length / 4)
      // Re-embed on content change so retrieval stays accurate.
      entry.embedding = await RagService.embed(payload.content)
    }

    await entry.save()
    return response.ok(this.#serialize(entry))
  }

  async destroy({ bouncer, params, response }: HttpContext) {
    await bouncer.with(AiAgentPolicy).authorize('create')
    const entry = await AiKnowledge.findOrFail(params.id)
    await entry.delete()
    return response.noContent()
  }

  #serialize(entry: AiKnowledge) {
    return {
      id: entry.id,
      aiAgentId: entry.aiAgentId,
      title: entry.title,
      content: entry.content,
      tokenCount: entry.tokenCount,
      embedded: entry.embedding !== null,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }
  }
}
