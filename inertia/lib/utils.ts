import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
function randomHex(bytes: number): string {
  const values = new Uint8Array(bytes)
  globalThis.crypto.getRandomValues(values)
  return Array.from(values, (value) => value.toString(16).padStart(2, '0')).join('')
}

export const generateLicenseKey = (): string => {
  const timestamp = Date.now().toString() // 13 Karakter
  const random = randomHex(16)

  const rawKey = `ST-${timestamp}${random}`.toUpperCase()
  // Pecah menjadi kelompok terdiri dari 4 karakter yang dipisah tanda hubung (-)
  const formattedKey = rawKey.match(/.{1,4}/g)?.join('-')

  return formattedKey || rawKey
}
