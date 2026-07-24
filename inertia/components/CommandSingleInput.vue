<script lang="ts" setup>
import type { ClassValue } from 'clsx'
import { CheckIcon, ChevronsUpDownIcon } from '@lucide/vue'
import { cn } from '~/lib/utils'

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const props = defineProps<{
  value?: string
  options?: { label: string; value: string }[]
  class?: ClassValue
  placeholder?: string
  disabled?: boolean
}>()

const modelValue = useVModel(props, 'value', emit, {
  passive: true,
})
const open = ref(false)

const selectedValue = computed(() => {
  return props.options?.find((o) => o.value === modelValue.value)
})

const handleSelect = (val: string) => {
  modelValue.value = val === modelValue.value ? '' : val
  open.value = false
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        role="combobox"
        :aria-expanded="open"
        :class="cn(props.class, 'justify-between')"
        :disabled="disabled"
        @click="disabled ? null : (open = !open)"
      >
        {{ selectedValue?.label || placeholder || 'Select value...' }}
        <ChevronsUpDownIcon class="opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent :class="cn(props.class, 'p-0')">
      <Command>
        <CommandInput class="h-9" :placeholder="placeholder" />
        <CommandList>
          <CommandEmpty>No value found.</CommandEmpty>
          <CommandGroup>
            <CommandItem
              v-for="item in options"
              :key="item.value"
              :value="item.value"
              @select="
                (ev) => {
                  handleSelect(ev.detail.value as string)
                }
              "
            >
              {{ item.label }}
              <CheckIcon
                :class="cn('ml-auto', item.value === modelValue ? 'opacity-100' : 'opacity-0')"
              />
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>
