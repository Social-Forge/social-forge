import { configApp } from '@adonisjs/eslint-config'
import { vue } from '@adonisjs/eslint-config/vue'

export default configApp(...vue, {
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
  },
})
