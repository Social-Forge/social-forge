import env from '#start/env'
import logger from '@adonisjs/core/services/logger'

export type HealthCheckMode = 'request' | 'playwright' | 'crawlee'

export class RabbitmqPublisherService {
  isEnabled(): boolean {
    return env.get('HEALTHCHECK_ENQUEUE_ENABLED', false) === true
  }

  /**
   * Object-form connection options — avoids URL-encoding issues when the
   * password contains reserved characters like `@`.
   */
  connectionConfig() {
    return {
      protocol: 'amqp',
      hostname: env.get('RABBITMQ_HOST', '127.0.0.1'),
      port: Number(env.get('RABBITMQ_PORT', 5672)),
      username: env.get('RABBITMQ_USER', 'guest'),
      password: env.get('RABBITMQ_PASSWORD', 'guest'),
      vhost: env.get('RABBITMQ_VHOST', '/'),
      heartbeat: 30,
    }
  }
}

export default new RabbitmqPublisherService()
