import '@adonisjs/inertia/types'

import type { VNodeProps, AllowedComponentProps, ComponentInstance } from 'vue'

type ExtractProps<T> = Omit<
  ComponentInstance<T>['$props'],
  keyof VNodeProps | keyof AllowedComponentProps
>

declare module '@adonisjs/inertia/types' {
  export interface InertiaPages {
    'app/chats/index': ExtractProps<(typeof import('../../inertia/pages/app/chats/index.vue'))['default']>
    'auth/forgot-password': ExtractProps<(typeof import('../../inertia/pages/auth/forgot-password.vue'))['default']>
    'auth/login': ExtractProps<(typeof import('../../inertia/pages/auth/login.vue'))['default']>
    'auth/reset-password': ExtractProps<(typeof import('../../inertia/pages/auth/reset-password.vue'))['default']>
    'auth/signup': ExtractProps<(typeof import('../../inertia/pages/auth/signup.vue'))['default']>
    'auth/verify-email': ExtractProps<(typeof import('../../inertia/pages/auth/verify-email.vue'))['default']>
    'errors/not_found': ExtractProps<(typeof import('../../inertia/pages/errors/not_found.vue'))['default']>
    'errors/server_error': ExtractProps<(typeof import('../../inertia/pages/errors/server_error.vue'))['default']>
    'home': ExtractProps<(typeof import('../../inertia/pages/home.vue'))['default']>
    'contact': ExtractProps<(typeof import('../../inertia/pages/contact.vue'))['default']>
    'about': ExtractProps<(typeof import('../../inertia/pages/about.vue'))['default']>
    'privacy': ExtractProps<(typeof import('../../inertia/pages/privacy.vue'))['default']>
    'terms': ExtractProps<(typeof import('../../inertia/pages/terms.vue'))['default']>
    'blog': ExtractProps<(typeof import('../../inertia/pages/blog.vue'))['default']>
    'help': ExtractProps<(typeof import('../../inertia/pages/help.vue'))['default']>
    'career': ExtractProps<(typeof import('../../inertia/pages/career.vue'))['default']>
    'roadmap': ExtractProps<(typeof import('../../inertia/pages/roadmap.vue'))['default']>
    'docs': ExtractProps<(typeof import('../../inertia/pages/docs.vue'))['default']>
  }
}
