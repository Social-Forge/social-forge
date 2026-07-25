import { DateTime } from 'luxon'
import type { WorkingHours } from '#models/ai_agent'

/** Luxon weekday (1=Mon … 7=Sun) → schedule key. */
const WEEKDAY_KEY = {
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri',
  6: 'sat',
  7: 'sun',
} as const

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + (m || 0)
}

/**
 * Whether `at` falls inside the agent's configured open hours. Disabled config
 * is always "open". Days with no ranges are closed. Ranges are half-open
 * [start, end) in the config's timezone.
 */
export function isWithinWorkingHours(config: WorkingHours, at: DateTime = DateTime.now()): boolean {
  if (!config.enabled) return true

  const now = at.setZone(config.timezone || 'UTC')
  const key = WEEKDAY_KEY[now.weekday as keyof typeof WEEKDAY_KEY]
  const ranges = config.schedule?.[key] ?? []
  if (!ranges.length) return false

  const minutes = now.hour * 60 + now.minute
  return ranges.some(([start, end]) => minutes >= toMinutes(start) && minutes < toMinutes(end))
}
