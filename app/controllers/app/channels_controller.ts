import type { HttpContext } from '@adonisjs/core/http'
import { randomUUID } from 'node:crypto'
import string from '@adonisjs/core/helpers/string'
import env from '#start/env'
import Channel from '#models/channel'
import Tenant from '#models/tenant'
import AiAgent from '#models/ai_agent'
import ChannelPolicy from '#policies/channel_policy'
import EntitlementService, { ChannelLimitReachedException } from '#services/entitlement_service'
import AuditService from '#services/audit/audit_service'
import WahaSessionService from '#services/waha/waha_session_service'
import telegramClient from '#services/telegram/telegram_client'
import {
  createChannelValidator,
  updateChannelValidator,
  configureChannelValidator,
} from '#validators/channel'

export default class ChannelsController {
  async index({ bouncer, response }: HttpContext) {
    await bouncer.with(ChannelPolicy).authorize('viewAny')
    const channels = await Channel.query().preload('division').orderBy('created_at', 'desc')
    return response.ok(channels)
  }

  async store({ bouncer, request, auth, response }: HttpContext) {
    await bouncer.with(ChannelPolicy).authorize('create')
    const payload = await request.validateUsing(createChannelValidator)
    const tenant = await Tenant.findOrFail(auth.user!.tenantId!)
    try {
      await EntitlementService.assertCanCreateChannel(tenant, payload.type)
    } catch (error) {
      if (error instanceof ChannelLimitReachedException) {
        return response.forbidden({ message: error.message })
      }
      throw error
    }

    const isWaha = payload.type === 'whatsapp_waha'
    // Webchat needs no external connection — it's live as soon as it's embedded.
    const channel = await Channel.create({
      tenantId: tenant.id,
      divisionId: payload.divisionId ?? null,
      type: payload.type,
      name: payload.name,
      status: payload.type === 'webchat' ? 'connected' : 'disconnected',
      wahaEngine: isWaha ? (payload.wahaEngine ?? 'gows') : null,
      wahaSessionName: isWaha ? `sf${randomUUID().replace(/-/g, '')}` : null,
      webhookSecret: string.random(32),
    })

    await AuditService.record({
      action: 'channel.create',
      tenantId: tenant.id,
      actorId: auth.user!.id,
      entityType: 'channel',
      entityId: channel.id,
      metadata: { type: channel.type, name: channel.name },
      ipAddress: request.ip(),
    })
    return response.created(channel)
  }

  async update({ bouncer, params, request, response }: HttpContext) {
    const channel = await Channel.findOrFail(params.id)
    await bouncer.with(ChannelPolicy).authorize('update', channel)
    const payload = await request.validateUsing(updateChannelValidator)
    if (payload.name !== undefined) channel.name = payload.name
    if (payload.divisionId !== undefined) channel.divisionId = payload.divisionId
    if (payload.aiAgentId !== undefined) {
      // Confirm the agent exists in this tenant (scoped find) before linking.
      if (payload.aiAgentId) {
        const agent = await AiAgent.find(payload.aiAgentId)
        if (!agent) return response.badRequest({ message: 'AI agent not found.' })
      }
      channel.aiAgentId = payload.aiAgentId
    }
    if (payload.firstReply !== undefined) {
      const settings = { ...((channel.settings as Record<string, unknown> | null) ?? {}) }
      if (payload.firstReply === null) {
        delete settings.firstReply
      } else {
        settings.firstReply = payload.firstReply
      }
      channel.settings = settings
    }
    await channel.save()
    return response.ok(channel)
  }

  async destroy({ bouncer, params, request, auth, response }: HttpContext) {
    const channel = await Channel.findOrFail(params.id)
    await bouncer.with(ChannelPolicy).authorize('delete', channel)
    if (channel.isWaha && channel.wahaSessionName) {
      await WahaSessionService.remove(channel)
    }
    await channel.delete()
    await AuditService.record({
      action: 'channel.delete',
      tenantId: channel.tenantId,
      actorId: auth.user!.id,
      entityType: 'channel',
      entityId: channel.id,
      metadata: { type: channel.type, name: channel.name },
      ipAddress: request.ip(),
    })
    return response.noContent()
  }

