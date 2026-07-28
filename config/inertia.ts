import { defineConfig } from '@adonisjs/inertia'

const inertiaConfig = defineConfig({
  // Client-side rendering. Kept in sync with vite.config.ts (which does NOT
  // build an SSR bundle) — enabling SSR here without the vite SSR build makes
  // production boot look for a non-existent ssr/ssr.js and 500 on every page.
  ssr: {
    enabled: true,
    entrypoint: 'inertia/ssr.ts',
  },
})

export default inertiaConfig
