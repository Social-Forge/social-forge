<script setup lang="ts">
import { Icon } from '@iconify/vue'
</script>

<template>
  <div class="bg-muted/30 flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
    <Icon icon="lucide:messages-square" class="text-muted-foreground/30 size-20" />
    <h2 class="text-muted-foreground text-xl font-medium">Social Forge Chat</h2>
    <p class="text-muted-foreground max-w-sm text-sm">
      Select a conversation to start messaging. Messages sync in real time across your whole team.
    </p>
  </div>
</template>