  /**
   * Store provider credentials (encrypted) for Meta/Telegram channels. For
   * Telegram this also registers the bot webhook; Meta channels rely on the
   * app-level webhook so storing a valid token marks them connected.
   */
  async configure({ bouncer, params, request, auth, response }: HttpContext) {
    const channel = await Channel.findOrFail(params.id)
    await bouncer.with(ChannelPolicy).authorize('update', channel)

    const { credentials, externalId } = await request.validateUsing(configureChannelValidator)
    for (const [key, value] of Object.entries(credentials)) {
      channel.setCredential(key, value)
    }
    if (externalId) channel.externalId = externalId

    if (channel.type === 'telegram') {
      const token = channel.getCredential('botToken')
      if (!token) {
        return response.badRequest({ message: 'botToken is required for Telegram channels.' })
      }
      const base = env.get('WAHA_WEBHOOK_BASE_URL', env.get('APP_URL', 'http://localhost:3333'))
      try {
        await telegramClient.setWebhook(
          token,
          `${base}/webhooks/telegram/${channel.id}`,
          channel.webhookSecret!
        )
        const me = await telegramClient.getMe(token)
        channel.externalId = String((me as any)?.id ?? channel.externalId ?? '')
        channel.status = 'connected'
      } catch (error) {
        channel.status = 'failed'
        await channel.save()
        return response.badGateway({ message: (error as Error).message })
      }
    } else {
      // Meta channels: a stored, valid token = connected (webhook is app-level).
      channel.status = 'connected'
    }

    await channel.save()
    // Record the action, never the secret values.
    await AuditService.record({
      action: 'channel.configure',
      tenantId: channel.tenantId,
      actorId: auth.user!.id,
      entityType: 'channel',
      entityId: channel.id,
      metadata: { type: channel.type, credentialKeys: Object.keys(credentials) },
      ipAddress: request.ip(),
    })
    return response.ok({ status: channel.status, externalId: channel.externalId })
  }

  /** Embed snippet + widget URL for a webchat channel (linkchat). */
  async webchatEmbed({ bouncer, params, request, response }: HttpContext) {
    const channel = await Channel.findOrFail(params.id)
    await bouncer.with(ChannelPolicy).authorize('view', channel)
    if (channel.type !== 'webchat') {
      return response.badRequest({ message: 'Only webchat channels have an embed snippet.' })
    }
    const host = env.get('APP_URL', `${request.protocol()}://${request.host()}`)
    const snippet = `<script src="${host}/webchat.js" data-sf-channel="${channel.id}" data-sf-host="${host}" defer></script>`
    return response.ok({ channelId: channel.id, scriptUrl: `${host}/webchat.js`, snippet })
  }

  // --- WAHA session actions -------------------------------------------------

  async connect({ bouncer, params, response }: HttpContext) {
    const channel = await Channel.findOrFail(params.id)
    await bouncer.with(ChannelPolicy).authorize('manageSession', channel)
    if (!channel.isWaha) {
      return response.badRequest({
        message: 'Only WAHA WhatsApp channels support session connect.',
      })
    }
    await WahaSessionService.connect(channel)
    return response.ok({ status: channel.status })
  }

  async qr({ bouncer, params, response }: HttpContext) {
    const channel = await Channel.findOrFail(params.id)
    await bouncer.with(ChannelPolicy).authorize('manageSession', channel)
    if (!channel.isWaha) {
      return response.badRequest({ message: 'QR pairing is only available for WAHA channels.' })
    }
    try {
      const qr = await WahaSessionService.qr(channel)
      return response.ok({ qr })
    } catch (error) {
      return response.badGateway({ message: (error as Error).message })
    }
  }

  async status({ bouncer, params, response }: HttpContext) {
    const channel = await Channel.findOrFail(params.id)
    await bouncer.with(ChannelPolicy).authorize('view', channel)
    if (!channel.isWaha) {
      return response.ok({ status: channel.status })
    }
    try {
      // Reconcile our stored status with WAHA's live session so the UI reflects
      // reality even when the session.status webhook can't reach us.
      const session = await WahaSessionService.syncStatus(channel)
      return response.ok({ status: channel.status, session })
    } catch (error) {
      return response.badGateway({ message: (error as Error).message })
    }
  }

  async disconnect({ bouncer, params, response }: HttpContext) {
    const channel = await Channel.findOrFail(params.id)
    await bouncer.with(ChannelPolicy).authorize('manageSession', channel)
    if (channel.isWaha) {
      await WahaSessionService.disconnect(channel)
    }
    return response.ok({ status: channel.status })
  }
}
