import '@adonisjs/inertia/types'

import type { VNodeProps, AllowedComponentProps, ComponentInstance } from 'vue'

type ExtractProps<T> = Omit<
  ComponentInstance<T>['$props'],
  keyof VNodeProps | keyof AllowedComponentProps
>

declare module '@adonisjs/inertia/types' {
  export interface InertiaPages {
    'about': ExtractProps<(typeof import('../../inertia/pages/about.vue'))['default']>
    'app/ai/index': ExtractProps<(typeof import('../../inertia/pages/app/ai/index.vue'))['default']>
    'app/billing/index': ExtractProps<(typeof import('../../inertia/pages/app/billing/index.vue'))['default']>
    'app/catalog/index': ExtractProps<(typeof import('../../inertia/pages/app/catalog/index.vue'))['default']>
    'app/channels/index': ExtractProps<(typeof import('../../inertia/pages/app/channels/index.vue'))['default']>
    'app/chats/index': ExtractProps<(typeof import('../../inertia/pages/app/chats/index.vue'))['default']>
    'app/contacts/index': ExtractProps<(typeof import('../../inertia/pages/app/contacts/index.vue'))['default']>
    'app/organization/index': ExtractProps<(typeof import('../../inertia/pages/app/organization/index.vue'))['default']>
    'app/settings/index': ExtractProps<(typeof import('../../inertia/pages/app/settings/index.vue'))['default']>
    'auth/forgot-password': ExtractProps<(typeof import('../../inertia/pages/auth/forgot-password.vue'))['default']>
    'auth/login': ExtractProps<(typeof import('../../inertia/pages/auth/login.vue'))['default']>
    'auth/reset-password': ExtractProps<(typeof import('../../inertia/pages/auth/reset-password.vue'))['default']>
    'auth/signup': ExtractProps<(typeof import('../../inertia/pages/auth/signup.vue'))['default']>
    'auth/verify-email': ExtractProps<(typeof import('../../inertia/pages/auth/verify-email.vue'))['default']>
    'blog': ExtractProps<(typeof import('../../inertia/pages/blog.vue'))['default']>
    'career': ExtractProps<(typeof import('../../inertia/pages/career.vue'))['default']>
    'contact': ExtractProps<(typeof import('../../inertia/pages/contact.vue'))['default']>
    'docs': ExtractProps<(typeof import('../../inertia/pages/docs.vue'))['default']>
    'errors/not_found': ExtractProps<(typeof import('../../inertia/pages/errors/not_found.vue'))['default']>
    'errors/server_error': ExtractProps<(typeof import('../../inertia/pages/errors/server_error.vue'))['default']>
    'help': ExtractProps<(typeof import('../../inertia/pages/help.vue'))['default']>
    'home': ExtractProps<(typeof import('../../inertia/pages/home.vue'))['default']>
    'pricing': ExtractProps<(typeof import('../../inertia/pages/pricing.vue'))['default']>
    'privacy': ExtractProps<(typeof import('../../inertia/pages/privacy.vue'))['default']>
    'roadmap': ExtractProps<(typeof import('../../inertia/pages/roadmap.vue'))['default']>
    'super/index': ExtractProps<(typeof import('../../inertia/pages/super/index.vue'))['default']>
    'terms': ExtractProps<(typeof import('../../inertia/pages/terms.vue'))['default']>
    'app/analytics/index': ExtractProps<(typeof import('../../inertia/pages/app/analytics/index.vue'))['default']>
  }
}
