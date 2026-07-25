import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Permissive CORS for the public webchat endpoints — the widget is embedded on
 * arbitrary customer websites. No credentials are used (the visitor id travels
 * in the request body, not a cookie), so `Access-Control-Allow-Origin: *` is
 * safe here even though the global CORS policy is a strict allowlist in prod.
 */
export default class WebchatCorsMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    ctx.response.header('Access-Control-Allow-Origin', '*')
    ctx.response.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    ctx.response.header('Access-Control-Allow-Headers', 'Content-Type')
    ctx.response.header('Vary', 'Origin')

    if (ctx.request.method() === 'OPTIONS') {
      return ctx.response.noContent()
    }
    return next()
  }
}
