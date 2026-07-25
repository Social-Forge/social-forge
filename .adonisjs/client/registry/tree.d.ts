/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  prometheus: {
    metrics: typeof routes['prometheus.metrics']
  }
  home: typeof routes['home']
  health: typeof routes['health']
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
  }
}
