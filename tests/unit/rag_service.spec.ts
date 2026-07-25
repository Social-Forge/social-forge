import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Tenant from '#models/tenant'
import AiAgent from '#models/ai_agent'
import AiKnowledge from '#models/ai_knowledge'
import TenantContext from '#services/tenant_context'
import RagService from '#services/ai/rag_service'
import aiRegistry from '#services/ai/registry'

test.group('RAG cosine', () => {
  test('cosine similarity ranks aligned vectors highest', ({ assert }) => {
    assert.equal(RagService.cosine([1, 0, 0], [1, 0, 0]), 1)
    assert.equal(RagService.cosine([1, 0, 0], [0, 1, 0]), 0)
    assert.isAbove(RagService.cosine([1, 0, 0], [0.9, 0.1, 0]), 0.9)
  })

  test('mismatched or empty vectors score 0', ({ assert }) => {
    assert.equal(RagService.cosine([1, 0], [1, 0, 0]), 0)
    assert.equal(RagService.cosine([], []), 0)
  })
})

test.group('RAG retrieve', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => {
    const origConfigured = aiRegistry.isConfigured
    const origGet = aiRegistry.get
    // Pretend OpenAI is configured and embed the query near "doc A".
    ;(aiRegistry as any).isConfigured = () => true
    ;(aiRegistry as any).get = () => ({ embed: async () => [0.9, 0.1, 0] })
    return () => {
      ;(aiRegistry as any).isConfigured = origConfigured
      ;(aiRegistry as any).get = origGet
    }
  })

  test('returns the most similar knowledge chunk first', async ({ assert }) => {
    const tenant = await Tenant.create({
      name: 'KB Co',
      slug: `kb-${Math.random().toString(36).slice(2, 8)}`,
      status: 'active',
      plan: 'pro',
    })

    const chunks = await TenantContext.run(tenant.id, async () => {
      const agent = await AiAgent.create({
        tenantId: tenant.id,
        name: 'Bot',
        provider: 'claude',
        model: 'claude-opus-4-8',
        systemPrompt: 'x',
        maxTokens: 512,
      })
      await AiKnowledge.create({
        tenantId: tenant.id,
        aiAgentId: agent.id,
        title: 'Doc A',
        content: 'Store hours are 9-5',
        embedding: [1, 0, 0],
        tokenCount: 5,
      })
      await AiKnowledge.create({
        tenantId: tenant.id,
        aiAgentId: agent.id,
        title: 'Doc B',
        content: 'Return policy is 30 days',
        embedding: [0, 1, 0],
        tokenCount: 5,
      })
      // No embedding → must be ignored by retrieval.
      await AiKnowledge.create({
        tenantId: tenant.id,
        aiAgentId: agent.id,
        title: 'Doc C',
        content: 'Unembedded',
        embedding: null,
        tokenCount: 1,
      })

      return RagService.retrieve(agent.id, 'what time do you open?')
    })

    assert.isAbove(chunks.length, 0)
    assert.equal(chunks[0].title, 'Doc A')
    assert.isFalse(chunks.some((c) => c.title === 'Doc C'))
  })
})
