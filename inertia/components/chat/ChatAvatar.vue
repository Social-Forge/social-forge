<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  name?: string | null
  src?: string | null
  size?: string
}>()

const initials = computed(() => {
  const n = (props.name || '').trim()
  if (!n) return '?'
  const parts = n.split(/\s+/)
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase()
})

const palette = [
  'bg-rose-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-sky-500',
  'bg-indigo-500',
  'bg-fuchsia-500',
]
const color = computed(() => {
  const key = props.name || '?'
  const sum = [...key].reduce((a, c) => a + c.charCodeAt(0), 0)
  return palette[sum % palette.length]
})
</script>

<template>
  <span
    :class="[
      'inline-flex shrink-0 items-center justify-center rounded-full font-medium text-white',
      color,
      size || 'size-10 text-sm',
    ]"
  >
    <img v-if="src" :src="src" class="size-full rounded-full object-cover" alt="" />
    <template v-else>{{ initials }}</template>
  </span>
</template>
