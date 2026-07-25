/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  prometheus: {
    metrics: typeof routes['prometheus.metrics']
  }
  drive: {
    fs: {
      serve: typeof routes['drive.fs.serve']
    }
  }
  home: typeof routes['home']
  health: typeof routes['health']
  webhooks: {
    waha: typeof routes['webhooks.waha']
    meta: typeof routes['webhooks.meta'] & {
      verify: typeof routes['webhooks.meta.verify']
    }
    telegram: typeof routes['webhooks.telegram']
  }
  newAccount: {
    create: typeof routes['new_account.create']
    store: typeof routes['new_account.store']
  }
  session: {
    create: typeof routes['session.create']
    store: typeof routes['session.store']
    destroy: typeof routes['session.destroy']
  }
  password: {
    forgot: typeof routes['password.forgot']
    email: typeof routes['password.email']
    reset: typeof routes['password.reset']
    update: typeof routes['password.update']
  }
  oauth: {
    redirect: typeof routes['oauth.redirect']
    callback: typeof routes['oauth.callback']
  }
  email: {
    notice: typeof routes['email.notice']
    resend: typeof routes['email.resend']
    verify: typeof routes['email.verify']
  }
  app: {
    chats: {
      index: typeof routes['app.chats.index']
    }
    divisions: {
      index: typeof routes['app.divisions.index']
      store: typeof routes['app.divisions.store']
      update: typeof routes['app.divisions.update']
      destroy: typeof routes['app.divisions.destroy']
      members: typeof routes['app.divisions.members']
    }
    team: {
      index: typeof routes['app.team.index']
      store: typeof routes['app.team.store']
      update: typeof routes['app.team.update']
      destroy: typeof routes['app.team.destroy']
    }
    channels: {
      index: typeof routes['app.channels.index']
      store: typeof routes['app.channels.store']
      update: typeof routes['app.channels.update']
      destroy: typeof routes['app.channels.destroy']
      configure: typeof routes['app.channels.configure']
      connect: typeof routes['app.channels.connect']
      qr: typeof routes['app.channels.qr']
      status: typeof routes['app.channels.status']
      disconnect: typeof routes['app.channels.disconnect']
    }
    realtime: {
      token: typeof routes['app.realtime.token']
      subscribe: typeof routes['app.realtime.subscribe']
    }
    conversations: {
      index: typeof routes['app.conversations.index']
      messages: typeof routes['app.conversations.messages'] & {
        store: typeof routes['app.conversations.messages.store']
      }
      read: typeof routes['app.conversations.read']
      assign: typeof routes['app.conversations.assign']
      unassign: typeof routes['app.conversations.unassign']
      complete: typeof routes['app.conversations.complete']
      reopen: typeof routes['app.conversations.reopen']
    }
  }
}
