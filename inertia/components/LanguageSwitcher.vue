<script setup lang="ts">
import { Icon } from '@iconify/vue'

const { languageItems, currentIcon, changeLocale } = useTrans()
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="outline" size="icon" class="shadow-sm">
        <Icon :icon="currentIcon" class="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-full">
      <DropdownMenuItem
        v-for="value in languageItems"
        :key="value.locale"
        class="flex items-center gap-1 cursor-pointer"
        @click="changeLocale(value.locale)"
      >
        <Icon :icon="value.icon" class="h-4 w-4" />
        <span>{{ value.name }}</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
