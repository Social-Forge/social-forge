<script setup lang="ts">
import { Icon } from '@iconify/vue'

const mode = useColorMode({
  initialValue: 'dark',
})

const handleThemeChange = () => {
  mode.value = mode.value === 'light' ? 'dark' : 'light'
}
</script>

<template>
  <Button variant="outline" class="shadow-sm" @click="handleThemeChange">
    <Icon
      v-if="mode === 'light'"
      icon="radix-icons:moon"
      class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-sky-600"
    />
    <Icon
      v-else
      icon="radix-icons:sun"
      class="h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-yellow-500"
    />
    <span class="sr-only">Toggle theme</span>
  </Button>
</template>
