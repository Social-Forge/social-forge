/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  home: typeof routes['home']
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
  email: {
    notice: typeof routes['email.notice']
    resend: typeof routes['email.resend']
    verify: typeof routes['email.verify']
  }
  app: {
    chats: {
      index: typeof routes['app.chats.index']
    }
  }
}
