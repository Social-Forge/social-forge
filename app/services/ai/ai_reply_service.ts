import logger from '@adonisjs/core/services/logger'
import Channel from '#models/channel'
import AiAgent from '#models/ai_agent'
import AiPlaybook from '#models/ai_playbook'
import AiAsset from '#models/ai_asset'
import Conversation from '#models/conversation'
import Message from '#models/message'
import TenantContext from '#services/tenant_context'
import aiRegistry from '#services/ai/registry'
import AiCreditService from '#services/ai/ai_credit_service'
import RagService from '#services/ai/rag_service'
import PromptBuilder from '#services/ai/prompt_builder'
import MinioService from '#services/storage/minio_service'
import OutboundService from '#services/messaging/outbound_service'
import { isWithinWorkingHours } from '#services/ai/working_hours'
import type { MessageContentType } from '#services/messaging/constants'
import type { AiMessage } from '#services/ai/types'

/** How many recent messages to feed the model as conversation context. */
const CONTEXT_WINDOW = 12

export type AiReplyJob = {
  channelId: string
  conversationId: string
  tenantId: string
}

/**
 * Generates an AI auto-reply for one inbound customer message. Runs in the
 * channel's tenant scope and enforces, in order: an active agent + auto-reply,
 * no human already handling the conversation, working-hours, and a positive
 * credit balance. On success it sends the reply via the normal outbound path
 * and atomically debits the metered credits.
 */
export default class AiReplyService {
  static async process(job: AiReplyJob): Promise<void> {
    const channel = await Channel.find(job.channelId)
    if (!channel || !channel.aiAgentId) return

    await TenantContext.run(channel.tenantId, async () => {
      const agent = await AiAgent.find(channel.aiAgentId!)
      if (!agent || !agent.isActive || !agent.autoReplyEnabled) return

      const conversation = await Conversation.find(job.conversationId)
      if (!conversation) return
      // Stand down once a human agent has taken the conversation (handoff).
      if (conversation.assignedAgentId) return

      // Working-hours gate.
      const wh = agent.workingHoursConfig
      if (wh?.enabled && !isWithinWorkingHours(wh)) {
        if (wh.outsideAction === 'reply' && wh.outsideMessage) {
          await OutboundService.sendAi(conversation, wh.outsideMessage)
        }
        return
      }

      // Credit gate — skip silently when the tenant is out of credits.
      if (!(await AiCreditService.hasCredits(channel.tenantId))) {
        logger.info({ tenantId: channel.tenantId }, 'AI reply skipped — no credits')
        return
      }

      const history = await Message.query()
        .where('conversation_id', conversation.id)
        .whereNull('deleted_at')
        .orderBy('created_at', 'desc')
        .limit(CONTEXT_WINDOW)

      const context = this.#toContext(history.reverse())
      // Only reply when the newest turn is from the customer.
      const lastUser = context.at(-1)
      if (lastUser?.role !== 'user') return

      // Safety: sensitive topic → hand off to a human (don't auto-answer).
      if (
        PromptBuilder.touchesAvoidTopic(agent, lastUser.content) &&
        (agent.safetyConfig.onSensitive ?? 'handoff') === 'handoff'
      ) {
        if (agent.safetyConfig.escalationMessage) {
          await OutboundService.sendAi(conversation, agent.safetyConfig.escalationMessage)
        }
        logger.info({ conversationId: conversation.id }, 'AI handoff — sensitive topic')
        return
      }

      // Match training playbooks by keyword on the customer's message.
      const playbooks = await AiPlaybook.query().where('ai_agent_id', agent.id)
      const matched = PromptBuilder.matchPlaybooks(playbooks, lastUser.content)

      // Ground the reply in the agent's knowledge base (RAG). No-op when no
      // embeddings provider is configured or nothing relevant is found.
      const chunks = await RagService.retrieve(agent.id, lastUser.content)
      const system = PromptBuilder.build(agent, matched, chunks)

      const provider = aiRegistry.get(agent.providerId)
      const result = await provider.chat(context, {
        model: agent.model,
        system,
        maxTokens: agent.maxTokens,
        // Claude ignores temperature; OpenAI honors it.
        ...(agent.temperature !== null ? { temperature: agent.temperature } : {}),
      })

      const text = result.text.trim()
      if (!text) return

      const message = await OutboundService.sendAi(conversation, text)

      // Price against the agent's configured model so the catalog always matches.
      await AiCreditService.debit({
        tenantId: channel.tenantId,
        model: agent.model,
        usage: result.usage,
        conversationId: conversation.id,
        messageId: message.id,
      })

      // Send the highest-priority matched playbook's assets (product photos,
      // testimonials, videos) as follow-up media messages.
      if (matched.length && matched[0].assetIdList.length) {
        await this.#sendAssets(conversation, matched[0].assetIdList)
      }
    })
  }

  /** Resolve assets to fresh presigned URLs and send them as media replies. */
  static async #sendAssets(conversation: Conversation, assetIds: string[]) {
    const assets = await AiAsset.query().whereIn('id', assetIds)
    for (const asset of assets) {
      try {
        const url = await MinioService.presignedGetUrl(asset.storageKey)
        const contentType: MessageContentType =
          asset.type === 'video' ? 'video' : asset.type === 'document' ? 'document' : 'image'
        await OutboundService.sendAi(conversation, asset.description ?? null, {
          contentType,
          mediaUrl: url,
        })
      } catch (error) {
        logger.error({ err: error, assetId: asset.id }, 'failed to send AI asset')
      }
    }
  }

  /**
   * Map persisted messages to provider turns: customer → user, agent/bot →
   * assistant. Drops leading assistant turns so the context starts with a user
   * message (required by the Messages API).
   */
  static #toContext(messages: Message[]): AiMessage[] {
    const out: AiMessage[] = []
    for (const m of messages) {
      if (m.senderType === 'system') continue
      const role = m.senderType === 'contact' ? 'user' : 'assistant'
      out.push({ role, content: m.body?.trim() || `[${m.contentType}]` })
    }
    while (out.length && out[0].role === 'assistant') out.shift()
    return out
  }
}
