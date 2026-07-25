import { Centrifuge, type Subscription } from 'centrifuge'
import { usePage } from '@inertiajs/vue3'
import { api } from '~/composables/useApi'

/**
 * Shared Centrifugo connection. The connection token authenticates the socket;
 * each private channel is authorized separately via a subscription token minted
 * by the backend only for channels the user may access.
 */
let centrifuge: Centrifuge | null = null

function ensure(): Centrifuge {
  if (centrifuge) return centrifuge
  const page = usePage<any>()
  const url = (page.props.centrifugoUrl as string) || 'ws://localhost:8000/connection/websocket'

  centrifuge = new Centrifuge(url, {
    getToken: async () => {
      const res = await api.get<{ token: string }>('/app/realtime/token')
      return res.token
    },
  })
  centrifuge.connect()
  return centrifuge
}

export function useRealtime() {
  function subscribe(channel: string, onData: (data: any) => void): Subscription {
    const client = ensure()
    let sub = client.getSubscription(channel)
    if (!sub) {
      sub = client.newSubscription(channel, {
        getToken: async () => {
          const res = await api.post<{ token: string }>('/app/realtime/subscribe', { channel })
          return res.token
        },
      })
    }
    sub.on('publication', (ctx: any) => onData(ctx.data))
    sub.subscribe()
    return sub
  }

  function unsubscribe(channel: string) {
    const sub = centrifuge?.getSubscription(channel)
    if (sub) {
      sub.unsubscribe()
      centrifuge?.removeSubscription(sub)
    }
  }

  function disconnect() {
    centrifuge?.disconnect()
    centrifuge = null
  }

  return { subscribe, unsubscribe, disconnect }
}
