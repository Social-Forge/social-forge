<script setup lang="ts">
import { computed, ref } from 'vue'

interface Series {
  name: string
  color: string
}
interface Point {
  label: string
  values: number[]
}

const props = withDefaults(
  defineProps<{
    data: Point[]
    series: Series[]
    height?: number
    /** Show at most this many x-axis labels (evenly spaced). */
    maxLabels?: number
  }>(),
  { height: 200, maxLabels: 8 }
)

const hover = ref<number | null>(null)

const max = computed(() => {
  let m = 0
  for (const d of props.data) for (const v of d.values) if (v > m) m = v
  return m || 1
})

function barPct(v: number): number {
  return Math.round((v / max.value) * 100)
}

const labelStep = computed(() => Math.max(1, Math.ceil(props.data.length / props.maxLabels)))
function showLabel(i: number): boolean {
  return i % labelStep.value === 0 || i === props.data.length - 1
}

function shortLabel(label: string): string {
  // yyyy-MM-dd → MM/dd
  const m = label.match(/^\d{4}-(\d{2})-(\d{2})$/)
  return m ? `${m[1]}/${m[2]}` : label
}
</script>

<template>
  <div class="w-full">
    <div class="flex items-end gap-[2px]" :style="{ height: `${height}px` }">
      <div
        v-for="(d, i) in data"
        :key="i"
        class="group relative flex h-full flex-1 items-end justify-center"
        @mouseenter="hover = i"
        @mouseleave="hover = null"
      >
        <!-- grouped bars -->
        <div class="flex h-full w-full items-end justify-center gap-[1px]">
          <div
            v-for="(v, si) in d.values"
            :key="si"
            class="min-h-[1px] flex-1 rounded-t-[2px] transition-[height]"
            :style="{
              height: `${barPct(v)}%`,
              backgroundColor: series[si].color,
              opacity: hover === null || hover === i ? 1 : 0.45,
            }"
          />
        </div>

        <!-- tooltip -->
        <div
          v-if="hover === i"
          class="bg-popover text-popover-foreground pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-lg border px-2 py-1 text-xs shadow-md"
        >
          <div class="font-medium">{{ d.label }}</div>
          <div v-for="(v, si) in d.values" :key="si" class="flex items-center gap-1.5">
            <span class="size-2 rounded-full" :style="{ backgroundColor: series[si].color }" />
            {{ series[si].name }}: <span class="font-semibold">{{ v.toLocaleString() }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- x labels -->
    <div class="text-muted-foreground mt-1.5 flex gap-[2px] text-[10px]">
      <div v-for="(d, i) in data" :key="i" class="flex-1 text-center">
        <span v-if="showLabel(i)">{{ shortLabel(d.label) }}</span>
      </div>
    </div>

    <!-- legend -->
    <div class="mt-2 flex flex-wrap justify-center gap-3 text-xs">
      <span
        v-for="(s, si) in series"
        :key="si"
        class="text-muted-foreground flex items-center gap-1.5"
      >
        <span class="size-2.5 rounded-full" :style="{ backgroundColor: s.color }" />
        {{ s.name }}
      </span>
    </div>
  </div>
</template>
