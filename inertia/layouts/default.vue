<script setup lang="ts">
import { watch } from 'vue'
import type { Data } from '@generated/data'

const page = usePage<Data.SharedProps>()
const auth = useAuthStore()

const user = computed(() => page.props?.user)

watch(user, (value) => auth.setUser(value), { immediate: true })
</script>

<template>
  <slot />
</template>
