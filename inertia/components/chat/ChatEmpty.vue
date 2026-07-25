<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Icon } from '@iconify/vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div
    :class="
      cn(
        'bg-muted/30 flex flex-col h-svh w-full items-center justify-center px-6 text-center relative',
        props.class
      )
    "
  >
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-sm space-y-3">
      <Icon icon="lucide:messages-square" class="mx-auto size-20 text-muted-foreground/30" />
      <h2 class="text-muted-foreground text-xl font-medium">Social Forge Chat</h2>
      <p class="text-muted-foreground max-w-sm text-sm">
        Select a conversation to start messaging. Messages sync in real time across your whole team.
      </p>
    </div>
  </div>
</template>
