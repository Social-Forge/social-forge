import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import adonisjs from '@adonisjs/vite/client'
import inertia from '@adonisjs/inertia/vite'
import tailwindcss from '@tailwindcss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'

export default defineConfig({
  publicDir: 'public',
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
        { '@inertiajs/vue3': ['usePage', 'useForm', 'router'] },
      ],
      dts: 'inertia/auto-imports.d.ts',
      dirs: ['src/composables', 'src/types', 'src/stores', 'src/utils', 'src/lib'],
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
