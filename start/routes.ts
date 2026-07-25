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

const HealthController = () => import('#controllers/health_controller')
router.get('/health', [HealthController, 'index']).as('health')

const DivisionsController = () => import('#controllers/app/divisions_controller')
const TeamController = () => import('#controllers/app/team_controller')
const ChannelsController = () => import('#controllers/app/channels_controller')
const RealtimeController = () => import('#controllers/app/realtime_controller')
const ConversationsController = () => import('#controllers/app/conversations_controller')
const MessagesController = () => import('#controllers/app/messages_controller')

// Provider webhooks (public — verified by per-channel secret, not middleware).
const WebhooksController = () => import('#controllers/webhooks_controller')
router.post('/webhooks/waha/:channelId', [WebhooksController, 'waha']).as('webhooks.waha')
// Meta uses one app-level webhook URL (GET verify + POST events).
router.get('/webhooks/meta', [WebhooksController, 'metaVerify']).as('webhooks.meta.verify')
router.post('/webhooks/meta', [WebhooksController, 'meta']).as('webhooks.meta')
// Telegram: one webhook URL per bot/channel.
router
  .post('/webhooks/telegram/:channelId', [WebhooksController, 'telegram'])
  .as('webhooks.telegram')

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

// OAuth (Ally). Prefixed with /oauth to match callbackUrl in config/ally.ts.
router
  .group(() => {
    router.get(':provider/redirect', [controllers.Oauth, 'redirect']).as('oauth.redirect')
    router.get(':provider/callback', [controllers.Oauth, 'callback']).as('oauth.callback')
  })
  .prefix('oauth')
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

    // Division management (Owner writes, Supervisor+ reads)
    router.get('divisions', [DivisionsController, 'index']).as('app.divisions.index')
    router.post('divisions', [DivisionsController, 'store']).as('app.divisions.store')
    router.put('divisions/:id', [DivisionsController, 'update']).as('app.divisions.update')
    router.delete('divisions/:id', [DivisionsController, 'destroy']).as('app.divisions.destroy')
    router
      .post('divisions/:id/members', [DivisionsController, 'assignMembers'])
      .as('app.divisions.members')

    // Team management: supervisors + agents (Owner only)
    router.get('team', [TeamController, 'index']).as('app.team.index')
    router.post('team', [TeamController, 'store']).as('app.team.store')
    router.put('team/:id', [TeamController, 'update']).as('app.team.update')
    router.delete('team/:id', [TeamController, 'destroy']).as('app.team.destroy')

    // Channel management (Owner writes) + WAHA session actions
    router.get('channels', [ChannelsController, 'index']).as('app.channels.index')
    router.post('channels', [ChannelsController, 'store']).as('app.channels.store')
    router.put('channels/:id', [ChannelsController, 'update']).as('app.channels.update')
    router.delete('channels/:id', [ChannelsController, 'destroy']).as('app.channels.destroy')
    router
      .put('channels/:id/configure', [ChannelsController, 'configure'])
      .as('app.channels.configure')
    router.post('channels/:id/connect', [ChannelsController, 'connect']).as('app.channels.connect')
    router.get('channels/:id/qr', [ChannelsController, 'qr']).as('app.channels.qr')
    router.get('channels/:id/status', [ChannelsController, 'status']).as('app.channels.status')
    router
      .post('channels/:id/disconnect', [ChannelsController, 'disconnect'])
      .as('app.channels.disconnect')

    // Realtime (Centrifugo) tokens
    router.get('realtime/token', [RealtimeController, 'token']).as('app.realtime.token')
    router
      .post('realtime/subscribe', [RealtimeController, 'subscribe'])
      .as('app.realtime.subscribe')

    // Conversations + messages
    router.get('conversations', [ConversationsController, 'index']).as('app.conversations.index')
    router
      .get('conversations/:id/messages', [ConversationsController, 'messages'])
      .as('app.conversations.messages')
    router
      .post('conversations/:id/messages', [MessagesController, 'store'])
      .as('app.conversations.messages.store')
    router
      .post('conversations/:id/read', [ConversationsController, 'markRead'])
      .as('app.conversations.read')
    router
      .post('conversations/:id/assign', [ConversationsController, 'assign'])
      .as('app.conversations.assign')
    router
      .post('conversations/:id/unassign', [ConversationsController, 'unassign'])
      .as('app.conversations.unassign')
    router
      .post('conversations/:id/complete', [ConversationsController, 'complete'])
      .as('app.conversations.complete')
    router
      .post('conversations/:id/reopen', [ConversationsController, 'reopen'])
      .as('app.conversations.reopen')
  })
  .prefix('app')
  .use([middleware.auth(), middleware.verified(), middleware.tenant()])
