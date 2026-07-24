/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import { controllers } from '#generated/controllers'
import router from '@adonisjs/core/services/router'
import { authThrottle } from '#start/limiter'

router.on('/').renderInertia('home', {}).as('home')

router
  .group(() => {
    router.get('signup', [controllers.NewAccount, 'create'])
    router.post('signup', [controllers.NewAccount, 'store']).use(authThrottle)

    router.get('login', [controllers.Session, 'create'])
    router.post('login', [controllers.Session, 'store']).use(authThrottle)

    router.get('forgot-password', [controllers.Auth, 'forgotPassword']).as('password.forgot')
    router
      .post('forgot-password', [controllers.Auth, 'sendResetLink'])
      .as('password.email')
      .use(authThrottle)
    router.get('reset-password/:token', [controllers.Auth, 'resetPassword']).as('password.reset')
    router
      .post('reset-password', [controllers.Auth, 'updatePassword'])
      .as('password.update')
      .use(authThrottle)
  })
  .use(middleware.guest())

router
  .group(() => {
    router.post('logout', [controllers.Session, 'destroy'])
    router.get('verify-email', [controllers.Auth, 'verificationNotice']).as('email.notice')
    router.post('verify-email/resend', [controllers.Auth, 'resendVerification']).as('email.resend')
  })
  .use(middleware.auth())

router.get('verify-email/:token', [controllers.Auth, 'verifyEmail']).as('email.verify')

router
  .group(() => {
    router.get('chats', [controllers.app.Chats, 'index']).as('app.chats.index')
  })
  .prefix('app')
  .use([middleware.auth(), middleware.verified()])
