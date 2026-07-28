import env from '#start/env'
import wahaClient from '#services/waha/waha_client'
import type Channel from '#models/channel'
import type { WahaEngine } from '#services/messaging/constants'

/**
 * Orchestrates a channel's WAHA session lifecycle (connect / QR / status /
 * disconnect) and keeps the channel row's status in sync. Used by the channel
 * controller and, later, by reconnection jobs.
 */
/** WAHA session status → our channel status. */
export const WAHA_STATUS_MAP: Record<string, string> = {
  STARTING: 'connecting',
  SCAN_QR_CODE: 'connecting',
  WORKING: 'connected',
  FAILED: 'failed',
  STOPPED: 'disconnected',
}

export default class WahaSessionService {
  private static engineOf(channel: Channel): WahaEngine {
    return (channel.wahaEngine as WahaEngine) ?? 'gows'
  }

  /** URL WAHA should POST inbound events to for this channel. */
  static webhookUrl(channel: Channel): string {
    const base = env.get('WAHA_WEBHOOK_BASE_URL', env.get('APP_URL', 'http://localhost:3333'))
    return `${base}/webhooks/waha/${channel.id}`
  }

  static async connect(channel: Channel): Promise<Channel> {
    channel.status = 'connecting'
    await channel.save()
    await wahaClient.createSession(
      this.engineOf(channel),
      channel.wahaSessionName!,
      this.webhookUrl(channel),
      channel.webhookSecret!
    )
    return channel
  }

  static async disconnect(channel: Channel): Promise<Channel> {
    const engine = this.engineOf(channel)
    // Best-effort teardown; ignore errors from an already-stopped session.
    await wahaClient.logoutSession(engine, channel.wahaSessionName!).catch(() => {})
    await wahaClient.stopSession(engine, channel.wahaSessionName!).catch(() => {})
    channel.status = 'disconnected'
    await channel.save()
    return channel
  }

  static async remove(channel: Channel): Promise<void> {
    const engine = this.engineOf(channel)
    await wahaClient.logoutSession(engine, channel.wahaSessionName!).catch(() => {})
    await wahaClient.deleteSession(engine, channel.wahaSessionName!).catch(() => {})
  }

  static status(channel: Channel) {
    return wahaClient.getSession(this.engineOf(channel), channel.wahaSessionName!)
  }

  /**
   * Fetch the live WAHA session and reconcile the channel's stored status with
   * it. Lets status polling reflect reality even if the `session.status`
   * webhook never reached us (e.g. unreachable webhook URL in local dev).
   */
  static async syncStatus(channel: Channel): Promise<unknown> {
    const session = await this.status(channel)
    const wahaStatus = (session as { status?: string } | null)?.status
    const mapped = wahaStatus ? WAHA_STATUS_MAP[wahaStatus] : undefined
    if (mapped && mapped !== channel.status) {
      channel.status = mapped
      await channel.save()
    }
    return session
  }

  static qr(channel: Channel) {
    return wahaClient.getQrImage(this.engineOf(channel), channel.wahaSessionName!)
  }
}
