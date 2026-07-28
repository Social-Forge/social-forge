import env from '#start/env'

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

/**
 * Cloudflare Turnstile CAPTCHA verification. Feature-flagged by the presence of
 * `TURNSTILE_SECRET_KEY`: when unset, `verify()` is a no-op that returns true so
 * the app runs unchanged in dev / when CAPTCHA isn't wanted.
 */
export default class TurnstileService {
  static get enabled(): boolean {
    return Boolean(env.get('TURNSTILE_SECRET_KEY'))
  }

  static get siteKey(): string | null {
    return env.get('TURNSTILE_SITE_KEY') ?? null
  }

  /** Verify a client token against Cloudflare. Returns true when disabled. */
  static async verify(token: string | null | undefined, ip?: string): Promise<boolean> {
    const secret = env.get('TURNSTILE_SECRET_KEY')
    if (!secret) return true
    if (!token) return false

    try {
      const body = new URLSearchParams({ secret, response: token })
      if (ip) body.set('remoteip', ip)
      const res = await fetch(SITEVERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      })
      const data = (await res.json()) as { success?: boolean }
      return data.success === true
    } catch {
      return false
    }
  }
}
