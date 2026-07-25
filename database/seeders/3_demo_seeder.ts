import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'
import Tenant from '#models/tenant'
import Division from '#models/division'
import User from '#models/user'
import Channel from '#models/channel'
import Contact from '#models/contact'
import Conversation from '#models/conversation'
import Message from '#models/message'
import Role, { ROLES } from '#models/role'
import TenantService from '#services/tenant_service'

/**
 * Demo tenant for local development + tests, plus sample chat data so the chat
 * portal has something to render. Idempotent: the tenant is created once, and
 * chat data is only seeded when the tenant has no channel yet.
 */
export default class extends BaseSeeder {
  static environment = ['development', 'testing']

  async run() {
    let tenant = await Tenant.findBy('slug', 'demo-store')

    if (!tenant) {
      const registration = await TenantService.register({
        tenantName: 'Demo Store',
        fullName: 'Demo Owner',
        email: 'owner@demo.test',
        password: 'password',
      })
      tenant = registration.tenant

      const agentRole = await Role.findByOrFail('name', ROLES.agent.name)
      const division = await Division.create({
        tenantId: tenant.id,
        name: 'General',
        description: 'Default division',
      })
      const agent = await User.create({
        fullName: 'Demo Agent',
        email: 'agent@demo.test',
        password: 'password',
        tenantId: tenant.id,
        roleId: agentRole.id,
        status: 'active',
      })
      await division.related('members').attach([agent.id])
    }

    // Pre-verify demo users so they can access the app without email checks.
    for (const email of ['owner@demo.test', 'agent@demo.test']) {
      const u = await User.findBy('email', email)
      if (u && !u.emailVerifiedAt) {
        u.emailVerifiedAt = DateTime.now()
        await u.save()
      }
    }

    // Seed chat data only once (guarded by presence of a channel).
    if (await Channel.query().where('tenant_id', tenant.id).first()) return
    const agent = await User.findBy('email', 'agent@demo.test')

    const channel = await Channel.create({
      tenantId: tenant.id,
      type: 'whatsapp_waha',
      name: 'Demo WhatsApp',
      status: 'connected',
      wahaEngine: 'gows',
      wahaSessionName: `sf-demo-${Math.random().toString(36).slice(2, 8)}`,
      webhookSecret: 'demo-secret',
      externalId: '628000000000',
    })

    const samples = [
      {
        name: 'Rina Sari',
        phone: '628111000001',
        assigned: true,
        thread: [
          { dir: 'in', body: 'Halo kak, produk yang kemarin masih ready?' },
          { dir: 'out', body: 'Halo kak Rina 👋 Masih ready ya, mau warna apa?' },
          { dir: 'in', body: 'Yang biru muda ada?' },
        ],
      },
      {
        name: 'Budi Santoso',
        phone: '628111000002',
        assigned: false,
        thread: [
          { dir: 'in', body: 'Min, cara ordernya gimana ya?' },
          { dir: 'in', body: 'Ini link katalognya https://demo-store.test/katalog' },
        ],
      },
      {
        name: 'Sang Dewi',
        phone: '628111000003',
        assigned: false,
        thread: [{ dir: 'in', body: 'Terima kasih paketnya sudah sampai 🙏' }],
      },
    ]

    let convIndex = 0
    for (const sample of samples) {
      const contact = await Contact.create({
        tenantId: tenant.id,
        channelId: channel.id,
        externalId: `${sample.phone}@c.us`,
        displayName: sample.name,
      })

      const conversation = await Conversation.create({
        tenantId: tenant.id,
        channelId: channel.id,
        contactId: contact.id,
        status: sample.assigned ? 'open' : 'unassigned',
        assignedAgentId: sample.assigned ? (agent?.id ?? null) : null,
        unreadCount: sample.thread.filter((m) => m.dir === 'in').length,
      })

      let msgIndex = 0
      let lastAt = DateTime.now().minus({ minutes: sample.thread.length * 3 })
      for (const m of sample.thread) {
        lastAt = lastAt.plus({ minutes: 3 })
        await Message.create({
          tenantId: tenant.id,
          conversationId: conversation.id,
          direction: m.dir as 'in' | 'out',
          senderType: m.dir === 'in' ? 'contact' : 'agent',
          senderId: m.dir === 'out' ? (agent?.id ?? null) : null,
          contentType: 'text',
          body: m.body,
          providerMessageId: `demo-${convIndex}-${msgIndex}`,
          status: m.dir === 'in' ? 'delivered' : 'read',
          createdAt: lastAt,
        })
        msgIndex += 1
      }

      conversation.lastMessageAt = lastAt
      await conversation.save()
      convIndex += 1
    }
  }
}
