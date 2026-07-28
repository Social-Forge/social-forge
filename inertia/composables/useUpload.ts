/**
 * Multipart media upload to /app/uploads. The JSON `api` composable can't send
 * files, so this posts FormData directly with the Shield XSRF token. Returns a
 * durable MinIO `key` (persist this) plus a short-lived preview `url`.
 */
export interface UploadedMedia {
  key: string
  type: 'image' | 'video' | 'document'
  url: string | null
  name: string
  size: number
  mimeType: string
}
export interface MinioValidationResult {
  isValid: boolean
  key: string | null
  exists: boolean
  message: string
}

export interface DeleteFileResult {
  success: boolean
  message: string
  key: string
}
function xsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : ''
}

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

export async function uploadFile(file: File): Promise<UploadedMedia> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`"${file.name}" is larger than 5 MB.`)
  }
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch('/app/uploads', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'X-XSRF-TOKEN': xsrfToken(), 'Accept': 'application/json' },
    body: fd,
  })
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.message ?? `Upload failed (${res.status})`)
  }
  return res.json()
}
export const deleteFile = async (key: string) => {
  try {
    const res = await fetch(`/app/uploads/delete`, {
      method: 'DELETE',
      credentials: 'same-origin',
      headers: { 'X-XSRF-TOKEN': xsrfToken(), 'Accept': 'application/json' },
      body: JSON.stringify({ key }),
    })

    const data = await res.json().catch(() => null)

    if (!res.ok) {
      const errorMessages: Record<number, string> = {
        403: data?.message || 'You do not have permission to delete this file',
        404: data?.message || 'File not found',
        400: data?.message || 'Invalid request',
        401: 'You must be logged in to delete files',
        500: 'Server error while deleting file',
      }

      throw new Error(errorMessages[res.status] || data?.message || `Delete failed (${res.status})`)
    }
    return {
      success: true,
      message: data?.message || 'File deleted successfully',
      key: data?.key || key,
    }
  } catch (error: any) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error(error?.message || 'An unexpected error occurred while deleting')
  }
}
export const validateMinioUrl = async (url?: string) => {
  if (!url) {
    return {
      isValid: false,
      key: null,
      exists: false,
      message: 'URL parameter is required',
    }
  }

  try {
    const encodedUrl = encodeURIComponent(url)

    const res = await fetch(`/app/uploads/validate-url?url=${encodedUrl}`, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        'X-XSRF-TOKEN': xsrfToken(),
        'Accept': 'application/json',
      },
    })

    const data = await res.json().catch(() => null)

    if (!res.ok) {
      return {
        isValid: false,
        key: null,
        exists: false,
        message: data?.message || `Validation failed (${res.status})`,
      }
    }

    const result = data?.data || data || {}
    return {
      isValid: result.isValid ?? false,
      key: result.key ?? null,
      exists: result.exists ?? false,
      message: result.message || (result.isValid ? 'URL is valid' : 'URL is invalid'),
    }
  } catch (error) {
    return {
      isValid: false,
      key: null,
      exists: false,
      message: error instanceof Error ? error.message : 'Validation request failed',
    }
  }
}
export const isMinioUrl = (url: string, minioBaseUrl?: string): boolean => {
  if (!url) return false

  try {
    const urlObj = new URL(url)

    if (minioBaseUrl) {
      const baseUrl = new URL(minioBaseUrl)
      return urlObj.hostname === baseUrl.hostname
    }

    const minioPatterns = [
      /\.socialforge\./i,
      /\.minio\./i,
      /minio\./i,
      /storage\./i,
      /s3\./i,
      /console-storage\./i,
    ]

    return minioPatterns.some((pattern) => pattern.test(urlObj.hostname))
  } catch {
    return false
  }
}
export const extractKeyFromMinioUrl = (url: string, bucket: string): string | null => {
  if (!url || !bucket) return null

  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    const bucketIndex = pathParts.indexOf(bucket)

    if (bucketIndex === -1) return null

    const key = pathParts.slice(bucketIndex + 1).join('/')
    return key || null
  } catch {
    return null
  }
}
