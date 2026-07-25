import app from '@adonisjs/core/services/app'
import { defineConfig, formatters, loaders } from '@adonisjs/i18n'

const i18nConfig = defineConfig({
  defaultLocale: 'en',
  formatter: formatters.icu(),
  supportedLocales: ['en', 'id'],
  // fallbackLocales: {
  //   'en-US': 'en',
  //   'en-GB': 'en',
  //   'en-SG': 'en',
  //   'id-ID': 'id',
  // },
  loaders: [
    /**
     * The fs loader will read translations from the
     * "resources/lang" directory.
     *
     * Each subdirectory represents a locale. For example:
     *   - "resources/lang/en"
     *   - "resources/lang/fr"
     *   - "resources/lang/it"
     */
    loaders.fs({
      location: app.languageFilesPath(),
    }),
  ],
  fallback: (_identifier, _locale) => {
    return '' // Return empty string for all missing translations
  },
})

export default i18nConfig
