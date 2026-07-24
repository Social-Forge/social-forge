import limiter from '@adonisjs/limiter/services/main'

/**
 * Per-IP throttle for the public auth endpoints (login, signup, password reset)
 * to blunt brute-force / credential-stuffing. Allows 8 attempts per minute per
 * client IP; on the 9th the client is blocked for 15 minutes.
 *
 * Real client IP is honoured behind the reverse proxy because `trustProxy` is
 * enabled in config/app.ts.
 */
export const authThrottle = limiter.define('auth', () =>
  limiter.allowRequests(8).every('1 minute').blockFor('15 mins')
)
