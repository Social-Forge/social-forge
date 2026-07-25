import logger from '@adonisjs/core/services/logger'
import Channel from '#models/channel'
import TenantContext from '#services/tenant_context'
import WahaInbound from '#services/messaging/inbound/waha_inbound'
import MetaInbound from '#services/messaging/inbound/meta_inbound'
import TelegramInbound from '#services/messaging/inbound/telegram_inbound'
import type { InboundJob } from '#services/messaging/types'

/**
 * Entry point for the inbound worker. Loads the channel (unscoped — worker
 * context), then runs the provider-specific handler inside the channel's
 * tenant scope so all downstream model access is isolated.
 */
export default class InboundRouter {
  static async process(job: InboundJob): Promise<void> {
    const channel = await Channel.find(job.channelId)
    if (!channel) {
      logger.warn({ channelId: job.channelId }, 'inbound event for unknown channel — dropping')
      return
    }

    await TenantContext.run(channel.tenantId, async () => {
      switch (job.provider) {
        case 'waha':
          await WahaInbound.handle(channel, job)
          break
        case 'meta':
          await MetaInbound.handle(channel, job)
          break
        case 'telegram':
          await TelegramInbound.handle(channel, job)
          break
        default:
          logger.warn({ provider: job.provider }, 'unknown inbound provider')
      }
    })
  }
}
