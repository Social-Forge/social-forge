import '~/runtime-shims'
import './css/app.css'
import 'vue-sonner/style.css'
import { client } from '~/client'
import { createPinia } from 'pinia'
import Layout from '~/layouts/default.vue'
import { createInertiaApp } from '@inertiajs/vue3'
import { TuyauProvider } from '@adonisjs/inertia/vue'
import { createApp, type DefineComponent, h } from 'vue'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'
// import { router } from '@inertiajs/vue3'
import Vue3Toastify, { type ToastContainerOptions } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'

const appName = import.meta.env.VITE_APP_NAME || 'Social Forge'

createInertiaApp({
  title: (title) => (title ? `${title} - ${appName}` : appName),
  resolve: (name) => {
    return resolvePageComponent(
      `./pages/${name}.vue`,
      import.meta.glob<DefineComponent>('./pages/**/*.vue'),
      Layout
    )
  },
  setup({ el, App, props, plugin }) {
    const pinia = createPinia()
    createApp({ render: () => h(TuyauProvider, { client }, { default: () => h(App, props) }) })
      .use(plugin)
      .use(pinia)
      .use(Vue3Toastify, {
        autoClose: 3000,
        theme: 'auto',
        transition: 'slide',
        position: 'top-right',
        newestOnTop: true,
        multiple: true,
      } as ToastContainerOptions)
      .mount(el)
  },
  progress: {
    color: '#007a55',
  },
})
// router.on('navigate', (event) => {
//   if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
//     ;(window as any).gtag('config', 'G-XXXXXXXXXX', {
//       page_title: document.title,
//       page_path: event.detail.page.url,
//     })
//   }
// })
