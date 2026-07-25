import AiKnowledge from '#models/ai_knowledge'
import aiRegistry from '#services/ai/registry'

export type RetrievedChunk = { title: string; content: string; score: number }

/** Minimum cosine similarity for a chunk to be considered relevant. */
const MIN_SCORE = 0.2

/**
 * Lightweight RAG over the per-agent knowledge base. Embeddings are produced by
 * the OpenAI provider (Claude has no embeddings endpoint) and cosine similarity
 * is computed app-side — fine at the per-tenant scale, and avoids a pgvector
 * dependency. When OpenAI isn't configured, retrieval is a no-op so the bot
 * still replies (just without grounding).
 */
export default class RagService {
  /** Whether retrieval is possible (embeddings provider configured). */
  static get available(): boolean {
    return aiRegistry.isConfigured('openai')
  }

  /** Embed a piece of text, or null when no embeddings provider is configured. */
  static async embed(text: string): Promise<number[] | null> {
    if (!this.available) return null
    return aiRegistry.get('openai').embed(text)
  }

  /**
   * Return the top-`k` knowledge chunks most similar to `query` for an agent.
   * Empty when embeddings are unavailable or nothing clears the score floor.
   */
  static async retrieve(agentId: string, query: string, k = 3): Promise<RetrievedChunk[]> {
    if (!this.available || !query.trim()) return []

    const rows = await AiKnowledge.query().where('ai_agent_id', agentId).whereNotNull('embedding')
    if (!rows.length) return []

    const queryVec = await aiRegistry.get('openai').embed(query)

    return rows
      .map((row) => ({
        title: row.title,
        content: row.content,
        score: this.cosine(queryVec, row.vector ?? []),
      }))
      .filter((c) => c.score >= MIN_SCORE)
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
  }

  static cosine(a: number[], b: number[]): number {
    if (!a.length || a.length !== b.length) return 0
    let dot = 0
    let normA = 0
    let normB = 0
    for (const [i, ai] of a.entries()) {
      dot += ai * b[i]
      normA += ai * ai
      normB += b[i] * b[i]
    }
    if (normA === 0 || normB === 0) return 0
    return dot / (Math.sqrt(normA) * Math.sqrt(normB))
  }
}
