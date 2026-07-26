import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Plan, { type PlanFeatures } from '#models/plan'

type PlanSeed = {
  code: string
  name: string
  price: number
  interval: string
  sort: number
  features: PlanFeatures
}

const PLANS: PlanSeed[] = [
  {
    code: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    sort: 0,
    features: {
      channels: {
        whatsapp_waha: 0,
        whatsapp_meta: 0,
        messenger: 1,
        instagram: 1,
        telegram: 1,
        webchat: 1,
      },
      agents: 3,
      aiCredits: 200,
      aiAgents: 1,
      quickReplies: 20,
    },
  },
  {
    code: 'pro',
    name: 'Pro',
    price: 149000,
    interval: 'month',
    sort: 1,
    features: {
      channels: {
        whatsapp_waha: 1,
        whatsapp_meta: 1,
        messenger: 10,
        instagram: 10,
        telegram: 10,
        webchat: 5,
      },
      agents: 25,
      aiCredits: 10000,
      aiAgents: 5,
      quickReplies: 200,
    },
  },
]

export default class extends BaseSeeder {
  async run() {
    for (const plan of PLANS) {
      await Plan.updateOrCreate(
        { code: plan.code },
        {
          code: plan.code,
          name: plan.name,
          price: plan.price,
          currency: 'IDR',
          interval: plan.interval,
          features: plan.features,
          isActive: true,
          sort: plan.sort,
        }
      )
    }
  }
}
