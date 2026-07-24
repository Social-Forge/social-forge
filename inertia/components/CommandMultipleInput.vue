<script setup lang="ts">
import type { ClassValue } from 'clsx'
import { CheckIcon, ChevronsUpDownIcon, X } from '@lucide/vue'
import { cn } from '~/lib/utils'

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
}>()

const props = defineProps<{
  value?: string[]
  options?: { label: string; value: string }[]
  class?: ClassValue
  placeholder?: string
  disabled?: boolean
}>()

const modelValue = useVModel(props, 'value', emit, {
  passive: true,
})
const open = ref(false)

const selectedOptions = computed(() => {
  if (!props.options || !modelValue.value?.length) return []
  return props.options.filter((o) => modelValue.value?.includes(o.value) ?? false)
})

const handleSelect = (selectedVal: string) => {
  const current = modelValue.value ?? []
  if (current.includes(selectedVal)) {
    modelValue.value = current.filter((v) => v !== selectedVal)
  } else {
    modelValue.value = [...current, selectedVal]
  }
}

const isSelected = (val: string) => modelValue.value?.includes(val) ?? false

const removeSelected = (val: string, event: Event) => {
  event.stopPropagation()
  modelValue.value = (modelValue.value ?? []).filter((v) => v !== val)
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        role="combobox"
        :aria-expanded="open"
        :class="
          cn(
            props.class,
            'h-auto min-h-9 justify-start flex-wrap items-center gap-1 pl-2 pr-1 py-1 text-left'
          )
        "
        :disabled="disabled"
        @click="disabled ? null : (open = !open)"
      >
        <!-- Selected chips -->
        <template v-if="selectedOptions.length > 0">
          <span
            v-for="option in selectedOptions"
            :key="option.value"
            class="inline-flex items-center gap-1 rounded-md bg-secondary pr-1 text-xs font-medium text-secondary-foreground pl-2 py-0.5"
          >
            {{ option.label }}
            <button
              type="button"
              class="ml-0.5 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              :disabled="disabled"
              @click="removeSelected(option.value, $event)"
            >
              <X class="h-3 w-3" />
              <span class="sr-only">Remove {{ option.label }}</span>
            </button>
          </span>
        </template>

        <!-- Placeholder when empty -->
        <span v-else class="text-muted-foreground text-sm truncate flex-1 text-left">
          {{ placeholder || 'Select values...' }}
        </span>

        <ChevronsUpDownIcon class="opacity-50 ml-auto shrink-0" />
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
              :class="cn(isSelected(item.value) && 'bg-accent')"
              @select="
                (ev) => {
                  handleSelect(ev.detail.value as string)
                }
              "
            >
              <CheckIcon
                :class="
                  cn('mr-2 h-4 w-4 shrink-0', isSelected(item.value) ? 'opacity-100' : 'opacity-0')
                "
              />
              {{ item.label }}
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>
