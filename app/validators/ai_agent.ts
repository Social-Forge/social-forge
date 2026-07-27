import vine from '@vinejs/vine'
import { AI_MODELS } from '#config/ai'

const MODEL_IDS = Object.keys(AI_MODELS)
const PROVIDERS = ['claude', 'openai'] as const

/** Per-weekday open ranges: { mon: [["09:00","17:00"]], ... }. */
const workingHoursSchema = vine
  .object({
    enabled: vine.boolean(),
    timezone: vine.string().trim(),
    schedule: vine.record(vine.array(vine.array(vine.string()))),
    outsideAction: vine.enum(['silent', 'reply'] as const),
    outsideMessage: vine.string().trim().maxLength(1000).optional(),
  })
  .nullable()
  .optional()

/** Sales-agent persona / identity. */
const personaSchema = vine
  .object({
    agentName: vine.string().trim().maxLength(80).optional(),
    soul: vine.string().trim().maxLength(2000).optional(),
    styleTone: vine.string().trim().maxLength(2000).optional(),
    gender: vine.enum(['male', 'female', 'neutral'] as const).optional(),
    characterStyle: vine.string().trim().maxLength(2000).optional(),
    greeting: vine.string().trim().maxLength(1000).optional(),
  })
  .nullable()
  .optional()

const safetySchema = vine
  .object({
    avoidTopics: vine.array(vine.string().trim()).optional(),
    onSensitive: vine.enum(['handoff', 'disclaimer'] as const).optional(),
    escalationMessage: vine.string().trim().maxLength(1000).optional(),
  })
  .nullable()
  .optional()

const guardrailsSchema = vine.array(vine.string().trim().maxLength(500)).nullable().optional()

export const createAiAgentValidator = vine.create({
  name: vine.string().trim().minLength(2).maxLength(80),
  provider: vine.enum(PROVIDERS),
  model: vine.enum(MODEL_IDS),
  systemPrompt: vine.string().trim().minLength(1).maxLength(20000),
  temperature: vine.number().min(0).max(2).nullable().optional(),
  maxTokens: vine.number().min(64).max(8192).optional(),
  autoReplyEnabled: vine.boolean().optional(),
  workingHours: workingHoursSchema,
  persona: personaSchema,
  safety: safetySchema,
  guardrails: guardrailsSchema,
  isActive: vine.boolean().optional(),
})

export const updateAiAgentValidator = vine.create({
  name: vine.string().trim().minLength(2).maxLength(80).optional(),
  provider: vine.enum(PROVIDERS).optional(),
  model: vine.enum(MODEL_IDS).optional(),
  systemPrompt: vine.string().trim().minLength(1).maxLength(20000).optional(),
  temperature: vine.number().min(0).max(2).nullable().optional(),
  maxTokens: vine.number().min(64).max(8192).optional(),
  autoReplyEnabled: vine.boolean().optional(),
  workingHours: workingHoursSchema,
  persona: personaSchema,
  safety: safetySchema,
  guardrails: guardrailsSchema,
  isActive: vine.boolean().optional(),
})
