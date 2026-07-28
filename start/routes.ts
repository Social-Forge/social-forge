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

router.get('/health', [controllers.Health, 'index']).as('health')
router.get('/sitemap.xml', [controllers.Sitemaps, 'handle']).as('sitemap.xml')
router.get('/robots.txt', [controllers.Robots, 'handle']).as('robots.txt')

// Public marketing / legal / info pages.
router.on('/about').renderInertia('about', {}).as('about')
router.on('/contact').renderInertia('contact', {}).as('contact')
router.on('/pricing').renderInertia('pricing', {}).as('pricing')
router.on('/privacy').renderInertia('privacy', {}).as('privacy')
router.on('/terms').renderInertia('terms', {}).as('terms')
router.on('/help').renderInertia('help', {}).as('help')
router.on('/docs').renderInertia('docs', {}).as('docs')
router.on('/career').renderInertia('career', {}).as('career')
router.on('/blog').renderInertia('blog', {}).as('blog')
router.on('/roadmap').renderInertia('roadmap', {}).as('roadmap')

const DivisionsController = () => import('#controllers/app/divisions_controller')
const TeamController = () => import('#controllers/app/team_controller')
const ChannelsController = () => import('#controllers/app/channels_controller')
const RealtimeController = () => import('#controllers/app/realtime_controller')
const ConversationsController = () => import('#controllers/app/conversations_controller')
const MessagesController = () => import('#controllers/app/messages_controller')
const AiAgentsController = () => import('#controllers/app/ai_agents_controller')
const AiKnowledgeController = () => import('#controllers/app/ai_knowledge_controller')
const AiPlaybooksController = () => import('#controllers/app/ai_playbooks_controller')
const AiAssetsController = () => import('#controllers/app/ai_assets_controller')
const WebchatController = () => import('#controllers/webchat_controller')
const SearchController = () => import('#controllers/app/search_controller')
const ContactsController = () => import('#controllers/app/contacts_controller')
const LabelsController = () => import('#controllers/app/labels_controller')
const QuickRepliesController = () => import('#controllers/app/quick_replies_controller')
const UploadsController = () => import('#controllers/app/uploads_controller')
const AnalyticsController = () => import('#controllers/app/analytics_controller')
const AuditLogsController = () => import('#controllers/app/audit_logs_controller')
const BillingController = () => import('#controllers/app/billing_controller')
const BillingWebhooksController = () => import('#controllers/billing_webhooks_controller')
const SuperAdminController = () => import('#controllers/super_admin_controller')

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

// Payment gateway webhook (public — verified by callback token, CSRF-exempt).
router.post('/webhooks/xendit', [BillingWebhooksController, 'xendit']).as('webhooks.xendit')

// NOTE: GET /metrics is served by @julr/adonisjs-prometheus (see config/prometheus.ts).
// Custom business counters/gauges register on prom-client's default registry in
// app/services/observability/metrics.ts and appear there automatically.

