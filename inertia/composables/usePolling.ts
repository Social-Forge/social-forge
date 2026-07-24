import { ref, watch, onScopeDispose } from 'vue'
import { router } from '@inertiajs/vue3'
import { useIntervalFn, useDocumentVisibility } from '@vueuse/core'

/**
 * Smart polling for Inertia pages: re-fetches only the given props on an
 * interval (server-driven realtime without websockets). Pauses automatically
 * when the tab is hidden, and skips overlapping requests.
 */
export function usePolling(only: string[], options?: { interval?: number; enabled?: boolean }) {
  const enabled = ref(options?.enabled ?? true)
  const interval = options?.interval ?? 4000
  const visibility = useDocumentVisibility()
  const isFetching = ref(false)

  const { pause, resume } = useIntervalFn(
    () => {
      if (isFetching.value) return
      isFetching.value = true
      router.reload({
        only,
        onFinish: () => {
          isFetching.value = false
        },
      })
    },
    interval,
    { immediate: false }
  )

  function sync() {
    if (enabled.value && visibility.value === 'visible') resume()
    else pause()
  }

  watch([enabled, visibility], sync, { immediate: true })
  onScopeDispose(pause)

  return { enabled, isFetching }
}
