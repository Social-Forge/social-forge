/**
 * Minimal fetch wrapper for the app JSON API. Sends the XSRF token on
 * state-changing requests (Shield reads X-XSRF-TOKEN), keeps the session cookie,
 * and parses JSON responses.
 */
export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^|; )' + name + '=([^;]*)'))
  return match ? decodeURIComponent(match[2]) : null
}

async function request<T>(url: string, method: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (method !== 'GET') {
    headers['Content-Type'] = 'application/json'
    const xsrf = getCookie('XSRF-TOKEN')
    if (xsrf) headers['X-XSRF-TOKEN'] = xsrf
  }

  const res = await fetch(url, {
    method,
    headers,
    credentials: 'same-origin',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) {
    throw new ApiError(res.status, (data && data.message) || res.statusText)
  }
  return data as T
}

export const api = {
  get: <T = any>(url: string) => request<T>(url, 'GET'),
  post: <T = any>(url: string, body?: unknown) => request<T>(url, 'POST', body),
  put: <T = any>(url: string, body?: unknown) => request<T>(url, 'PUT', body),
  del: <T = any>(url: string) => request<T>(url, 'DELETE'),
}

export function useApi() {
  return api
}
