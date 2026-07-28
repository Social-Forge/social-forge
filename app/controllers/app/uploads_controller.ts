import type { HttpContext } from '@adonisjs/core/http'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import MinioService from '#services/storage/minio_service'
import { mediaKindFromExt } from '#services/storage/media_helpers'
import { uploadValidator, deleteUploadValidator } from '#validators/upload'
import { MINIO_BUCKET } from '#config/minio'
/**
 * Generic authenticated media upload → MinIO. Returns a durable storage `key`
 * the caller persists (in a quick reply, channel first-reply, etc.); fresh
 * presigned URLs are minted at send time since presigned URLs expire.
 */
export default class UploadsController {
  async store({ auth, request, response }: HttpContext) {
    const tenantId = auth.user!.tenantId!
    const { file } = await request.validateUsing(uploadValidator)
    if (!file.tmpPath) return response.badRequest({ message: 'Upload failed.' })

    const ext = (file.extname ?? 'bin').toLowerCase()
    const key = `uploads/${tenantId}/${randomUUID()}.${ext}`
    const buffer = await readFile(file.tmpPath)
    const mime =
      file.type && file.subtype ? `${file.type}/${file.subtype}` : 'application/octet-stream'

    await MinioService.ensureBucket()
    await MinioService.putBuffer(key, buffer, mime)

    return response.created({
      key,
      type: mediaKindFromExt(ext),
      mimeType: mime,
      size: file.size,
      name: file.clientName,
      url: await MinioService.presignedGetUrl(key).catch(() => null),
    })
  }
  async delete({ auth, request, response }: HttpContext) {
    const tenantId = auth.user!.tenantId!

    console.log('Tenant ID:', tenantId)

    const { key } = await request.validateUsing(deleteUploadValidator)

    console.log('Key to delete:', key)

    if (!key.startsWith(`uploads/${tenantId}/`)) {
      return response.forbidden({
        message: 'You do not have permission to delete this file.',
      })
    }

    const exists = await MinioService.objectExists(key)
    if (!exists) {
      return response.notFound({
        message: 'File not found.',
      })
    }

    await MinioService.deleteObject(key)

    return response.ok({
      message: 'File deleted successfully.',
      key,
    })
  }
  async validateMinioUrl({ request, response }: HttpContext) {
    const { url } = request.qs()

    if (!url) {
      return response.badRequest({
        message: 'URL parameter is required.',
      })
    }

    try {
      const urlObj = new URL(url)
      const pathParts = urlObj.pathname.split('/')

      const bucketIndex = pathParts.indexOf(MINIO_BUCKET)
      if (bucketIndex === -1) {
        return response.badRequest({
          message: 'Invalid MinIO URL - bucket not found.',
          isValid: false,
        })
      }

      const key = pathParts.slice(bucketIndex + 1).join('/')

      if (!key) {
        return response.badRequest({
          message: 'Invalid MinIO URL - key not found.',
          isValid: false,
        })
      }

      const exists = await MinioService.objectExists(key)

      return response.ok({
        isValid: exists,
        key,
        exists,
        message: exists ? 'URL is valid.' : 'URL is valid but file no longer exists.',
      })
    } catch (error) {
      return response.badRequest({
        message: 'Invalid URL format.',
        isValid: false,
        error:
          error instanceof Error ? error.message : 'An error occurred while validate MinIO URL.',
      })
    }
  }
}
