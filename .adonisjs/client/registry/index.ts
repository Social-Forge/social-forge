/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'prometheus.metrics': {
    methods: ["GET","HEAD"],
    pattern: '/metrics',
    tokens: [{"old":"/metrics","type":0,"val":"metrics","end":""}],
    types: placeholder as Registry['prometheus.metrics']['types'],
  },
  'home': {
    methods: ["GET","HEAD"],
    pattern: '/',
    tokens: [{"old":"/","type":0,"val":"/","end":""}],
    types: placeholder as Registry['home']['types'],
  },
  'health': {
    methods: ["GET","HEAD"],
    pattern: '/health',
    tokens: [{"old":"/health","type":0,"val":"health","end":""}],
    types: placeholder as Registry['health']['types'],
  },
  'webhooks.waha': {
    methods: ["POST"],
    pattern: '/webhooks/waha/:channelId',
    tokens: [{"old":"/webhooks/waha/:channelId","type":0,"val":"webhooks","end":""},{"old":"/webhooks/waha/:channelId","type":0,"val":"waha","end":""},{"old":"/webhooks/waha/:channelId","type":1,"val":"channelId","end":""}],
    types: placeholder as Registry['webhooks.waha']['types'],
  },
  'webhooks.meta.verify': {
    methods: ["GET","HEAD"],
    pattern: '/webhooks/meta',
    tokens: [{"old":"/webhooks/meta","type":0,"val":"webhooks","end":""},{"old":"/webhooks/meta","type":0,"val":"meta","end":""}],
    types: placeholder as Registry['webhooks.meta.verify']['types'],
  },
  'webhooks.meta': {
    methods: ["POST"],
    pattern: '/webhooks/meta',
    tokens: [{"old":"/webhooks/meta","type":0,"val":"webhooks","end":""},{"old":"/webhooks/meta","type":0,"val":"meta","end":""}],
    types: placeholder as Registry['webhooks.meta']['types'],
  },
  'webhooks.telegram': {
    methods: ["POST"],
    pattern: '/webhooks/telegram/:channelId',
    tokens: [{"old":"/webhooks/telegram/:channelId","type":0,"val":"webhooks","end":""},{"old":"/webhooks/telegram/:channelId","type":0,"val":"telegram","end":""},{"old":"/webhooks/telegram/:channelId","type":1,"val":"channelId","end":""}],
    types: placeholder as Registry['webhooks.telegram']['types'],
  },
  'new_account.create': {
    methods: ["GET","HEAD"],
    pattern: '/signup',
    tokens: [{"old":"/signup","type":0,"val":"signup","end":""}],
    types: placeholder as Registry['new_account.create']['types'],
  },
  'new_account.store': {
    methods: ["POST"],
    pattern: '/signup',
    tokens: [{"old":"/signup","type":0,"val":"signup","end":""}],
    types: placeholder as Registry['new_account.store']['types'],
  },
  'session.create': {
    methods: ["GET","HEAD"],
    pattern: '/login',
    tokens: [{"old":"/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['session.create']['types'],
  },
  'session.store': {
    methods: ["POST"],
    pattern: '/login',
    tokens: [{"old":"/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['session.store']['types'],
  },
  'password.forgot': {
    methods: ["GET","HEAD"],
    pattern: '/forgot-password',
    tokens: [{"old":"/forgot-password","type":0,"val":"forgot-password","end":""}],
    types: placeholder as Registry['password.forgot']['types'],
  },
  'password.email': {
    methods: ["POST"],
    pattern: '/forgot-password',
    tokens: [{"old":"/forgot-password","type":0,"val":"forgot-password","end":""}],
    types: placeholder as Registry['password.email']['types'],
  },
  'password.reset': {
    methods: ["GET","HEAD"],
    pattern: '/reset-password/:token',
    tokens: [{"old":"/reset-password/:token","type":0,"val":"reset-password","end":""},{"old":"/reset-password/:token","type":1,"val":"token","end":""}],
    types: placeholder as Registry['password.reset']['types'],
  },
  'password.update': {
    methods: ["POST"],
    pattern: '/reset-password',
    tokens: [{"old":"/reset-password","type":0,"val":"reset-password","end":""}],
    types: placeholder as Registry['password.update']['types'],
  },
  'oauth.redirect': {
    methods: ["GET","HEAD"],
    pattern: '/oauth/:provider/redirect',
    tokens: [{"old":"/oauth/:provider/redirect","type":0,"val":"oauth","end":""},{"old":"/oauth/:provider/redirect","type":1,"val":"provider","end":""},{"old":"/oauth/:provider/redirect","type":0,"val":"redirect","end":""}],
    types: placeholder as Registry['oauth.redirect']['types'],
  },
  'oauth.callback': {
    methods: ["GET","HEAD"],
    pattern: '/oauth/:provider/callback',
    tokens: [{"old":"/oauth/:provider/callback","type":0,"val":"oauth","end":""},{"old":"/oauth/:provider/callback","type":1,"val":"provider","end":""},{"old":"/oauth/:provider/callback","type":0,"val":"callback","end":""}],
    types: placeholder as Registry['oauth.callback']['types'],
  },
  'session.destroy': {
    methods: ["POST"],
    pattern: '/logout',
    tokens: [{"old":"/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['session.destroy']['types'],
  },
  'email.notice': {
    methods: ["GET","HEAD"],
    pattern: '/verify-email',
    tokens: [{"old":"/verify-email","type":0,"val":"verify-email","end":""}],
    types: placeholder as Registry['email.notice']['types'],
  },
  'email.resend': {
    methods: ["POST"],
    pattern: '/verify-email/resend',
    tokens: [{"old":"/verify-email/resend","type":0,"val":"verify-email","end":""},{"old":"/verify-email/resend","type":0,"val":"resend","end":""}],
    types: placeholder as Registry['email.resend']['types'],
  },
  'email.verify': {
    methods: ["GET","HEAD"],
    pattern: '/verify-email/:token',
    tokens: [{"old":"/verify-email/:token","type":0,"val":"verify-email","end":""},{"old":"/verify-email/:token","type":1,"val":"token","end":""}],
    types: placeholder as Registry['email.verify']['types'],
  },
  'app.chats.index': {
    methods: ["GET","HEAD"],
    pattern: '/app/chats',
    tokens: [{"old":"/app/chats","type":0,"val":"app","end":""},{"old":"/app/chats","type":0,"val":"chats","end":""}],
    types: placeholder as Registry['app.chats.index']['types'],
  },
  'app.divisions.index': {
    methods: ["GET","HEAD"],
    pattern: '/app/divisions',
    tokens: [{"old":"/app/divisions","type":0,"val":"app","end":""},{"old":"/app/divisions","type":0,"val":"divisions","end":""}],
    types: placeholder as Registry['app.divisions.index']['types'],
  },
  'app.divisions.store': {
    methods: ["POST"],
    pattern: '/app/divisions',
    tokens: [{"old":"/app/divisions","type":0,"val":"app","end":""},{"old":"/app/divisions","type":0,"val":"divisions","end":""}],
    types: placeholder as Registry['app.divisions.store']['types'],
  },
  'app.divisions.update': {
    methods: ["PUT"],
    pattern: '/app/divisions/:id',
    tokens: [{"old":"/app/divisions/:id","type":0,"val":"app","end":""},{"old":"/app/divisions/:id","type":0,"val":"divisions","end":""},{"old":"/app/divisions/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['app.divisions.update']['types'],
  },
  'app.divisions.destroy': {
    methods: ["DELETE"],
    pattern: '/app/divisions/:id',
    tokens: [{"old":"/app/divisions/:id","type":0,"val":"app","end":""},{"old":"/app/divisions/:id","type":0,"val":"divisions","end":""},{"old":"/app/divisions/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['app.divisions.destroy']['types'],
  },
  'app.divisions.members': {
    methods: ["POST"],
    pattern: '/app/divisions/:id/members',
    tokens: [{"old":"/app/divisions/:id/members","type":0,"val":"app","end":""},{"old":"/app/divisions/:id/members","type":0,"val":"divisions","end":""},{"old":"/app/divisions/:id/members","type":1,"val":"id","end":""},{"old":"/app/divisions/:id/members","type":0,"val":"members","end":""}],
    types: placeholder as Registry['app.divisions.members']['types'],
  },
  'app.team.index': {
    methods: ["GET","HEAD"],
    pattern: '/app/team',
    tokens: [{"old":"/app/team","type":0,"val":"app","end":""},{"old":"/app/team","type":0,"val":"team","end":""}],
    types: placeholder as Registry['app.team.index']['types'],
  },
  'app.team.store': {
    methods: ["POST"],
    pattern: '/app/team',
    tokens: [{"old":"/app/team","type":0,"val":"app","end":""},{"old":"/app/team","type":0,"val":"team","end":""}],
    types: placeholder as Registry['app.team.store']['types'],
  },
  'app.team.update': {
    methods: ["PUT"],
    pattern: '/app/team/:id',
    tokens: [{"old":"/app/team/:id","type":0,"val":"app","end":""},{"old":"/app/team/:id","type":0,"val":"team","end":""},{"old":"/app/team/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['app.team.update']['types'],
  },
  'app.team.destroy': {
    methods: ["DELETE"],
    pattern: '/app/team/:id',
    tokens: [{"old":"/app/team/:id","type":0,"val":"app","end":""},{"old":"/app/team/:id","type":0,"val":"team","end":""},{"old":"/app/team/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['app.team.destroy']['types'],
  },
  'app.channels.index': {
    methods: ["GET","HEAD"],
    pattern: '/app/channels',
    tokens: [{"old":"/app/channels","type":0,"val":"app","end":""},{"old":"/app/channels","type":0,"val":"channels","end":""}],
    types: placeholder as Registry['app.channels.index']['types'],
  },
  'app.channels.store': {
    methods: ["POST"],
    pattern: '/app/channels',
    tokens: [{"old":"/app/channels","type":0,"val":"app","end":""},{"old":"/app/channels","type":0,"val":"channels","end":""}],
    types: placeholder as Registry['app.channels.store']['types'],
  },
  'app.channels.update': {
    methods: ["PUT"],
    pattern: '/app/channels/:id',
    tokens: [{"old":"/app/channels/:id","type":0,"val":"app","end":""},{"old":"/app/channels/:id","type":0,"val":"channels","end":""},{"old":"/app/channels/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['app.channels.update']['types'],
  },
  'app.channels.destroy': {
    methods: ["DELETE"],
    pattern: '/app/channels/:id',
    tokens: [{"old":"/app/channels/:id","type":0,"val":"app","end":""},{"old":"/app/channels/:id","type":0,"val":"channels","end":""},{"old":"/app/channels/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['app.channels.destroy']['types'],
  },
  'app.channels.configure': {
    methods: ["PUT"],
    pattern: '/app/channels/:id/configure',
    tokens: [{"old":"/app/channels/:id/configure","type":0,"val":"app","end":""},{"old":"/app/channels/:id/configure","type":0,"val":"channels","end":""},{"old":"/app/channels/:id/configure","type":1,"val":"id","end":""},{"old":"/app/channels/:id/configure","type":0,"val":"configure","end":""}],
    types: placeholder as Registry['app.channels.configure']['types'],
  },
  'app.channels.connect': {
    methods: ["POST"],
    pattern: '/app/channels/:id/connect',
    tokens: [{"old":"/app/channels/:id/connect","type":0,"val":"app","end":""},{"old":"/app/channels/:id/connect","type":0,"val":"channels","end":""},{"old":"/app/channels/:id/connect","type":1,"val":"id","end":""},{"old":"/app/channels/:id/connect","type":0,"val":"connect","end":""}],
    types: placeholder as Registry['app.channels.connect']['types'],
  },
  'app.channels.qr': {
    methods: ["GET","HEAD"],
    pattern: '/app/channels/:id/qr',
    tokens: [{"old":"/app/channels/:id/qr","type":0,"val":"app","end":""},{"old":"/app/channels/:id/qr","type":0,"val":"channels","end":""},{"old":"/app/channels/:id/qr","type":1,"val":"id","end":""},{"old":"/app/channels/:id/qr","type":0,"val":"qr","end":""}],
    types: placeholder as Registry['app.channels.qr']['types'],
  },
  'app.channels.status': {
    methods: ["GET","HEAD"],
    pattern: '/app/channels/:id/status',
    tokens: [{"old":"/app/channels/:id/status","type":0,"val":"app","end":""},{"old":"/app/channels/:id/status","type":0,"val":"channels","end":""},{"old":"/app/channels/:id/status","type":1,"val":"id","end":""},{"old":"/app/channels/:id/status","type":0,"val":"status","end":""}],
    types: placeholder as Registry['app.channels.status']['types'],
  },
  'app.channels.disconnect': {
    methods: ["POST"],
    pattern: '/app/channels/:id/disconnect',
    tokens: [{"old":"/app/channels/:id/disconnect","type":0,"val":"app","end":""},{"old":"/app/channels/:id/disconnect","type":0,"val":"channels","end":""},{"old":"/app/channels/:id/disconnect","type":1,"val":"id","end":""},{"old":"/app/channels/:id/disconnect","type":0,"val":"disconnect","end":""}],
    types: placeholder as Registry['app.channels.disconnect']['types'],
  },
  'app.realtime.token': {
    methods: ["GET","HEAD"],
    pattern: '/app/realtime/token',
    tokens: [{"old":"/app/realtime/token","type":0,"val":"app","end":""},{"old":"/app/realtime/token","type":0,"val":"realtime","end":""},{"old":"/app/realtime/token","type":0,"val":"token","end":""}],
    types: placeholder as Registry['app.realtime.token']['types'],
  },
  'app.realtime.subscribe': {
    methods: ["POST"],
    pattern: '/app/realtime/subscribe',
    tokens: [{"old":"/app/realtime/subscribe","type":0,"val":"app","end":""},{"old":"/app/realtime/subscribe","type":0,"val":"realtime","end":""},{"old":"/app/realtime/subscribe","type":0,"val":"subscribe","end":""}],
    types: placeholder as Registry['app.realtime.subscribe']['types'],
  },
  'app.conversations.index': {
    methods: ["GET","HEAD"],
    pattern: '/app/conversations',
    tokens: [{"old":"/app/conversations","type":0,"val":"app","end":""},{"old":"/app/conversations","type":0,"val":"conversations","end":""}],
    types: placeholder as Registry['app.conversations.index']['types'],
  },
  'app.conversations.messages': {
    methods: ["GET","HEAD"],
    pattern: '/app/conversations/:id/messages',
    tokens: [{"old":"/app/conversations/:id/messages","type":0,"val":"app","end":""},{"old":"/app/conversations/:id/messages","type":0,"val":"conversations","end":""},{"old":"/app/conversations/:id/messages","type":1,"val":"id","end":""},{"old":"/app/conversations/:id/messages","type":0,"val":"messages","end":""}],
    types: placeholder as Registry['app.conversations.messages']['types'],
  },
  'app.conversations.messages.store': {
    methods: ["POST"],
    pattern: '/app/conversations/:id/messages',
    tokens: [{"old":"/app/conversations/:id/messages","type":0,"val":"app","end":""},{"old":"/app/conversations/:id/messages","type":0,"val":"conversations","end":""},{"old":"/app/conversations/:id/messages","type":1,"val":"id","end":""},{"old":"/app/conversations/:id/messages","type":0,"val":"messages","end":""}],
    types: placeholder as Registry['app.conversations.messages.store']['types'],
  },
  'app.conversations.read': {
    methods: ["POST"],
    pattern: '/app/conversations/:id/read',
    tokens: [{"old":"/app/conversations/:id/read","type":0,"val":"app","end":""},{"old":"/app/conversations/:id/read","type":0,"val":"conversations","end":""},{"old":"/app/conversations/:id/read","type":1,"val":"id","end":""},{"old":"/app/conversations/:id/read","type":0,"val":"read","end":""}],
    types: placeholder as Registry['app.conversations.read']['types'],
  },
  'app.conversations.assign': {
    methods: ["POST"],
    pattern: '/app/conversations/:id/assign',
    tokens: [{"old":"/app/conversations/:id/assign","type":0,"val":"app","end":""},{"old":"/app/conversations/:id/assign","type":0,"val":"conversations","end":""},{"old":"/app/conversations/:id/assign","type":1,"val":"id","end":""},{"old":"/app/conversations/:id/assign","type":0,"val":"assign","end":""}],
    types: placeholder as Registry['app.conversations.assign']['types'],
  },
  'app.conversations.unassign': {
    methods: ["POST"],
    pattern: '/app/conversations/:id/unassign',
    tokens: [{"old":"/app/conversations/:id/unassign","type":0,"val":"app","end":""},{"old":"/app/conversations/:id/unassign","type":0,"val":"conversations","end":""},{"old":"/app/conversations/:id/unassign","type":1,"val":"id","end":""},{"old":"/app/conversations/:id/unassign","type":0,"val":"unassign","end":""}],
    types: placeholder as Registry['app.conversations.unassign']['types'],
  },
  'app.conversations.complete': {
    methods: ["POST"],
    pattern: '/app/conversations/:id/complete',
    tokens: [{"old":"/app/conversations/:id/complete","type":0,"val":"app","end":""},{"old":"/app/conversations/:id/complete","type":0,"val":"conversations","end":""},{"old":"/app/conversations/:id/complete","type":1,"val":"id","end":""},{"old":"/app/conversations/:id/complete","type":0,"val":"complete","end":""}],
    types: placeholder as Registry['app.conversations.complete']['types'],
  },
  'app.conversations.reopen': {
    methods: ["POST"],
    pattern: '/app/conversations/:id/reopen',
    tokens: [{"old":"/app/conversations/:id/reopen","type":0,"val":"app","end":""},{"old":"/app/conversations/:id/reopen","type":0,"val":"conversations","end":""},{"old":"/app/conversations/:id/reopen","type":1,"val":"id","end":""},{"old":"/app/conversations/:id/reopen","type":0,"val":"reopen","end":""}],
    types: placeholder as Registry['app.conversations.reopen']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
