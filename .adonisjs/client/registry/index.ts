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
  'drive.fs.serve': {
    methods: ["GET","HEAD"],
    pattern: '/uploads/*',
    tokens: [{"old":"/uploads/*","type":0,"val":"uploads","end":""},{"old":"/uploads/*","type":2,"val":"*","end":""}],
    types: placeholder as Registry['drive.fs.serve']['types'],
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
  'sitemap.xml': {
    methods: ["GET","HEAD"],
    pattern: '/sitemap.xml',
    tokens: [{"old":"/sitemap.xml","type":0,"val":"sitemap.xml","end":""}],
    types: placeholder as Registry['sitemap.xml']['types'],
  },
  'robots.txt': {
    methods: ["GET","HEAD"],
    pattern: '/robots.txt',
    tokens: [{"old":"/robots.txt","type":0,"val":"robots.txt","end":""}],
    types: placeholder as Registry['robots.txt']['types'],
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
  'webchat.session': {
    methods: ["POST"],
    pattern: '/webchat/:channelId/session',
    tokens: [{"old":"/webchat/:channelId/session","type":0,"val":"webchat","end":""},{"old":"/webchat/:channelId/session","type":1,"val":"channelId","end":""},{"old":"/webchat/:channelId/session","type":0,"val":"session","end":""}],
    types: placeholder as Registry['webchat.session']['types'],
  },
  'webchat.send': {
    methods: ["POST"],
    pattern: '/webchat/:channelId/messages',
    tokens: [{"old":"/webchat/:channelId/messages","type":0,"val":"webchat","end":""},{"old":"/webchat/:channelId/messages","type":1,"val":"channelId","end":""},{"old":"/webchat/:channelId/messages","type":0,"val":"messages","end":""}],
    types: placeholder as Registry['webchat.send']['types'],
  },
  'webchat.poll': {
    methods: ["GET","HEAD"],
    pattern: '/webchat/:channelId/messages',
    tokens: [{"old":"/webchat/:channelId/messages","type":0,"val":"webchat","end":""},{"old":"/webchat/:channelId/messages","type":1,"val":"channelId","end":""},{"old":"/webchat/:channelId/messages","type":0,"val":"messages","end":""}],
    types: placeholder as Registry['webchat.poll']['types'],
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
  'app.ai.agents.index': {
    methods: ["GET","HEAD"],
    pattern: '/app/ai/agents',
    tokens: [{"old":"/app/ai/agents","type":0,"val":"app","end":""},{"old":"/app/ai/agents","type":0,"val":"ai","end":""},{"old":"/app/ai/agents","type":0,"val":"agents","end":""}],
    types: placeholder as Registry['app.ai.agents.index']['types'],
  },
  'app.ai.agents.store': {
    methods: ["POST"],
    pattern: '/app/ai/agents',
    tokens: [{"old":"/app/ai/agents","type":0,"val":"app","end":""},{"old":"/app/ai/agents","type":0,"val":"ai","end":""},{"old":"/app/ai/agents","type":0,"val":"agents","end":""}],
    types: placeholder as Registry['app.ai.agents.store']['types'],
  },
  'app.ai.agents.show': {
    methods: ["GET","HEAD"],
    pattern: '/app/ai/agents/:id',
    tokens: [{"old":"/app/ai/agents/:id","type":0,"val":"app","end":""},{"old":"/app/ai/agents/:id","type":0,"val":"ai","end":""},{"old":"/app/ai/agents/:id","type":0,"val":"agents","end":""},{"old":"/app/ai/agents/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['app.ai.agents.show']['types'],
  },
  'app.ai.agents.update': {
    methods: ["PUT"],
    pattern: '/app/ai/agents/:id',
    tokens: [{"old":"/app/ai/agents/:id","type":0,"val":"app","end":""},{"old":"/app/ai/agents/:id","type":0,"val":"ai","end":""},{"old":"/app/ai/agents/:id","type":0,"val":"agents","end":""},{"old":"/app/ai/agents/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['app.ai.agents.update']['types'],
  },
  'app.ai.agents.destroy': {
    methods: ["DELETE"],
    pattern: '/app/ai/agents/:id',
    tokens: [{"old":"/app/ai/agents/:id","type":0,"val":"app","end":""},{"old":"/app/ai/agents/:id","type":0,"val":"ai","end":""},{"old":"/app/ai/agents/:id","type":0,"val":"agents","end":""},{"old":"/app/ai/agents/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['app.ai.agents.destroy']['types'],
  },
  'app.ai.models': {
    methods: ["GET","HEAD"],
    pattern: '/app/ai/models',
    tokens: [{"old":"/app/ai/models","type":0,"val":"app","end":""},{"old":"/app/ai/models","type":0,"val":"ai","end":""},{"old":"/app/ai/models","type":0,"val":"models","end":""}],
    types: placeholder as Registry['app.ai.models']['types'],
  },
  'app.ai.credits': {
    methods: ["GET","HEAD"],
    pattern: '/app/ai/credits',
    tokens: [{"old":"/app/ai/credits","type":0,"val":"app","end":""},{"old":"/app/ai/credits","type":0,"val":"ai","end":""},{"old":"/app/ai/credits","type":0,"val":"credits","end":""}],
    types: placeholder as Registry['app.ai.credits']['types'],
  },
  'app.ai.knowledge.index': {
    methods: ["GET","HEAD"],
    pattern: '/app/ai/knowledge',
    tokens: [{"old":"/app/ai/knowledge","type":0,"val":"app","end":""},{"old":"/app/ai/knowledge","type":0,"val":"ai","end":""},{"old":"/app/ai/knowledge","type":0,"val":"knowledge","end":""}],
    types: placeholder as Registry['app.ai.knowledge.index']['types'],
  },
  'app.ai.knowledge.store': {
    methods: ["POST"],
    pattern: '/app/ai/knowledge',
    tokens: [{"old":"/app/ai/knowledge","type":0,"val":"app","end":""},{"old":"/app/ai/knowledge","type":0,"val":"ai","end":""},{"old":"/app/ai/knowledge","type":0,"val":"knowledge","end":""}],
    types: placeholder as Registry['app.ai.knowledge.store']['types'],
  },
  'app.ai.knowledge.update': {
    methods: ["PUT"],
    pattern: '/app/ai/knowledge/:id',
    tokens: [{"old":"/app/ai/knowledge/:id","type":0,"val":"app","end":""},{"old":"/app/ai/knowledge/:id","type":0,"val":"ai","end":""},{"old":"/app/ai/knowledge/:id","type":0,"val":"knowledge","end":""},{"old":"/app/ai/knowledge/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['app.ai.knowledge.update']['types'],
  },
  'app.ai.knowledge.destroy': {
    methods: ["DELETE"],
    pattern: '/app/ai/knowledge/:id',
    tokens: [{"old":"/app/ai/knowledge/:id","type":0,"val":"app","end":""},{"old":"/app/ai/knowledge/:id","type":0,"val":"ai","end":""},{"old":"/app/ai/knowledge/:id","type":0,"val":"knowledge","end":""},{"old":"/app/ai/knowledge/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['app.ai.knowledge.destroy']['types'],
  },
  'app.channels.webchat.embed': {
    methods: ["GET","HEAD"],
    pattern: '/app/channels/:id/webchat-embed',
    tokens: [{"old":"/app/channels/:id/webchat-embed","type":0,"val":"app","end":""},{"old":"/app/channels/:id/webchat-embed","type":0,"val":"channels","end":""},{"old":"/app/channels/:id/webchat-embed","type":1,"val":"id","end":""},{"old":"/app/channels/:id/webchat-embed","type":0,"val":"webchat-embed","end":""}],
    types: placeholder as Registry['app.channels.webchat.embed']['types'],
  },
  'app.search': {
    methods: ["GET","HEAD"],
    pattern: '/app/search',
    tokens: [{"old":"/app/search","type":0,"val":"app","end":""},{"old":"/app/search","type":0,"val":"search","end":""}],
    types: placeholder as Registry['app.search']['types'],
  },
  'app.contacts.index': {
    methods: ["GET","HEAD"],
    pattern: '/app/contacts',
    tokens: [{"old":"/app/contacts","type":0,"val":"app","end":""},{"old":"/app/contacts","type":0,"val":"contacts","end":""}],
    types: placeholder as Registry['app.contacts.index']['types'],
  },
  'app.contacts.export': {
    methods: ["GET","HEAD"],
    pattern: '/app/contacts/export',
    tokens: [{"old":"/app/contacts/export","type":0,"val":"app","end":""},{"old":"/app/contacts/export","type":0,"val":"contacts","end":""},{"old":"/app/contacts/export","type":0,"val":"export","end":""}],
    types: placeholder as Registry['app.contacts.export']['types'],
  },
  'app.contacts.show': {
    methods: ["GET","HEAD"],
    pattern: '/app/contacts/:id',
    tokens: [{"old":"/app/contacts/:id","type":0,"val":"app","end":""},{"old":"/app/contacts/:id","type":0,"val":"contacts","end":""},{"old":"/app/contacts/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['app.contacts.show']['types'],
  },
  'app.contacts.update': {
    methods: ["PUT"],
    pattern: '/app/contacts/:id',
    tokens: [{"old":"/app/contacts/:id","type":0,"val":"app","end":""},{"old":"/app/contacts/:id","type":0,"val":"contacts","end":""},{"old":"/app/contacts/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['app.contacts.update']['types'],
  },
  'app.contacts.block': {
    methods: ["POST"],
    pattern: '/app/contacts/:id/block',
    tokens: [{"old":"/app/contacts/:id/block","type":0,"val":"app","end":""},{"old":"/app/contacts/:id/block","type":0,"val":"contacts","end":""},{"old":"/app/contacts/:id/block","type":1,"val":"id","end":""},{"old":"/app/contacts/:id/block","type":0,"val":"block","end":""}],
    types: placeholder as Registry['app.contacts.block']['types'],
  },
  'app.contacts.unblock': {
    methods: ["POST"],
    pattern: '/app/contacts/:id/unblock',
    tokens: [{"old":"/app/contacts/:id/unblock","type":0,"val":"app","end":""},{"old":"/app/contacts/:id/unblock","type":0,"val":"contacts","end":""},{"old":"/app/contacts/:id/unblock","type":1,"val":"id","end":""},{"old":"/app/contacts/:id/unblock","type":0,"val":"unblock","end":""}],
    types: placeholder as Registry['app.contacts.unblock']['types'],
  },
  'app.contacts.destroy': {
    methods: ["DELETE"],
    pattern: '/app/contacts/:id',
    tokens: [{"old":"/app/contacts/:id","type":0,"val":"app","end":""},{"old":"/app/contacts/:id","type":0,"val":"contacts","end":""},{"old":"/app/contacts/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['app.contacts.destroy']['types'],
  },
  'app.labels.index': {
    methods: ["GET","HEAD"],
    pattern: '/app/labels',
    tokens: [{"old":"/app/labels","type":0,"val":"app","end":""},{"old":"/app/labels","type":0,"val":"labels","end":""}],
    types: placeholder as Registry['app.labels.index']['types'],
  },
  'app.labels.store': {
    methods: ["POST"],
    pattern: '/app/labels',
    tokens: [{"old":"/app/labels","type":0,"val":"app","end":""},{"old":"/app/labels","type":0,"val":"labels","end":""}],
    types: placeholder as Registry['app.labels.store']['types'],
  },
  'app.labels.update': {
    methods: ["PUT"],
    pattern: '/app/labels/:id',
    tokens: [{"old":"/app/labels/:id","type":0,"val":"app","end":""},{"old":"/app/labels/:id","type":0,"val":"labels","end":""},{"old":"/app/labels/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['app.labels.update']['types'],
  },
  'app.labels.destroy': {
    methods: ["DELETE"],
    pattern: '/app/labels/:id',
    tokens: [{"old":"/app/labels/:id","type":0,"val":"app","end":""},{"old":"/app/labels/:id","type":0,"val":"labels","end":""},{"old":"/app/labels/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['app.labels.destroy']['types'],
  },
  'app.conversations.labels.attach': {
    methods: ["POST"],
    pattern: '/app/conversations/:conversationId/labels',
    tokens: [{"old":"/app/conversations/:conversationId/labels","type":0,"val":"app","end":""},{"old":"/app/conversations/:conversationId/labels","type":0,"val":"conversations","end":""},{"old":"/app/conversations/:conversationId/labels","type":1,"val":"conversationId","end":""},{"old":"/app/conversations/:conversationId/labels","type":0,"val":"labels","end":""}],
    types: placeholder as Registry['app.conversations.labels.attach']['types'],
  },
  'app.conversations.labels.detach': {
    methods: ["DELETE"],
    pattern: '/app/conversations/:conversationId/labels/:labelId',
    tokens: [{"old":"/app/conversations/:conversationId/labels/:labelId","type":0,"val":"app","end":""},{"old":"/app/conversations/:conversationId/labels/:labelId","type":0,"val":"conversations","end":""},{"old":"/app/conversations/:conversationId/labels/:labelId","type":1,"val":"conversationId","end":""},{"old":"/app/conversations/:conversationId/labels/:labelId","type":0,"val":"labels","end":""},{"old":"/app/conversations/:conversationId/labels/:labelId","type":1,"val":"labelId","end":""}],
    types: placeholder as Registry['app.conversations.labels.detach']['types'],
  },
  'app.quick-replies.index': {
    methods: ["GET","HEAD"],
    pattern: '/app/quick-replies',
    tokens: [{"old":"/app/quick-replies","type":0,"val":"app","end":""},{"old":"/app/quick-replies","type":0,"val":"quick-replies","end":""}],
    types: placeholder as Registry['app.quick-replies.index']['types'],
  },
  'app.quick-replies.store': {
    methods: ["POST"],
    pattern: '/app/quick-replies',
    tokens: [{"old":"/app/quick-replies","type":0,"val":"app","end":""},{"old":"/app/quick-replies","type":0,"val":"quick-replies","end":""}],
    types: placeholder as Registry['app.quick-replies.store']['types'],
  },
  'app.quick-replies.update': {
    methods: ["PUT"],
    pattern: '/app/quick-replies/:id',
    tokens: [{"old":"/app/quick-replies/:id","type":0,"val":"app","end":""},{"old":"/app/quick-replies/:id","type":0,"val":"quick-replies","end":""},{"old":"/app/quick-replies/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['app.quick-replies.update']['types'],
  },
  'app.quick-replies.destroy': {
    methods: ["DELETE"],
    pattern: '/app/quick-replies/:id',
    tokens: [{"old":"/app/quick-replies/:id","type":0,"val":"app","end":""},{"old":"/app/quick-replies/:id","type":0,"val":"quick-replies","end":""},{"old":"/app/quick-replies/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['app.quick-replies.destroy']['types'],
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
