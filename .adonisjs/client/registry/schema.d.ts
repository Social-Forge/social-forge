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
  'app.channels.index': {
    methods: ["GET","HEAD"]
    pattern: '/app/channels'
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
}
