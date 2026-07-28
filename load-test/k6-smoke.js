// k6 smoke + light load test for Social Forge.
//
//   BASE_URL=https://app.example.com WEBCHAT_CHANNEL_ID=<uuid> \
//     k6 run --vus 50 --duration 2m load-test/k6-smoke.js
//
// Exercises the public, unauthenticated paths that see the most traffic: the
// health check and the webchat widget session/poll cycle. Extend with authed
// scenarios (login → send message) using a per-VU token as needed.
import http from 'k6/http'
import { check, sleep } from 'k6'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3333'
const CHANNEL = __ENV.WEBCHAT_CHANNEL_ID || ''

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.01'], // <1% errors
    http_req_duration: ['p(95)<500'], // 95% under 500ms
  },
  scenarios: {
    health: {
      executor: 'constant-vus',
      vus: 5,
      duration: __ENV.DURATION || '1m',
      exec: 'health',
    },
    webchat: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: Number(__ENV.VUS || 50) },
        { duration: '1m', target: Number(__ENV.VUS || 50) },
        { duration: '30s', target: 0 },
      ],
      exec: 'webchat',
    },
  },
}

export function health() {
  const res = http.get(`${BASE_URL}/health`)
  check(res, { 'health 200': (r) => r.status === 200 })
  sleep(1)
}

export function webchat() {
  if (!CHANNEL) return
  const visitorId = `k6-${__VU}-${__ITER}`

  const session = http.post(
    `${BASE_URL}/webchat/${CHANNEL}/session`,
    `visitorId=${visitorId}&name=Load+Test`,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  )
  check(session, { 'session ok': (r) => r.status === 200 })

  const poll = http.get(`${BASE_URL}/webchat/${CHANNEL}/messages?visitorId=${visitorId}`)
  check(poll, { 'poll ok': (r) => r.status === 200 })

  sleep(Math.random() * 3)
}
