import { AiAgentSchema } from '#database/schema'
import { TenantScoped } from '#models/mixins/tenant_scoped'
import { compose } from '@adonisjs/core/helpers'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Tenant from '#models/tenant'
import Channel from '#models/channel'
import AiPlaybook from '#models/ai_playbook'
import AiAsset from '#models/ai_asset'
import type { AiProviderId } from '#services/ai/types'

/** Sales-agent persona / identity (ElevenLabs-style character config). */
export type AgentPersona = {
  agentName?: string
  soul?: string
  styleTone?: string
  gender?: 'male' | 'female' | 'neutral'
  characterStyle?: string
  greeting?: string
}

/** Safety configuration for sensitive topics. */
export type AgentSafety = {
  avoidTopics?: string[]
  onSensitive?: 'handoff' | 'disclaimer'
  escalationMessage?: string
}

/** Shape of the `working_hours` jsonb config. */
export type WorkingHours = {
  enabled: boolean
  /** IANA timezone, e.g. "Asia/Jakarta". */
  timezone: string
  /** Per-weekday open ranges ["HH:mm","HH:mm"]; empty/absent = closed all day. */
  schedule: Partial<
    Record<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun', [string, string][]>
  >
  /** What to do outside working hours. */
  outsideAction: 'silent' | 'reply'
  /** Canned message sent when outsideAction = 'reply'. */
  outsideMessage?: string
}

export default class AiAgent extends compose(AiAgentSchema, TenantScoped) {
  @belongsTo(() => Tenant)
  declare tenant: BelongsTo<typeof Tenant>

  @hasMany(() => Channel)
  declare channels: HasMany<typeof Channel>

  @hasMany(() => AiPlaybook)
  declare playbooks: HasMany<typeof AiPlaybook>

  @hasMany(() => AiAsset)
  declare assets: HasMany<typeof AiAsset>

  get providerId(): AiProviderId {
    return this.provider as AiProviderId
  }

  get workingHoursConfig(): WorkingHours | null {
    return (this.workingHours as WorkingHours | null) ?? null
  }

  get personaConfig(): AgentPersona {
    return (this.persona as AgentPersona | null) ?? {}
  }

  get safetyConfig(): AgentSafety {
    return (this.safety as AgentSafety | null) ?? {}
  }

  get guardrailList(): string[] {
    return (this.guardrails as string[] | null) ?? []
  }
}
