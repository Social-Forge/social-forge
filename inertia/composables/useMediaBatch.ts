import { deleteFile, validateMinioUrl } from './useUpload'

export interface BatchDeleteMinioResult {
  success: string[]
  failed: Array<{ key: string; error: string }>
}

export interface BatchValidationMinioResult {
  valid: Array<{ url: string; key: string }>
  invalid: Array<{ url: string; reason: string }>
}
export const deleteFiles = async (keys: string[]): Promise<BatchDeleteMinioResult> => {
  const result: BatchDeleteMinioResult = {
    success: [],
    failed: [],
  }

  const results = await Promise.allSettled(
    keys.map(async (key) => {
      await deleteFile(key)
      return key
    })
  )

  results.forEach((res, index) => {
    if (res.status === 'fulfilled') {
      result.success.push(res.value)
    } else {
      result.failed.push({
        key: keys[index],
        error: res.reason instanceof Error ? res.reason.message : 'Unknown error',
      })
    }
  })

  return result
}
export const validateMinioUrls = async (urls: string[]): Promise<BatchValidationMinioResult> => {
  const result: BatchValidationMinioResult = {
    valid: [],
    invalid: [],
  }

  const results = await Promise.allSettled(urls.map((url) => validateMinioUrl(url)))

  results.forEach((res, index) => {
    const url = urls[index]
    if (res.status === 'fulfilled') {
      if (res.value.isValid && res.value.key) {
        result.valid.push({ url, key: res.value.key })
      } else {
        result.invalid.push({ url, reason: res.value.message })
      }
    } else {
      result.invalid.push({
        url,
        reason: res.reason instanceof Error ? res.reason.message : 'Unknown error',
      })
    }
  })

  return result
}
