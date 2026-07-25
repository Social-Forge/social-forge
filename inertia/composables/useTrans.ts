// useTrans.ts
import { usePage, router } from '@inertiajs/vue3'
import { computed, ref, watch } from 'vue'

interface LocalItem {
  locale: string
  name: string
  icon: string
}

export function useTrans() {
  const page = usePage()

  const languageItems = ref<LocalItem[]>([
    {
      locale: 'en',
      name: 'English',
      icon: 'flag:us-4x3',
    },
    {
      locale: 'id',
      name: 'Bahasa Indonesia',
      icon: 'flag:id-4x3',
    },
  ])

  const currentLocale = computed(() => {
    return (page.props.locale as string) || 'en'
  })

  const selectedLocale = ref<LocalItem | undefined>(
    languageItems.value.find((item) => item.locale === currentLocale.value)
  )

  watch(
    currentLocale,
    (newLocale) => {
      const found = languageItems.value.find((item) => item.locale === newLocale)
      if (found) {
        selectedLocale.value = found
      }
    },
    { immediate: true }
  )

  const currentIcon = computed(() => {
    return selectedLocale.value?.icon || 'lucide:languages'
  })

  const t = (key: string, replacements?: Record<string, string | number>) => {
    const translations = (page.props.translations as Record<string, any>) || {}

    let translation = translations[key]
    if (translation === undefined) {
      translation = translations[`messages.${key}`] || key
    }

    if (replacements) {
      Object.entries(replacements).forEach(([k, v]) => {
        translation = translation.replace(new RegExp(`{${k}}`, 'g'), String(v))
      })
    }
    return translation
  }

  const changeLocale = (locale: string) => {
    router.visit(`${window.location.pathname}?lang=${locale}`, {
      preserveState: false,
      preserveScroll: true,
    })
  }

  return {
    currentLocale,
    languageItems,
    selectedLocale,
    currentIcon,
    t,
    changeLocale,
  }
}
