import type { HttpContext } from '@adonisjs/core/http'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import AiAsset, { type AiAssetType } from '#models/ai_asset'
import AiAgent from '#models/ai_agent'
import AiAgentPolicy from '#policies/ai_agent_policy'
import MinioService from '#services/storage/minio_service'
import { uploadAssetValidator } from '#validators/ai_advanced'

const VIDEO_EXT = ['mp4', 'mov', 'webm']
const DOC_EXT = ['pdf']

function assetType(extname: string): AiAssetType {
  if (VIDEO_EXT.includes(extname)) return 'video'
  if (DOC_EXT.includes(extname)) return 'document'
  return 'image'
}

/** Media assets (product photos, testimonials, videos) an agent can send. */
export default class AiAssetsController {
  async index({ bouncer, request, response }: HttpContext) {
    await bouncer.with(AiAgentPolicy).authorize('viewAny')
    const query = AiAsset.query().orderBy('created_at', 'desc')
    if (request.input('agentId')) query.where('ai_agent_id', request.input('agentId'))
    const assets = await query

    // Attach a fresh presigned preview URL for the UI.
    const withUrls = await Promise.all(
      assets.map(async (a) => ({
        id: a.id,
        aiAgentId: a.aiAgentId,
        name: a.name,
        type: a.type,
        description: a.description,
        url: await MinioService.presignedGetUrl(a.storageKey).catch(() => null),
      }))
    )
    return response.ok(withUrls)
  }

  async store({ bouncer, request, response }: HttpContext) {
    await bouncer.with(AiAgentPolicy).authorize('create')
    const { aiAgentId, name, description, file } = await request.validateUsing(uploadAssetValidator)

    const agent = await AiAgent.find(aiAgentId)
    if (!agent) return response.badRequest({ message: 'AI agent not found.' })
    if (!file.tmpPath) return response.badRequest({ message: 'Upload failed.' })

    const ext = (file.extname ?? 'bin').toLowerCase()
    const key = `ai-assets/${agent.tenantId}/${randomUUID()}.${ext}`
    const buffer = await readFile(file.tmpPath)
    const mime =
      file.type && file.subtype ? `${file.type}/${file.subtype}` : 'application/octet-stream'

    await MinioService.ensureBucket()
    await MinioService.putBuffer(key, buffer, mime)

    const asset = await AiAsset.create({
      tenantId: agent.tenantId,
      aiAgentId: agent.id,
      name,
      type: assetType(ext),
      storageKey: key,
      mimeType: mime,
      size: file.size,
      description: description ?? null,
    })

    return response.created({
      id: asset.id,
      aiAgentId: asset.aiAgentId,
      name: asset.name,
      type: asset.type,
      description: asset.description,
      url: await MinioService.presignedGetUrl(key).catch(() => null),
    })
  }

  async destroy({ bouncer, params, response }: HttpContext) {
    await bouncer.with(AiAgentPolicy).authorize('create')
    const asset = await AiAsset.findOrFail(params.id)
    await asset.delete()
    return response.noContent()
  }
}
