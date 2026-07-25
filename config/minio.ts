import { Client } from 'minio'
import env from '#start/env'

/**
 * MinIO (S3-compatible) client. Endpoint is derived from MINIO_SERVER_URL so the
 * same config works for host dev (localhost:9000) and containers (minio:9000).
 */
function parseEndpoint(url: string) {
  const parsed = new URL(url)
  const useSSL = parsed.protocol === 'https:'
  return {
    endPoint: parsed.hostname,
    port: Number(parsed.port) || (useSSL ? 443 : 80),
    useSSL,
  }
}

const { endPoint, port, useSSL } = parseEndpoint(
  env.get('MINIO_SERVER_URL', 'http://localhost:9000')
)

export const minioClient = new Client({
  endPoint,
  port,
  useSSL,
  accessKey: env.get('MINIO_ACCESS_KEY'),
  secretKey: env.get('MINIO_SECRET_KEY'),
  region: env.get('MINIO_REGION', 'us-east-1'),
})

export const MINIO_BUCKET = env.get('MINIO_BUCKET', 'socialforge')
