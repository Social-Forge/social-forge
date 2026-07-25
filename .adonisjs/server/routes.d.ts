import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'prometheus.metrics': { paramsTuple?: []; params?: {} }
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'home': { paramsTuple?: []; params?: {} }
    'health': { paramsTuple?: []; params?: {} }
    'sitemap.xml': { paramsTuple?: []; params?: {} }
    'robots.txt': { paramsTuple?: []; params?: {} }
    'webhooks.waha': { paramsTuple: [ParamValue]; params: {'channelId': ParamValue} }
    'webhooks.meta.verify': { paramsTuple?: []; params?: {} }
    'webhooks.meta': { paramsTuple?: []; params?: {} }
    'webhooks.telegram': { paramsTuple: [ParamValue]; params: {'channelId': ParamValue} }
    'webchat.session': { paramsTuple: [ParamValue]; params: {'channelId': ParamValue} }
    'webchat.send': { paramsTuple: [ParamValue]; params: {'channelId': ParamValue} }
    'webchat.poll': { paramsTuple: [ParamValue]; params: {'channelId': ParamValue} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'new_account.store': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'password.forgot': { paramsTuple?: []; params?: {} }
    'password.email': { paramsTuple?: []; params?: {} }
    'password.reset': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'password.update': { paramsTuple?: []; params?: {} }
    'oauth.redirect': { paramsTuple: [ParamValue]; params: {'provider': ParamValue} }
    'oauth.callback': { paramsTuple: [ParamValue]; params: {'provider': ParamValue} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'email.notice': { paramsTuple?: []; params?: {} }
    'email.resend': { paramsTuple?: []; params?: {} }
    'email.verify': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'app.chats.index': { paramsTuple?: []; params?: {} }
    'app.divisions.index': { paramsTuple?: []; params?: {} }
    'app.divisions.store': { paramsTuple?: []; params?: {} }
    'app.divisions.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.divisions.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.divisions.members': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.team.index': { paramsTuple?: []; params?: {} }
    'app.team.store': { paramsTuple?: []; params?: {} }
    'app.team.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.team.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.channels.index': { paramsTuple?: []; params?: {} }
    'app.channels.store': { paramsTuple?: []; params?: {} }
    'app.channels.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.channels.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.channels.configure': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.channels.connect': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.channels.qr': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.channels.status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.channels.disconnect': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.ai.agents.index': { paramsTuple?: []; params?: {} }
    'app.ai.agents.store': { paramsTuple?: []; params?: {} }
    'app.ai.agents.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.ai.agents.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.ai.agents.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.ai.models': { paramsTuple?: []; params?: {} }
    'app.ai.credits': { paramsTuple?: []; params?: {} }
    'app.ai.knowledge.index': { paramsTuple?: []; params?: {} }
    'app.ai.knowledge.store': { paramsTuple?: []; params?: {} }
    'app.ai.knowledge.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.ai.knowledge.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.channels.webchat.embed': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.search': { paramsTuple?: []; params?: {} }
    'app.contacts.index': { paramsTuple?: []; params?: {} }
    'app.contacts.export': { paramsTuple?: []; params?: {} }
    'app.contacts.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.contacts.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.contacts.block': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.contacts.unblock': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.contacts.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.labels.index': { paramsTuple?: []; params?: {} }
    'app.labels.store': { paramsTuple?: []; params?: {} }
    'app.labels.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.labels.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.conversations.labels.attach': { paramsTuple: [ParamValue]; params: {'conversationId': ParamValue} }
    'app.conversations.labels.detach': { paramsTuple: [ParamValue,ParamValue]; params: {'conversationId': ParamValue,'labelId': ParamValue} }
    'app.quick-replies.index': { paramsTuple?: []; params?: {} }
    'app.quick-replies.store': { paramsTuple?: []; params?: {} }
    'app.quick-replies.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.quick-replies.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.realtime.token': { paramsTuple?: []; params?: {} }
    'app.realtime.subscribe': { paramsTuple?: []; params?: {} }
    'app.conversations.index': { paramsTuple?: []; params?: {} }
    'app.conversations.messages': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.conversations.messages.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.conversations.read': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.conversations.assign': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.conversations.unassign': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.conversations.complete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.conversations.reopen': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  GET: {
    'prometheus.metrics': { paramsTuple?: []; params?: {} }
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'home': { paramsTuple?: []; params?: {} }
    'health': { paramsTuple?: []; params?: {} }
    'sitemap.xml': { paramsTuple?: []; params?: {} }
    'robots.txt': { paramsTuple?: []; params?: {} }
    'webhooks.meta.verify': { paramsTuple?: []; params?: {} }
    'webchat.poll': { paramsTuple: [ParamValue]; params: {'channelId': ParamValue} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'password.forgot': { paramsTuple?: []; params?: {} }
    'password.reset': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'oauth.redirect': { paramsTuple: [ParamValue]; params: {'provider': ParamValue} }
    'oauth.callback': { paramsTuple: [ParamValue]; params: {'provider': ParamValue} }
    'email.notice': { paramsTuple?: []; params?: {} }
    'email.verify': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'app.chats.index': { paramsTuple?: []; params?: {} }
    'app.divisions.index': { paramsTuple?: []; params?: {} }
    'app.team.index': { paramsTuple?: []; params?: {} }
    'app.channels.index': { paramsTuple?: []; params?: {} }
    'app.channels.qr': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.channels.status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.ai.agents.index': { paramsTuple?: []; params?: {} }
    'app.ai.agents.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.ai.models': { paramsTuple?: []; params?: {} }
    'app.ai.credits': { paramsTuple?: []; params?: {} }
    'app.ai.knowledge.index': { paramsTuple?: []; params?: {} }
    'app.channels.webchat.embed': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.search': { paramsTuple?: []; params?: {} }
    'app.contacts.index': { paramsTuple?: []; params?: {} }
    'app.contacts.export': { paramsTuple?: []; params?: {} }
    'app.contacts.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.labels.index': { paramsTuple?: []; params?: {} }
    'app.quick-replies.index': { paramsTuple?: []; params?: {} }
    'app.realtime.token': { paramsTuple?: []; params?: {} }
    'app.conversations.index': { paramsTuple?: []; params?: {} }
    'app.conversations.messages': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  HEAD: {
    'prometheus.metrics': { paramsTuple?: []; params?: {} }
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'home': { paramsTuple?: []; params?: {} }
    'health': { paramsTuple?: []; params?: {} }
    'sitemap.xml': { paramsTuple?: []; params?: {} }
    'robots.txt': { paramsTuple?: []; params?: {} }
    'webhooks.meta.verify': { paramsTuple?: []; params?: {} }
    'webchat.poll': { paramsTuple: [ParamValue]; params: {'channelId': ParamValue} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'password.forgot': { paramsTuple?: []; params?: {} }
    'password.reset': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'oauth.redirect': { paramsTuple: [ParamValue]; params: {'provider': ParamValue} }
    'oauth.callback': { paramsTuple: [ParamValue]; params: {'provider': ParamValue} }
    'email.notice': { paramsTuple?: []; params?: {} }
    'email.verify': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'app.chats.index': { paramsTuple?: []; params?: {} }
    'app.divisions.index': { paramsTuple?: []; params?: {} }
    'app.team.index': { paramsTuple?: []; params?: {} }
    'app.channels.index': { paramsTuple?: []; params?: {} }
    'app.channels.qr': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.channels.status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.ai.agents.index': { paramsTuple?: []; params?: {} }
    'app.ai.agents.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.ai.models': { paramsTuple?: []; params?: {} }
    'app.ai.credits': { paramsTuple?: []; params?: {} }
    'app.ai.knowledge.index': { paramsTuple?: []; params?: {} }
    'app.channels.webchat.embed': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.search': { paramsTuple?: []; params?: {} }
    'app.contacts.index': { paramsTuple?: []; params?: {} }
    'app.contacts.export': { paramsTuple?: []; params?: {} }
    'app.contacts.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.labels.index': { paramsTuple?: []; params?: {} }
    'app.quick-replies.index': { paramsTuple?: []; params?: {} }
    'app.realtime.token': { paramsTuple?: []; params?: {} }
    'app.conversations.index': { paramsTuple?: []; params?: {} }
    'app.conversations.messages': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  POST: {
    'webhooks.waha': { paramsTuple: [ParamValue]; params: {'channelId': ParamValue} }
    'webhooks.meta': { paramsTuple?: []; params?: {} }
    'webhooks.telegram': { paramsTuple: [ParamValue]; params: {'channelId': ParamValue} }
    'webchat.session': { paramsTuple: [ParamValue]; params: {'channelId': ParamValue} }
    'webchat.send': { paramsTuple: [ParamValue]; params: {'channelId': ParamValue} }
    'new_account.store': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'password.email': { paramsTuple?: []; params?: {} }
    'password.update': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'email.resend': { paramsTuple?: []; params?: {} }
    'app.divisions.store': { paramsTuple?: []; params?: {} }
    'app.divisions.members': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.team.store': { paramsTuple?: []; params?: {} }
    'app.channels.store': { paramsTuple?: []; params?: {} }
    'app.channels.connect': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.channels.disconnect': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.ai.agents.store': { paramsTuple?: []; params?: {} }
    'app.ai.knowledge.store': { paramsTuple?: []; params?: {} }
    'app.contacts.block': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.contacts.unblock': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.labels.store': { paramsTuple?: []; params?: {} }
    'app.conversations.labels.attach': { paramsTuple: [ParamValue]; params: {'conversationId': ParamValue} }
    'app.quick-replies.store': { paramsTuple?: []; params?: {} }
    'app.realtime.subscribe': { paramsTuple?: []; params?: {} }
    'app.conversations.messages.store': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.conversations.read': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.conversations.assign': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.conversations.unassign': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.conversations.complete': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.conversations.reopen': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PUT: {
    'app.divisions.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.team.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.channels.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.channels.configure': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.ai.agents.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.ai.knowledge.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.contacts.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.labels.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.quick-replies.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'app.divisions.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.team.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.channels.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.ai.agents.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.ai.knowledge.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.contacts.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.labels.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'app.conversations.labels.detach': { paramsTuple: [ParamValue,ParamValue]; params: {'conversationId': ParamValue,'labelId': ParamValue} }
    'app.quick-replies.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}