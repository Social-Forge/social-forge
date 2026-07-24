import type { Data } from '@generated/data'
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

type AuthUser = Data.SharedProps['user']

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | undefined>(undefined)
  const isAuthenticated = computed(() => Boolean(user.value))

  function setUser(value: AuthUser | undefined) {
    user.value = value
  }

  function clear() {
    user.value = undefined
  }

  return {
    user,
    isAuthenticated,
    setUser,
    clear,
  }
})
