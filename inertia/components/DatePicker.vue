<script setup lang="ts">
import {
  DateFormatter,
  getLocalTimeZone,
  today,
  parseAbsoluteToLocal,
  type DateValue,
} from '@internationalized/date'
import { CalendarIcon } from '@lucide/vue'
import { ref, watch } from 'vue'
import { useVModel } from '@vueuse/core'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const emit = defineEmits<{
  (e: 'update:value', value: string | undefined): void
}>()

const props = defineProps<{
  value?: string
}>()

const modelValue = useVModel(props, 'value', emit, {
  passive: true,
})

const date = ref<DateValue>()

const df = new DateFormatter('id-ID', { dateStyle: 'long' })
const defaultPlaceholder = today(getLocalTimeZone())

watch(
  () => props.value,
  (newVal) => {
    if (newVal) {
      try {
        date.value = parseAbsoluteToLocal(newVal)
      } catch (e) {
        date.value = undefined
      }
    } else {
      date.value = undefined
    }
  },
  { immediate: true }
)

watch(date, (newDate) => {
  if (newDate) {
    const jsDate = newDate.toDate(getLocalTimeZone())
    modelValue.value = jsDate.toISOString()
  } else {
    modelValue.value = undefined
  }
})
</script>

<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        :class="cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground')"
      >
        <CalendarIcon class="mr-2 h-4 w-4" />
        {{ date ? df.format(date.toDate(getLocalTimeZone())) : 'Pick a date' }}
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0">
      <Calendar v-model="date" :initial-focus="true" :placeholder="defaultPlaceholder" />
    </PopoverContent>
  </Popover>
</template>
