import { minioClient, MINIO_BUCKET } from '#config/minio'

const PRESIGN_TTL_SECONDS = 7 * 24 * 60 * 60 // 7 days (S3 max)

/** Thin helper over the MinIO client for the media pipeline. */
export default class MinioService {
  static async ensureBucket(): Promise<void> {
    const exists = await minioClient.bucketExists(MINIO_BUCKET).catch(() => false)
    if (!exists) await minioClient.makeBucket(MINIO_BUCKET)
  }

  static async putBuffer(key: string, buffer: Buffer, contentType: string): Promise<string> {
    await minioClient.putObject(MINIO_BUCKET, key, buffer, buffer.length, {
      'Content-Type': contentType,
    })
    return key
  }

  static presignedGetUrl(key: string, ttl = PRESIGN_TTL_SECONDS): Promise<string> {
    return minioClient.presignedGetObject(MINIO_BUCKET, key, ttl)
  }

  static async deleteObject(key: string): Promise<void> {
    await minioClient.removeObject(MINIO_BUCKET, key)
  }
  static async objectExists(key: string): Promise<boolean> {
    try {
      await minioClient.statObject(MINIO_BUCKET, key)
      return true
    } catch {
      return false
    }
  }
}
