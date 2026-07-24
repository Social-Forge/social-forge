<script setup lang="ts">
import { watch } from 'vue'
import { usePage } from '@inertiajs/vue3'
import { toast, Toaster } from 'vue-sonner'
import type { Data } from '@generated/data'
import { useAuthStore } from '~/stores/auth'
import { useFlashStore } from '~/stores/flash'

const page = usePage<Data.SharedProps>()
const auth = useAuthStore()
const flashStore = useFlashStore()

const user = computed(() => page.props?.user)
const flash = computed(() => page.props?.flash)

watch(user, (value) => auth.setUser(value), { immediate: true })
watch(flash, (value) => flashStore.setFlash(value), { immediate: true })

watch(
  () => page.url,
  () => toast.dismiss()
)

watch(
  () => flashStore.flash,
  (flashMessages) => {
    if (flashMessages?.error) {
      toast.error(flashMessages.error)
    }
    if (flashMessages?.success) {
      toast.success(flashMessages.success)
    }
  },
  { immediate: true, deep: true }
)
</script>

<template>
  <slot />
  <Toaster position="top-center" rich-colors />
</template>
