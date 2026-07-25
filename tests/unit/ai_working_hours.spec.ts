import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { isWithinWorkingHours } from '#services/ai/working_hours'
import type { WorkingHours } from '#models/ai_agent'

const ALL_DAYS: WorkingHours['schedule'] = {
  mon: [['09:00', '17:00']],
  tue: [['09:00', '17:00']],
  wed: [['09:00', '17:00']],
  thu: [['09:00', '17:00']],
  fri: [['09:00', '17:00']],
  sat: [['09:00', '17:00']],
  sun: [['09:00', '17:00']],
}

function at(hour: number, minute = 0): DateTime {
  return DateTime.fromObject(
    { year: 2026, month: 7, day: 20, hour, minute },
    { zone: 'Asia/Jakarta' }
  )
}

test.group('Working hours', () => {
  test('disabled config is always open', ({ assert }) => {
    const wh: WorkingHours = {
      enabled: false,
      timezone: 'Asia/Jakarta',
      schedule: {},
      outsideAction: 'silent',
    }
    assert.isTrue(isWithinWorkingHours(wh, at(3)))
  })

  test('inside an open range → true', ({ assert }) => {
    const wh: WorkingHours = {
      enabled: true,
      timezone: 'Asia/Jakarta',
      schedule: ALL_DAYS,
      outsideAction: 'silent',
    }
    assert.isTrue(isWithinWorkingHours(wh, at(10)))
  })

  test('outside the range → false', ({ assert }) => {
    const wh: WorkingHours = {
      enabled: true,
      timezone: 'Asia/Jakarta',
      schedule: ALL_DAYS,
      outsideAction: 'silent',
    }
    assert.isFalse(isWithinWorkingHours(wh, at(20)))
  })

  test('end of range is exclusive', ({ assert }) => {
    const wh: WorkingHours = {
      enabled: true,
      timezone: 'Asia/Jakarta',
      schedule: ALL_DAYS,
      outsideAction: 'silent',
    }
    assert.isFalse(isWithinWorkingHours(wh, at(17)))
  })

  test('a day with no ranges is closed', ({ assert }) => {
    const wh: WorkingHours = {
      enabled: true,
      timezone: 'Asia/Jakarta',
      schedule: {},
      outsideAction: 'silent',
    }
    assert.isFalse(isWithinWorkingHours(wh, at(10)))
  })
})
