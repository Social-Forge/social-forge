/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'prometheus.metrics': {
    methods: ["GET","HEAD"]
    pattern: '/metrics'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'drive.fs.serve': {
    methods: ["GET","HEAD"]
    pattern: '/uploads/*'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { '*': ParamValue[] }
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'home': {
    methods: ["GET","HEAD"]
    pattern: '/'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'health': {
    methods: ["GET","HEAD"]
    pattern: '/health'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/health_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/health_controller').default['index']>>>
    }
  }
  'sitemap.xml': {
    methods: ["GET","HEAD"]
    pattern: '/sitemap.xml'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/sitemaps_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/sitemaps_controller').default['handle']>>>
    }
  }
  'robots.txt': {
    methods: ["GET","HEAD"]
    pattern: '/robots.txt'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/robots_controller').default['handle']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/robots_controller').default['handle']>>>
    }
  }
  'about': {
    methods: ["GET","HEAD"]
    pattern: '/about'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'contact': {
    methods: ["GET","HEAD"]
    pattern: '/contact'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'pricing': {
    methods: ["GET","HEAD"]
    pattern: '/pricing'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'privacy': {
    methods: ["GET","HEAD"]
    pattern: '/privacy'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'terms': {
    methods: ["GET","HEAD"]
    pattern: '/terms'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'help': {
    methods: ["GET","HEAD"]
    pattern: '/help'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'docs': {
    methods: ["GET","HEAD"]
    pattern: '/docs'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'career': {
    methods: ["GET","HEAD"]
    pattern: '/career'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'blog': {
    methods: ["GET","HEAD"]
    pattern: '/blog'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'roadmap': {
    methods: ["GET","HEAD"]
    pattern: '/roadmap'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'webhooks.waha': {
    methods: ["POST"]
    pattern: '/webhooks/waha/:channelId'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { channelId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/webhooks_controller').default['waha']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/webhooks_controller').default['waha']>>>
    }
  }
  'webhooks.meta.verify': {
    methods: ["GET","HEAD"]
    pattern: '/webhooks/meta'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/webhooks_controller').default['metaVerify']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/webhooks_controller').default['metaVerify']>>>
    }
  }
  'webhooks.meta': {
    methods: ["POST"]
    pattern: '/webhooks/meta'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/webhooks_controller').default['meta']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/webhooks_controller').default['meta']>>>
    }
  }
  'webhooks.telegram': {
    methods: ["POST"]
    pattern: '/webhooks/telegram/:channelId'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { channelId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/webhooks_controller').default['telegram']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/webhooks_controller').default['telegram']>>>
    }
  }
  'webhooks.xendit': {
    methods: ["POST"]
    pattern: '/webhooks/xendit'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/billing_webhooks_controller').default['xendit']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/billing_webhooks_controller').default['xendit']>>>
    }
  }
  'webchat.session': {
    methods: ["POST"]
    pattern: '/webchat/:channelId/session'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { channelId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/webchat_controller').default['session']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/webchat_controller').default['session']>>>
    }
  }
  'webchat.send': {
    methods: ["POST"]
    pattern: '/webchat/:channelId/messages'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { channelId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/webchat_controller').default['send']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/webchat_controller').default['send']>>>
    }
  }
  'webchat.poll': {
    methods: ["GET","HEAD"]
    pattern: '/webchat/:channelId/messages'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { channelId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/webchat_controller').default['poll']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/webchat_controller').default['poll']>>>
    }
  }
  'new_account.create': {
    methods: ["GET","HEAD"]
    pattern: '/signup'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['create']>>>
    }
  }
  'new_account.store': {
    methods: ["POST"]
    pattern: '/signup'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').signupValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').signupValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/new_account_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'session.create': {
    methods: ["GET","HEAD"]
    pattern: '/login'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/session_controller').default['create']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/session_controller').default['create']>>>
    }
  }
  'session.store': {
    methods: ["POST"]
    pattern: '/login'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/session_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/session_controller').default['store']>>>
    }
  }
  'password.forgot': {
    methods: ["GET","HEAD"]
    pattern: '/forgot-password'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['forgotPassword']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['forgotPassword']>>>
    }
  }
  'password.email': {
    methods: ["POST"]
    pattern: '/forgot-password'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').emailValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').emailValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['sendResetLink']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['sendResetLink']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'password.reset': {
    methods: ["GET","HEAD"]
    pattern: '/reset-password/:token'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { token: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['resetPassword']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['resetPassword']>>>
    }
  }
  'password.update': {
    methods: ["POST"]
    pattern: '/reset-password'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').resetPasswordValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').resetPasswordValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['updatePassword']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['updatePassword']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'oauth.redirect': {
    methods: ["GET","HEAD"]
    pattern: '/oauth/:provider/redirect'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { provider: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/oauth_controller').default['redirect']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/oauth_controller').default['redirect']>>>
    }
  }
  'oauth.callback': {
    methods: ["GET","HEAD"]
    pattern: '/oauth/:provider/callback'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { provider: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/oauth_controller').default['callback']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/oauth_controller').default['callback']>>>
    }
  }
  'session.destroy': {
    methods: ["POST"]
    pattern: '/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/session_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/session_controller').default['destroy']>>>
    }
  }
  'email.notice': {
    methods: ["GET","HEAD"]
    pattern: '/verify-email'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['verificationNotice']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['verificationNotice']>>>
    }
  }
  'email.resend': {
    methods: ["POST"]
    pattern: '/verify-email/resend'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['resendVerification']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['resendVerification']>>>
    }
  }
  'email.verify': {
    methods: ["GET","HEAD"]
    pattern: '/verify-email/:token'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { token: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['verifyEmail']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['verifyEmail']>>>
    }
  }
  'app.chats.index': {
    methods: ["GET","HEAD"]
    pattern: '/app/chats'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/chats_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/chats_controller').default['index']>>>
    }
  }
  'app.divisions.index': {
    methods: ["GET","HEAD"]
    pattern: '/app/divisions'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/divisions_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/divisions_controller').default['index']>>>
    }
  }
  'app.divisions.store': {
    methods: ["POST"]
    pattern: '/app/divisions'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/division').createDivisionValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/division').createDivisionValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/divisions_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/divisions_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'app.divisions.update': {
    methods: ["PUT"]
    pattern: '/app/divisions/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/division').updateDivisionValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/division').updateDivisionValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/divisions_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/divisions_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'app.divisions.destroy': {
    methods: ["DELETE"]
    pattern: '/app/divisions/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/divisions_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/divisions_controller').default['destroy']>>>
    }
  }
  'app.divisions.members': {
    methods: ["POST"]
    pattern: '/app/divisions/:id/members'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/division').assignMembersValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/division').assignMembersValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/divisions_controller').default['assignMembers']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/divisions_controller').default['assignMembers']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'app.team.index': {
    methods: ["GET","HEAD"]
    pattern: '/app/team'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/team_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/team_controller').default['index']>>>
    }
  }
  'app.team.store': {
    methods: ["POST"]
    pattern: '/app/team'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/team').createTeamMemberValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/team').createTeamMemberValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/team_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/team_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'app.team.update': {
    methods: ["PUT"]
    pattern: '/app/team/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/team').updateTeamMemberValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/team').updateTeamMemberValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/team_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/team_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'app.team.destroy': {
    methods: ["DELETE"]
    pattern: '/app/team/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/team_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/team_controller').default['destroy']>>>
    }
  }
  'app.channels.page': {
    methods: ["GET","HEAD"]
    pattern: '/app/channels'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'app.channels.index': {
    methods: ["GET","HEAD"]
    pattern: '/app/channels/list'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/channels_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/channels_controller').default['index']>>>
    }
  }
  'app.channels.store': {
    methods: ["POST"]
    pattern: '/app/channels'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/channel').createChannelValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/channel').createChannelValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/channels_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/channels_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'app.channels.update': {
    methods: ["PUT"]
    pattern: '/app/channels/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/channel').updateChannelValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/channel').updateChannelValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/channels_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/channels_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'app.channels.destroy': {
    methods: ["DELETE"]
    pattern: '/app/channels/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/channels_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/channels_controller').default['destroy']>>>
    }
  }
  'app.channels.configure': {
    methods: ["PUT"]
    pattern: '/app/channels/:id/configure'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/channel').configureChannelValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/channel').configureChannelValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/channels_controller').default['configure']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/channels_controller').default['configure']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'app.channels.connect': {
    methods: ["POST"]
    pattern: '/app/channels/:id/connect'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/channels_controller').default['connect']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/channels_controller').default['connect']>>>
    }
  }
  'app.channels.qr': {
    methods: ["GET","HEAD"]
    pattern: '/app/channels/:id/qr'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/channels_controller').default['qr']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/channels_controller').default['qr']>>>
    }
  }
  'app.channels.status': {
    methods: ["GET","HEAD"]
    pattern: '/app/channels/:id/status'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/channels_controller').default['status']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/channels_controller').default['status']>>>
    }
  }
  'app.channels.disconnect': {
    methods: ["POST"]
    pattern: '/app/channels/:id/disconnect'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/channels_controller').default['disconnect']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/channels_controller').default['disconnect']>>>
    }
  }
  'app.ai.page': {
    methods: ["GET","HEAD"]
    pattern: '/app/ai'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'app.ai.agents.index': {
    methods: ["GET","HEAD"]
    pattern: '/app/ai/agents'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/ai_agents_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/ai_agents_controller').default['index']>>>
    }
  }
  'app.ai.agents.store': {
    methods: ["POST"]
    pattern: '/app/ai/agents'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/ai_agent').createAiAgentValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/ai_agent').createAiAgentValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/ai_agents_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/ai_agents_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'app.ai.agents.show': {
    methods: ["GET","HEAD"]
    pattern: '/app/ai/agents/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/ai_agents_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/ai_agents_controller').default['show']>>>
    }
  }
  'app.ai.agents.update': {
    methods: ["PUT"]
    pattern: '/app/ai/agents/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/ai_agent').updateAiAgentValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/ai_agent').updateAiAgentValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/ai_agents_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/ai_agents_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'app.ai.agents.destroy': {
    methods: ["DELETE"]
    pattern: '/app/ai/agents/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/ai_agents_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/ai_agents_controller').default['destroy']>>>
    }
  }
  'app.ai.models': {
    methods: ["GET","HEAD"]
    pattern: '/app/ai/models'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/ai_agents_controller').default['models']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/ai_agents_controller').default['models']>>>
    }
  }
  'app.ai.credits': {
    methods: ["GET","HEAD"]
    pattern: '/app/ai/credits'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/ai_agents_controller').default['credits']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/ai_agents_controller').default['credits']>>>
    }
  }
  'app.ai.playbooks.index': {
    methods: ["GET","HEAD"]
    pattern: '/app/ai/playbooks'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/ai_playbooks_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/ai_playbooks_controller').default['index']>>>
    }
  }
  'app.ai.playbooks.store': {
    methods: ["POST"]
    pattern: '/app/ai/playbooks'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/ai_advanced').createPlaybookValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/ai_advanced').createPlaybookValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/ai_playbooks_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/ai_playbooks_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'app.ai.playbooks.update': {
    methods: ["PUT"]
    pattern: '/app/ai/playbooks/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/ai_advanced').updatePlaybookValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/ai_advanced').updatePlaybookValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/ai_playbooks_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/ai_playbooks_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'app.ai.playbooks.destroy': {
    methods: ["DELETE"]
    pattern: '/app/ai/playbooks/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/ai_playbooks_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/ai_playbooks_controller').default['destroy']>>>
    }
  }
  'app.ai.assets.index': {
    methods: ["GET","HEAD"]
    pattern: '/app/ai/assets'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/ai_assets_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/ai_assets_controller').default['index']>>>
    }
  }
  'app.ai.assets.store': {
    methods: ["POST"]
    pattern: '/app/ai/assets'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/ai_advanced').uploadAssetValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/ai_advanced').uploadAssetValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/ai_assets_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/ai_assets_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'app.ai.assets.destroy': {
    methods: ["DELETE"]
    pattern: '/app/ai/assets/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/ai_assets_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/ai_assets_controller').default['destroy']>>>
    }
  }
  'app.ai.knowledge.index': {
    methods: ["GET","HEAD"]
    pattern: '/app/ai/knowledge'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/ai_knowledge_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/ai_knowledge_controller').default['index']>>>
    }
  }
  'app.ai.knowledge.store': {
    methods: ["POST"]
    pattern: '/app/ai/knowledge'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/ai_knowledge').createKnowledgeValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/ai_knowledge').createKnowledgeValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/ai_knowledge_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/ai_knowledge_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'app.ai.knowledge.update': {
    methods: ["PUT"]
    pattern: '/app/ai/knowledge/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/ai_knowledge').updateKnowledgeValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/ai_knowledge').updateKnowledgeValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/ai_knowledge_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/ai_knowledge_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'app.ai.knowledge.destroy': {
    methods: ["DELETE"]
    pattern: '/app/ai/knowledge/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/ai_knowledge_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/ai_knowledge_controller').default['destroy']>>>
    }
  }
  'app.channels.webchat.embed': {
    methods: ["GET","HEAD"]
    pattern: '/app/channels/:id/webchat-embed'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/channels_controller').default['webchatEmbed']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/channels_controller').default['webchatEmbed']>>>
    }
  }
  'app.settings.page': {
    methods: ["GET","HEAD"]
    pattern: '/app/settings'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'app.billing.page': {
    methods: ["GET","HEAD"]
    pattern: '/app/billing'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'app.billing.plans': {
    methods: ["GET","HEAD"]
    pattern: '/app/billing/plans'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/billing_controller').default['plans']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/billing_controller').default['plans']>>>
    }
  }
  'app.billing.subscription': {
    methods: ["GET","HEAD"]
    pattern: '/app/billing/subscription'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/billing_controller').default['subscription']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/billing_controller').default['subscription']>>>
    }
  }
  'app.billing.checkout': {
    methods: ["POST"]
    pattern: '/app/billing/checkout'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/billing').checkoutValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/billing').checkoutValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/billing_controller').default['checkout']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/billing_controller').default['checkout']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'app.billing.invoices': {
    methods: ["GET","HEAD"]
    pattern: '/app/billing/invoices'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/billing_controller').default['invoices']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/billing_controller').default['invoices']>>>
    }
  }
  'app.billing.invoices.show': {
    methods: ["GET","HEAD"]
    pattern: '/app/billing/invoices/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/billing_controller').default['showInvoice']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/billing_controller').default['showInvoice']>>>
    }
  }
  'app.search': {
    methods: ["GET","HEAD"]
    pattern: '/app/search'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/search_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/search_controller').default['index']>>>
    }
  }
  'app.contacts.page': {
    methods: ["GET","HEAD"]
    pattern: '/app/contacts'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'app.catalog.page': {
    methods: ["GET","HEAD"]
    pattern: '/app/catalog'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'app.organization.page': {
    methods: ["GET","HEAD"]
    pattern: '/app/organization'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'app.contacts.index': {
    methods: ["GET","HEAD"]
    pattern: '/app/contacts/list'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/contacts_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/contacts_controller').default['index']>>>
    }
  }
  'app.contacts.export': {
    methods: ["GET","HEAD"]
    pattern: '/app/contacts/export'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/contacts_controller').default['exportCsv']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/contacts_controller').default['exportCsv']>>>
    }
  }
  'app.contacts.show': {
    methods: ["GET","HEAD"]
    pattern: '/app/contacts/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/contacts_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/contacts_controller').default['show']>>>
    }
  }
  'app.contacts.update': {
    methods: ["PUT"]
    pattern: '/app/contacts/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/contact').updateContactValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/contact').updateContactValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/contacts_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/contacts_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'app.contacts.block': {
    methods: ["POST"]
    pattern: '/app/contacts/:id/block'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/contacts_controller').default['block']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/contacts_controller').default['block']>>>
    }
  }
  'app.contacts.unblock': {
    methods: ["POST"]
    pattern: '/app/contacts/:id/unblock'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/contacts_controller').default['unblock']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/contacts_controller').default['unblock']>>>
    }
  }
  'app.contacts.destroy': {
    methods: ["DELETE"]
    pattern: '/app/contacts/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/contacts_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/contacts_controller').default['destroy']>>>
    }
  }
  'app.labels.index': {
    methods: ["GET","HEAD"]
    pattern: '/app/labels'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/labels_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/labels_controller').default['index']>>>
    }
  }
  'app.labels.store': {
    methods: ["POST"]
    pattern: '/app/labels'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/catalog').createLabelValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/catalog').createLabelValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/labels_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/labels_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'app.labels.update': {
    methods: ["PUT"]
    pattern: '/app/labels/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/catalog').updateLabelValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/catalog').updateLabelValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/labels_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/labels_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'app.labels.destroy': {
    methods: ["DELETE"]
    pattern: '/app/labels/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/labels_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/labels_controller').default['destroy']>>>
    }
  }
  'app.conversations.labels.attach': {
    methods: ["POST"]
    pattern: '/app/conversations/:conversationId/labels'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { conversationId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/labels_controller').default['attach']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/labels_controller').default['attach']>>>
    }
  }
  'app.conversations.labels.detach': {
    methods: ["DELETE"]
    pattern: '/app/conversations/:conversationId/labels/:labelId'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { conversationId: ParamValue; labelId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/labels_controller').default['detach']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/labels_controller').default['detach']>>>
    }
  }
  'app.quick-replies.index': {
    methods: ["GET","HEAD"]
    pattern: '/app/quick-replies'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/quick_replies_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/quick_replies_controller').default['index']>>>
    }
  }
  'app.quick-replies.store': {
    methods: ["POST"]
    pattern: '/app/quick-replies'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/catalog').createQuickReplyValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/catalog').createQuickReplyValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/quick_replies_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/quick_replies_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'app.quick-replies.update': {
    methods: ["PUT"]
    pattern: '/app/quick-replies/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/catalog').updateQuickReplyValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/catalog').updateQuickReplyValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/quick_replies_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/quick_replies_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'app.quick-replies.destroy': {
    methods: ["DELETE"]
    pattern: '/app/quick-replies/:id'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/quick_replies_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/quick_replies_controller').default['destroy']>>>
    }
  }
  'app.quick-replies.send': {
    methods: ["POST"]
    pattern: '/app/conversations/:id/quick-reply'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/catalog').sendQuickReplyValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/catalog').sendQuickReplyValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/quick_replies_controller').default['send']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/quick_replies_controller').default['send']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'app.uploads.store': {
    methods: ["POST"]
    pattern: '/app/uploads'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/upload').uploadValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/upload').uploadValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/uploads_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/uploads_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'app.uploads.delete': {
    methods: ["DELETE"]
    pattern: '/app/uploads/delete'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/upload').deleteUploadValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/upload').deleteUploadValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/uploads_controller').default['delete']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/uploads_controller').default['delete']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'app.uploads.validate': {
    methods: ["GET","HEAD"]
    pattern: '/app/uploads/validate-url'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/uploads_controller').default['validateMinioUrl']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/uploads_controller').default['validateMinioUrl']>>>
    }
  }
  'app.analytics.page': {
    methods: ["GET","HEAD"]
    pattern: '/app/analytics'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'app.analytics.overview': {
    methods: ["GET","HEAD"]
    pattern: '/app/analytics/overview'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/analytics_controller').default['overview']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/analytics_controller').default['overview']>>>
    }
  }
  'app.analytics.agents': {
    methods: ["GET","HEAD"]
    pattern: '/app/analytics/agents'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/analytics_controller').default['agents']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/analytics_controller').default['agents']>>>
    }
  }
  'app.analytics.ai': {
    methods: ["GET","HEAD"]
    pattern: '/app/analytics/ai'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/analytics_controller').default['ai']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/analytics_controller').default['ai']>>>
    }
  }
  'app.analytics.sla': {
    methods: ["GET","HEAD"]
    pattern: '/app/analytics/sla'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/analytics_controller').default['sla']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/analytics_controller').default['sla']>>>
    }
  }
  'app.analytics.contacts': {
    methods: ["GET","HEAD"]
    pattern: '/app/analytics/contacts'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/analytics_controller').default['contacts']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/analytics_controller').default['contacts']>>>
    }
  }
  'app.audit-logs.index': {
    methods: ["GET","HEAD"]
    pattern: '/app/audit-logs'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/audit_logs_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/audit_logs_controller').default['index']>>>
    }
  }
  'app.realtime.token': {
    methods: ["GET","HEAD"]
    pattern: '/app/realtime/token'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/realtime_controller').default['token']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/realtime_controller').default['token']>>>
    }
  }
  'app.realtime.subscribe': {
    methods: ["POST"]
    pattern: '/app/realtime/subscribe'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/realtime_controller').default['subscribe']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/realtime_controller').default['subscribe']>>>
    }
  }
  'app.conversations.index': {
    methods: ["GET","HEAD"]
    pattern: '/app/conversations'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/conversations_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/conversations_controller').default['index']>>>
    }
  }
  'app.conversations.messages': {
    methods: ["GET","HEAD"]
    pattern: '/app/conversations/:id/messages'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/conversations_controller').default['messages']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/conversations_controller').default['messages']>>>
    }
  }
  'app.conversations.messages.store': {
    methods: ["POST"]
    pattern: '/app/conversations/:id/messages'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/message').sendMessageValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/message').sendMessageValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/messages_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/messages_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'app.conversations.read': {
    methods: ["POST"]
    pattern: '/app/conversations/:id/read'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/conversations_controller').default['markRead']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/conversations_controller').default['markRead']>>>
    }
  }
  'app.conversations.assign': {
    methods: ["POST"]
    pattern: '/app/conversations/:id/assign'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/conversations_controller').default['assign']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/conversations_controller').default['assign']>>>
    }
  }
  'app.conversations.unassign': {
    methods: ["POST"]
    pattern: '/app/conversations/:id/unassign'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/conversations_controller').default['unassign']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/conversations_controller').default['unassign']>>>
    }
  }
  'app.conversations.complete': {
    methods: ["POST"]
    pattern: '/app/conversations/:id/complete'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/conversations_controller').default['complete']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/conversations_controller').default['complete']>>>
    }
  }
  'app.conversations.reopen': {
    methods: ["POST"]
    pattern: '/app/conversations/:id/reopen'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/app/conversations_controller').default['reopen']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/app/conversations_controller').default['reopen']>>>
    }
  }
  'super.page': {
    methods: ["GET","HEAD"]
    pattern: '/super'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'super.metrics': {
    methods: ["GET","HEAD"]
    pattern: '/super/metrics'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/super_admin_controller').default['metrics']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/super_admin_controller').default['metrics']>>>
    }
  }
  'super.tenants': {
    methods: ["GET","HEAD"]
    pattern: '/super/tenants'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/super_admin_controller').default['tenants']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/super_admin_controller').default['tenants']>>>
    }
  }
  'super.plans': {
    methods: ["GET","HEAD"]
    pattern: '/super/plans'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/super_admin_controller').default['plans']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/super_admin_controller').default['plans']>>>
    }
  }
  'super.tenants.update': {
    methods: ["PUT"]
    pattern: '/super/tenants/:id'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/super_admin').updateTenantValidator)>>
      paramsTuple: [ParamValue]
      params: { id: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/super_admin').updateTenantValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/super_admin_controller').default['updateTenant']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/super_admin_controller').default['updateTenant']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
}
