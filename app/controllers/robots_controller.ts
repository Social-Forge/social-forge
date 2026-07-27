import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'

export default class RobotsController {
  async handle({ response }: HttpContext) {
    const baseUrl = env.get('APP_URL')

    let robotsContent = `User-agent: *\n`

    robotsContent += `Disallow: /app/\n`
    robotsContent += `Disallow: /super/\n`
    robotsContent += `Disallow: /api/\n`
    robotsContent += `Disallow: /reset-password\n`
    robotsContent += `Disallow: /verify-email\n`

    robotsContent += `Allow: /\n\n`

    robotsContent += `Sitemap: ${baseUrl}/sitemap.xml\n`

    return response
      .header('Content-Type', 'text/plain')
      .header('Cache-Control', 'public, max-age=86400') // 24 hour cache because it rarely changes
      .send(robotsContent)
  }
}
