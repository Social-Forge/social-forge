import type AiAgent from '#models/ai_agent'
import type AiPlaybook from '#models/ai_playbook'
import type { RetrievedChunk } from '#services/ai/rag_service'

/**
 * Assembles the full system prompt for a sales-focused AI agent from its
 * persona/identity, guardrails, safety rules, the playbooks triggered by the
 * current customer message, and retrieved knowledge. Also provides the pure
 * matching helpers (playbook keywords, sensitive-topic detection) so the reply
 * worker and tests share one implementation.
 */
export default class PromptBuilder {
  /** Build the system prompt. Pure — safe to unit test with in-memory models. */
  static build(agent: AiAgent, matched: AiPlaybook[], knowledge: RetrievedChunk[]): string {
    const p = agent.personaConfig
    const parts: string[] = []

    // Identity
    const identity: string[] = []
    if (p.agentName)
      identity.push(
        `Your name is ${p.agentName}. Introduce and refer to yourself as ${p.agentName}.`
      )
    if (p.soul) identity.push(p.soul)
    if (p.gender) identity.push(`You present as ${p.gender}.`)
    if (p.characterStyle) identity.push(p.characterStyle)
    if (identity.length) parts.push(`# Identity\n${identity.join(' ')}`)

    // Objective — this agent is optimized for closing sales.
    parts.push(
      '# Objective\n' +
        'You are a sales-focused assistant. Help the customer genuinely and move the conversation ' +
        'toward a successful purchase (closing). Be honest — never invent facts, prices, or stock. ' +
        'Ask a clarifying question when it helps, then guide toward the next step (order, payment, ' +
        'or scheduling).'
    )

    // Core mission (from the classic system prompt)
    if (agent.systemPrompt?.trim()) parts.push(`# Mission\n${agent.systemPrompt.trim()}`)

    // Style & tone
    if (p.styleTone) parts.push(`# Style & tone\n${p.styleTone}`)

    // Guardrails
    const guardrails = agent.guardrailList.filter((g) => g.trim())
    if (guardrails.length) {
      parts.push(`# Guardrails (always follow)\n${guardrails.map((g) => `- ${g}`).join('\n')}`)
    }

    // Safety
    const safety = agent.safetyConfig
    const topics = (safety.avoidTopics ?? []).filter((t) => t.trim())
    if (topics.length) {
      const rule =
        safety.onSensitive === 'disclaimer'
          ? 'If the customer raises them, reply only with a brief, safe disclaimer and avoid specifics.'
          : 'If the customer raises them, do not attempt to answer — a human teammate will take over.'
      parts.push(`# Safety\nAvoid these sensitive topics: ${topics.join(', ')}. ${rule}`)
    }

    // Triggered playbooks (highest-signal instructions for THIS message)
    if (matched.length) {
      const rules = matched.map((m) => `- ${m.name}: ${m.instruction}`).join('\n')
      parts.push(`# Playbooks triggered by this message (follow closely)\n${rules}`)
    }

    // Knowledge base (RAG)
    if (knowledge.length) {
      const kb = knowledge.map((c) => `## ${c.title}\n${c.content}`).join('\n\n')
      parts.push(
        `# Knowledge base\nUse the following when relevant; if it doesn't cover the question, say so honestly.\n\n${kb}`
      )
    }

    return parts.join('\n\n')
  }

  /** Active playbooks whose keywords appear in the message, highest priority first. */
  static matchPlaybooks(playbooks: AiPlaybook[], message: string): AiPlaybook[] {
    const text = message.toLowerCase()
    return playbooks
      .filter(
        (pb) =>
          pb.isActive &&
          pb.keywordList.some((k) => k.trim() && text.includes(k.toLowerCase().trim()))
      )
      .sort((a, b) => b.priority - a.priority)
  }

  /** Whether the message touches any configured sensitive topic. */
  static touchesAvoidTopic(agent: AiAgent, message: string): boolean {
    const text = message.toLowerCase()
    return (agent.safetyConfig.avoidTopics ?? []).some(
      (t) => t.trim() && text.includes(t.toLowerCase().trim())
    )
  }
}
