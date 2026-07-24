import type { Data } from '@generated/data'
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

type SharedFlash = Data.SharedProps['flash']

export const useFlashStore = defineStore('flash', () => {
  const flash = ref<SharedFlash | undefined>(undefined)
  const hasFlash = computed(() => Boolean(flash.value))

  function setFlash(value: SharedFlash | undefined) {
    flash.value = value
  }

  function clear() {
    flash.value = undefined
  }

  return {
    flash,
    hasFlash,
    setFlash,
    clear,
  }
})
