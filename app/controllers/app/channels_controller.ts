import type { HttpContext } from '@adonisjs/core/http'
import { randomUUID } from 'node:crypto'
import string from '@adonisjs/core/helpers/string'
import Channel from '#models/channel'
import Tenant from '#models/tenant'
import ChannelPolicy from '#policies/channel_policy'
import EntitlementService, { ChannelLimitReachedException } from '#services/entitlement_service'
import WahaSessionService from '#services/waha/waha_session_service'
import { createChannelValidator, updateChannelValidator } from '#validators/channel'

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
    const channel = await Channel.create({
      tenantId: tenant.id,
      divisionId: payload.divisionId ?? null,
      type: payload.type,
      name: payload.name,
      status: 'disconnected',
      wahaEngine: isWaha ? (payload.wahaEngine ?? 'gows') : null,
      wahaSessionName: isWaha ? `sf${randomUUID().replace(/-/g, '')}` : null,
      webhookSecret: string.random(32),
    })

    return response.created(channel)
  }

  async update({ bouncer, params, request, response }: HttpContext) {
    const channel = await Channel.findOrFail(params.id)
    await bouncer.with(ChannelPolicy).authorize('update', channel)
    const payload = await request.validateUsing(updateChannelValidator)
    if (payload.name !== undefined) channel.name = payload.name
    if (payload.divisionId !== undefined) channel.divisionId = payload.divisionId
    await channel.save()
    return response.ok(channel)
  }

  async destroy({ bouncer, params, response }: HttpContext) {
    const channel = await Channel.findOrFail(params.id)
    await bouncer.with(ChannelPolicy).authorize('delete', channel)
    if (channel.isWaha && channel.wahaSessionName) {
      await WahaSessionService.remove(channel)
    }
    await channel.delete()
    return response.noContent()
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
      const session = await WahaSessionService.status(channel)
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
