import env from '#start/env'
import { defineConfig, transports } from '@adonisjs/mail'

const smtpUser = env.get('SMTP_USER')
const smtpPassword = env.get('SMTP_PASSWORD')

const mailConfig = defineConfig({
  default: 'smtp',
  from: {
    address: env.get('SMTP_FROM_EMAIL', 'noreply@localhost'),
    name: env.get('SMTP_FROM_NAME', 'Residential Proxy'),
  },
  mailers: {
    smtp: transports.smtp({
      host: env.get('SMTP_HOST', '127.0.0.1'),
      port: env.get('SMTP_PORT', 1025),
      secure: env.get('SMTP_PORT', 1025) === 465,
      ...(smtpUser && smtpPassword
        ? { auth: { type: 'login' as const, user: smtpUser, pass: smtpPassword } }
        : {}),
    }),
  },
})

export default mailConfig

declare module '@adonisjs/mail/types' {
  export interface MailersList extends InferMailers<typeof mailConfig> {}
}
