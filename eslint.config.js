import { configApp } from '@adonisjs/eslint-config'
import { vue } from '@adonisjs/eslint-config/vue'

export default configApp(
  ...vue,
  {
    // Generated files — not hand-edited, so don't lint their boilerplate.
    ignores: ['.adonisjs/**', 'inertia/components.d.ts', 'inertia/auto-imports.d.ts'],
  },
  {
    name: 'inertia-vue ts overrides',
    files: [
      './**/*.ts',
      'inertia/**/*.ts',
      'inertia/components/**/*.vue',
      'inertia/pages/**/*.vue',
      'inertia/layouts/**/*.vue',
      'inertia/**/*./**/*.vue',
    ],
    rules: {
      'vue/component-api-style': 'off',
      '@unicorn/filename-case': 'off',
      'unicorn/filename-case': 'off',
      'vue/require-default-prop': 'off',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
      'vue/no-lone-template': 'off',
    },
  }
)
