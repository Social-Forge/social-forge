<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Icon } from '@iconify/vue'
import enEmojis from 'emojibase-data/en/compact.json'
import enMessages from 'emojibase-data/en/messages.json'
import type { Locale, Emoticon, Shortcode } from 'emojibase'
import { cn } from '@/lib/utils'

interface Emoji {
  annotation?: string
  emoji?: string
  group?: number
  hexcode: string
  order?: number
  shortcodes?: string[]
  skins?: Emoji[]
  tags?: string[]
  unicode: string
  version?: number
}

interface Props {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  locale?: string // 'en', 'id', etc
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Search emoji...',
  disabled: false,
  locale: 'en',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'select', emoji: Emoji): void
}>()

const { t } = useTrans()
const isOpen = ref(false)
const supportedLocaleEmoji: string[] = []
const searchQuery = ref('')
const selectedCategory = ref('frequent')
const recentEmojis = ref<Emoji[]>([])
const isLoaded = ref(false)

const groups = enMessages.groups.map((g: any) => ({
  key: g.key,
  label: g.message,
  order: g.order,
}))

const emojiData = ref<Emoji[]>([])

const initEmojis = async () => {
  emojiData.value = enEmojis as Emoji[]
  isLoaded.value = true
}

onMounted(() => {
  initEmojis()
})

const filteredEmojis = computed(() => {
  if (!isLoaded.value) return []

  let emojis = [...emojiData.value]

  if (selectedCategory.value !== 'frequent' && selectedCategory.value !== 'search') {
    const groupIndex = groups.findIndex((g) => g.key === selectedCategory.value)
    if (groupIndex !== -1) {
      emojis = emojis.filter((e) => e.group === groupIndex)
    }
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    emojis = emojis.filter(
      (e) =>
        e.annotation?.toLowerCase().includes(query) ||
        e.tags?.some((tag) => tag.toLowerCase().includes(query)) ||
        e.shortcodes?.some((code) => code.toLowerCase().includes(query))
    )

    if (searchQuery.value) {
      selectedCategory.value = 'search'
      return emojis
    }
  }

  // Jika kategori frequent dan tidak search
  if (selectedCategory.value === 'frequent') {
    const recentHexcodes = new Set(recentEmojis.value.map((e) => e.hexcode))
    return emojiData.value.filter((e) => recentHexcodes.has(e.hexcode))
  }

  return emojis
})

const categorizedEmojis = computed(() => {
  if (!isLoaded.value) return []

  const categories: { [key: string]: Emoji[] } = {}

  groups.forEach((g) => {
    categories[g.key] = []
  })
  categories['frequent'] = []
  categories['search'] = []

  emojiData.value.forEach((emoji) => {
    if (emoji.group !== undefined && emoji.group < groups.length) {
      const groupKey = groups[emoji.group]?.key
      if (groupKey) {
        categories[groupKey]?.push(emoji)
      }
    }
  })

  return categories
})

const selectEmoji = (emoji: Emoji) => {
  const existing = recentEmojis.value.findIndex((e) => e.hexcode === emoji.hexcode)
  if (existing !== -1) {
    recentEmojis.value.splice(existing, 1)
  }
  recentEmojis.value.unshift(emoji)

  if (recentEmojis.value.length > 30) {
    recentEmojis.value = recentEmojis.value.slice(0, 30)
  }

  const emojiChar = emoji.emoji || emoji.unicode
  emit('update:modelValue', emojiChar)
  emit('select', emoji)

  isOpen.value = false
  searchQuery.value = ''
}

const getCategoryIcon = (key: string) => {
  const icons: { [key: string]: string } = {
    'frequent': 'lucide:clock',
    'smileys-emotion': 'lucide:smile',
    'people-body': 'lucide:user',
    'animals-nature': 'lucide:leaf',
    'food-drink': 'lucide:coffee',
    'travel-places': 'lucide:map-pin',
    'activities': 'lucide:activity',
    'objects': 'lucide:box',
    'symbols': 'lucide:hash',
    'flags': 'lucide:flag',
  }
  return icons[key] || 'lucide:circle'
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    isOpen.value = false
    searchQuery.value = ''
  }
}

watch(
  recentEmojis,
  (newVal) => {
    try {
      localStorage.setItem('recent-emojis', JSON.stringify(newVal.map((e) => e.hexcode)))
    } catch (e) {
      // Ignore
    }
  },
  { deep: true }
)

onMounted(() => {
  try {
    const stored = localStorage.getItem('recent-emojis')
    if (stored) {
      const hexcodes = JSON.parse(stored)
      const emojis = hexcodes
        .map((hex: string) => emojiData.value.find((e) => e.hexcode === hex))
        .filter(Boolean)
      recentEmojis.value = emojis
    }
  } catch (e) {
    // Ignore
  }
})
</script>

<template>
  <div :class="cn('p-0 w-full', props.class)">
    <div class="flex flex-col">
      <div class="p-3 border-b">
        <Input
          v-model="searchQuery"
          :placeholder="placeholder"
          class="w-full"
          @keydown.escape="isOpen = false"
        />
      </div>

      <ScrollArea class="h-75">
        <Tabs v-model="selectedCategory" class="w-full" :class="{ hidden: searchQuery }">
          <TabsList
            class="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto flex-wrap"
          >
            <TabsTrigger
              v-for="group in [{ key: 'frequent', label: 'Recent' }, ...groups]"
              :key="group.key"
              :value="group.key"
              class="rounded-none border-b-2 border-transparent px-3 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <Icon :icon="getCategoryIcon(group.key)" class="h-4 w-4" />
              <span class="sr-only">{{ group.label }}</span>
            </TabsTrigger>
          </TabsList>

          <div class="p-2">
            <div
              v-for="group in [{ key: 'frequent', label: 'Recent' }, ...groups]"
              :key="group.key"
            >
              <TabsContent :value="group.key" class="mt-0">
                <div
                  v-if="filteredEmojis.length === 0"
                  class="text-center py-8 text-muted-foreground"
                >
                  <Icon icon="lucide:inbox" class="h-8 w-8 mx-auto mb-2" />
                  <p class="text-sm">No emojis found</p>
                </div>
                <div v-else class="grid grid-cols-8 gap-1">
                  <button
                    v-for="emoji in filteredEmojis"
                    :key="emoji.hexcode"
                    class="p-1 text-xl rounded hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                    @click="selectEmoji(emoji)"
                  >
                    {{ emoji.emoji || emoji.unicode }}
                  </button>
                </div>
              </TabsContent>
            </div>
          </div>
        </Tabs>
        <div v-if="searchQuery" class="p-2">
          <div v-if="filteredEmojis.length === 0" class="text-center py-8 text-muted-foreground">
            <Icon icon="lucide:search-x" class="h-8 w-8 mx-auto mb-2" />
            <p class="text-sm">No emojis found for "{{ searchQuery }}"</p>
          </div>
          <div v-else class="grid grid-cols-8 gap-1">
            <button
              v-for="emoji in filteredEmojis"
              :key="emoji.hexcode"
              class="p-1 text-xl rounded hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              @click="selectEmoji(emoji)"
            >
              {{ emoji.emoji || emoji.unicode }}
            </button>
          </div>
        </div>
      </ScrollArea>
    </div>
  </div>
</template>
