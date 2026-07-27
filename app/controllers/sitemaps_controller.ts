import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'

export default class SitemapsController {
  async handle({ response }: HttpContext) {
    const baseUrl = env.get('APP_URL')

    const staticPages = [
      { url: '/', changefreq: 'daily', priority: '1.0' },
      { url: '/features', changefreq: 'weekly', priority: '0.8' },
      { url: '/pricing', changefreq: 'weekly', priority: '0.8' },
      { url: '/blog', changefreq: 'daily', priority: '0.7' },
      { url: '/terms', changefreq: 'weekly', priority: '0.7' },
      { url: '/privacy', changefreq: 'weekly', priority: '0.7' },
      { url: '/contact', changefreq: 'weekly', priority: '0.7' },
      { url: '/about', changefreq: 'weekly', priority: '0.7' },
      { url: '/docs', changefreq: 'weekly', priority: '0.7' },
      { url: '/help', changefreq: 'weekly', priority: '0.7' },
      { url: '/roadmap', changefreq: 'weekly', priority: '0.7' },
      { url: '/career', changefreq: 'weekly', priority: '0.7' },
    ]

    // const blogs = await Blog.query().select('slug', 'updated_at').orderBy('created_at', 'desc')

    let xml = `<?xml version="1.0" encoding="UTF-8"?>`
    xml += `<urlset xmlns="http://sitemaps.org">`

    for (const page of staticPages) {
      xml += `
        <url>
          <loc>${baseUrl}${page.url}</loc>
          <changefreq>${page.changefreq}</changefreq>
          <priority>${page.priority}</priority>
        </url>`
    }

    // for (const blog of blogs) {
    //   xml += `
    //     <url>
    //       <loc>${baseUrl}/blog/${blog.slug}</loc>
    //       <lastmod>${blog.updatedAt.toISODate()}</lastmod>
    //       <changefreq>monthly</changefreq>
    //       <priority>0.6</priority>
    //     </url>`
    // }

    xml += `</urlset>`

    return response
      .header('Content-Type', 'application/xml')
      .header('Cache-Control', 'public, max-age=7200') // Cache for 2 hours to save server performance
      .send(xml)
  }
}
