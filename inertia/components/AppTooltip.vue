<script lang="ts" setup>
import type { TooltipRootEmits, TooltipRootProps } from 'reka-ui'
import {
  TooltipArrow,
  TooltipContent,
  TooltipRoot,
  TooltipTrigger,
  useForwardPropsEmits,
} from 'reka-ui'

const props = withDefaults(
  defineProps<
    TooltipRootProps & {
      content?: string
      side?: 'top' | 'right' | 'bottom' | 'left'
      align?: 'center' | 'start' | 'end'
      width?: number
      height?: number
    }
  >(),
  {
    side: 'top',
    align: 'center',
    width: 11,
    height: 5,
  }
)
const emits = defineEmits<TooltipRootEmits>()

const forward = useForwardPropsEmits(props, emits)
</script>

<template>
  <TooltipRoot v-bind="forward">
    <TooltipTrigger as-child>
      <slot />
    </TooltipTrigger>
    <TooltipContent
      :side="props.side"
      :align="props.align"
      class="bg-primary text-neutral-100 dark:text-neutral-800 rounded-md px-2 py-1"
    >
      <p class="text-xs font-medium">{{ content }}</p>
      <TooltipArrow :width="props.width" :height="props.height" />
    </TooltipContent>
  </TooltipRoot>
</template>

<style scoped>
.TooltipContent {
  transform-origin: var(--reka-tooltip-content-transform-origin);
  animation: scaleIn 0.5s ease-out;
}
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
