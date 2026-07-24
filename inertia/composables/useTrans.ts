import { usePage, router } from '@inertiajs/vue3'
import { computed } from 'vue'

export function useTrans() {
  const page = usePage()

  const currentLocale = computed(() => {
    // page.props.locale can be accessed from the shared props
    return (page.props.locale as string) || 'en'
  })

  const t = (key: string, replacements?: Record<string, string | number>) => {
    const translations = (page.props.translations as Record<string, string>) || {}
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
    // Trigger locale change by hitting the current URL with the lang query param
    router.visit(`${window.location.pathname}?lang=${locale}`, {
      preserveState: false,
      preserveScroll: true,
    })
  }

  return {
    t,
    currentLocale,
    changeLocale,
  }
}