// Public webchat widget API (embedded on external sites — permissive CORS,
// CSRF-exempt, no auth; isolation via the channel's tenant).
router
  .group(() => {
    router.post('/webchat/:channelId/session', [WebchatController, 'session'])
    router.post('/webchat/:channelId/messages', [WebchatController, 'send'])
    router.get('/webchat/:channelId/messages', [WebchatController, 'poll'])
  })
  .use(middleware.webchatCors())

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

    // Channel management page (Inertia) — data via `channels/list` below.
    router.on('channels').renderInertia('app/channels/index', {}).as('app.channels.page')

    // Channel management (Owner writes) + WAHA session actions
    router.get('channels/list', [ChannelsController, 'index']).as('app.channels.index')
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

    // AI management page (Inertia)
    router.on('ai').renderInertia('app/ai/index', {}).as('app.ai.page')

    // AI agents + credits
    router.get('ai/agents', [AiAgentsController, 'index']).as('app.ai.agents.index')
    router.post('ai/agents', [AiAgentsController, 'store']).as('app.ai.agents.store')
    router.get('ai/agents/:id', [AiAgentsController, 'show']).as('app.ai.agents.show')
    router.put('ai/agents/:id', [AiAgentsController, 'update']).as('app.ai.agents.update')
    router.delete('ai/agents/:id', [AiAgentsController, 'destroy']).as('app.ai.agents.destroy')
    router.get('ai/models', [AiAgentsController, 'models']).as('app.ai.models')
    router.get('ai/credits', [AiAgentsController, 'credits']).as('app.ai.credits')

    // AI playbooks (keyword-triggered training rules)
    router.get('ai/playbooks', [AiPlaybooksController, 'index']).as('app.ai.playbooks.index')
    router.post('ai/playbooks', [AiPlaybooksController, 'store']).as('app.ai.playbooks.store')
    router.put('ai/playbooks/:id', [AiPlaybooksController, 'update']).as('app.ai.playbooks.update')
    router
      .delete('ai/playbooks/:id', [AiPlaybooksController, 'destroy'])
      .as('app.ai.playbooks.destroy')

    // AI assets (media library the agent can send)
    router.get('ai/assets', [AiAssetsController, 'index']).as('app.ai.assets.index')
    router.post('ai/assets', [AiAssetsController, 'store']).as('app.ai.assets.store')
    router.delete('ai/assets/:id', [AiAssetsController, 'destroy']).as('app.ai.assets.destroy')

    // AI knowledge base (RAG)
    router.get('ai/knowledge', [AiKnowledgeController, 'index']).as('app.ai.knowledge.index')
    router.post('ai/knowledge', [AiKnowledgeController, 'store']).as('app.ai.knowledge.store')
    router.put('ai/knowledge/:id', [AiKnowledgeController, 'update']).as('app.ai.knowledge.update')
    router
      .delete('ai/knowledge/:id', [AiKnowledgeController, 'destroy'])
      .as('app.ai.knowledge.destroy')

    // Webchat embed snippet (owner)
    router
      .get('channels/:id/webchat-embed', [ChannelsController, 'webchatEmbed'])
      .as('app.channels.webchat.embed')

    // Settings hub (Inertia)
    router.on('settings').renderInertia('app/settings/index', {}).as('app.settings.page')

    // Billing page (Inertia) + JSON API (Owner manages, Supervisor+ views)
    router.on('billing').renderInertia('app/billing/index', {}).as('app.billing.page')
    router.get('billing/plans', [BillingController, 'plans']).as('app.billing.plans')
    router
      .get('billing/subscription', [BillingController, 'subscription'])
      .as('app.billing.subscription')
    router.post('billing/checkout', [BillingController, 'checkout']).as('app.billing.checkout')
    router.get('billing/invoices', [BillingController, 'invoices']).as('app.billing.invoices')
    router
      .get('billing/invoices/:id', [BillingController, 'showInvoice'])
      .as('app.billing.invoices.show')

    // Search (Typesense)
    router.get('search', [SearchController, 'index']).as('app.search')

    // Management pages (Inertia) — JSON lists live under distinct paths.
    router.on('contacts').renderInertia('app/contacts/index', {}).as('app.contacts.page')
    router.on('catalog').renderInertia('app/catalog/index', {}).as('app.catalog.page')
    router
      .on('organization')
      .renderInertia('app/organization/index', {})
      .as('app.organization.page')

    // Contacts management
    router.get('contacts/list', [ContactsController, 'index']).as('app.contacts.index')
    router.get('contacts/export', [ContactsController, 'exportCsv']).as('app.contacts.export')
    router.get('contacts/:id', [ContactsController, 'show']).as('app.contacts.show')
    router.put('contacts/:id', [ContactsController, 'update']).as('app.contacts.update')
    router.post('contacts/:id/block', [ContactsController, 'block']).as('app.contacts.block')
    router.post('contacts/:id/unblock', [ContactsController, 'unblock']).as('app.contacts.unblock')
    router.delete('contacts/:id', [ContactsController, 'destroy']).as('app.contacts.destroy')

    // Labels
    router.get('labels', [LabelsController, 'index']).as('app.labels.index')
    router.post('labels', [LabelsController, 'store']).as('app.labels.store')
    router.put('labels/:id', [LabelsController, 'update']).as('app.labels.update')
    router.delete('labels/:id', [LabelsController, 'destroy']).as('app.labels.destroy')
    router
      .post('conversations/:conversationId/labels', [LabelsController, 'attach'])
      .as('app.conversations.labels.attach')
    router
      .delete('conversations/:conversationId/labels/:labelId', [LabelsController, 'detach'])
      .as('app.conversations.labels.detach')

    // Quick replies
    router.get('quick-replies', [QuickRepliesController, 'index']).as('app.quick-replies.index')
    router.post('quick-replies', [QuickRepliesController, 'store']).as('app.quick-replies.store')
    router
      .put('quick-replies/:id', [QuickRepliesController, 'update'])
      .as('app.quick-replies.update')
    router
      .delete('quick-replies/:id', [QuickRepliesController, 'destroy'])
      .as('app.quick-replies.destroy')
    router
      .post('conversations/:id/quick-reply', [QuickRepliesController, 'send'])
      .as('app.quick-replies.send')

    // Generic media upload (quick replies, channel first-reply, …) → MinIO
    router.post('uploads', [UploadsController, 'store']).as('app.uploads.store')
    router.delete('uploads/delete', [UploadsController, 'delete']).as('app.uploads.delete')
    router
      .get('uploads/validate-url', [UploadsController, 'validateMinioUrl'])
      .as('app.uploads.validate')

    // Analytics dashboard (Inertia page) + JSON endpoints
    router.on('analytics').renderInertia('app/analytics/index', {}).as('app.analytics.page')
    router.get('analytics/overview', [AnalyticsController, 'overview']).as('app.analytics.overview')
    router.get('analytics/agents', [AnalyticsController, 'agents']).as('app.analytics.agents')
    router.get('analytics/ai', [AnalyticsController, 'ai']).as('app.analytics.ai')
    router.get('analytics/sla', [AnalyticsController, 'sla']).as('app.analytics.sla')
    router.get('analytics/contacts', [AnalyticsController, 'contacts']).as('app.analytics.contacts')

    // Audit log (owner only)
    router.get('audit-logs', [AuditLogsController, 'index']).as('app.audit-logs.index')

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

// Super Admin platform panel (not tenant-scoped — guarded by superAdmin).
router
  .group(() => {
    router.on('super').renderInertia('super/index', {}).as('super.page')
    router.get('super/metrics', [SuperAdminController, 'metrics']).as('super.metrics')
    router.get('super/tenants', [SuperAdminController, 'tenants']).as('super.tenants')
    router.get('super/plans', [SuperAdminController, 'plans']).as('super.plans')
    router
      .put('super/tenants/:id', [SuperAdminController, 'updateTenant'])
      .as('super.tenants.update')
  })
  .use([middleware.auth(), middleware.verified(), middleware.superAdmin()])
