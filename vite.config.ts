import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import adonisjs from '@adonisjs/vite/client'
import inertia from '@adonisjs/inertia/vite'
import tailwindcss from '@tailwindcss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'

// In the test environment AdonisJS forces the Vite dev server to boot, but our
// unit/functional tests never render Inertia pages. Vite's background dependency
// pre-bundling then races the fast test teardown and logs a noisy (harmless)
// "server is being restarted or closed" error. Disabling dependency discovery
// under NODE_ENV=test removes the race; browser tests still optimize on demand.
const isTest = process.env.NODE_ENV === 'test'

export default defineConfig({
  publicDir: 'public',
  optimizeDeps: isTest ? { noDiscovery: true, include: [] } : {},
  plugins: [
    AutoImport({
      include: [/\.[tj]sx?$/, /\.vue$/, /\.vue\?vue/, /\.ts$/],
      imports: [
        'vue',
        'pinia',
        '@vueuse/core',
        '@vueuse/head',
        'vue-router',
        'vue-i18n',
        '@vueuse/math',
        {
          '@inertiajs/vue3': [
            'usePage',
            'Head',
            'Deferred',
            'useForm',
            'router',
            'InfiniteScroll',
            'useHttp',
            'usePoll',
            'usePrefetch',
            'useRemember',
            'WhenVisible',
          ],
        },
      ],
      dts: 'inertia/auto-imports.d.ts',
      dirs: [
        'inertia/composables',
        'inertia/types',
        'inertia/stores',
        'inertia/utils',
        'inertia/lib',
      ],
      vueTemplate: true,
    }),
    Components({
      dirs: ['inertia/components', 'inertia/layouts'],
      dts: 'inertia/components.d.ts',
      include: [/\.vue$/, /\.vue\?vue/, /\.vue\.[tj]sx?\?vue/],
    }),
    vue({
      template: {
        transformAssetUrls: {
          base: null,
          includeAbsolute: false,
        },
      },
    }),
    tailwindcss(),
    inertia({ ssr: { enabled: false, entrypoint: 'inertia/ssr.ts' } }),
    adonisjs({
      entrypoints: ['inertia/app.ts', 'inertia/css/app.css'],
      reload: ['resources/views/**/*.edge', 'inertia/pages/**/*.vue'],
    }),
  ],
  resolve: {
    alias: [
      {
        find: /^@iconify\/vue$/,
        replacement: fileURLToPath(new URL('./inertia/lib/iconify-offline.ts', import.meta.url)),
      },
      {
        find: '~/',
        replacement: `${import.meta.dirname}/inertia/`,
      },
      {
        find: '@generated',
        replacement: `${import.meta.dirname}/.adonisjs/client/`,
      },
      {
        find: '@/',
        replacement: `${new URL('./inertia/', import.meta.url).pathname}`,
      },
    ],
  },
  server: {
    watch: {
      ignored: ['**/storage/**', '**/tmp/**'],
    },
  },
})
