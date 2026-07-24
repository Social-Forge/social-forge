import { client } from '~/client'
import { createPinia } from 'pinia'
import Layout from '~/layouts/default.vue'
import { createInertiaApp } from '@inertiajs/vue3'
import { TuyauProvider } from '@adonisjs/inertia/vue'
import { renderToString } from '@vue/server-renderer'
import { createSSRApp, h, type DefineComponent } from 'vue'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import Vue3Toastify, { type ToastContainerOptions } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'

const appName = 'Social Forge'

export default function render(page: any) {
  return createInertiaApp({
    page,
    render: renderToString,
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) => {
      return resolvePageComponent(
        `./pages/${name}.vue`,
        import.meta.glob<DefineComponent>('./pages/**/*.vue', { eager: true }),
        Layout
      )
    },
    setup: ({ App, props, plugin }) => {
      return createSSRApp({
        render: () => h(TuyauProvider, { client }, { default: () => h(App, props) }),
      })
        .use(plugin)
        .use(createPinia())
        .use(Vue3Toastify, {
          autoClose: 3000,
          theme: 'auto',
          transition: 'slide',
          position: 'top-right',
          newestOnTop: true,
          multiple: true,
        } as ToastContainerOptions)
    },
  })
}
