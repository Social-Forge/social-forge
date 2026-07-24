# Social Forge — Architecture Blueprint

> **Social Forge — Multi-agent Customer Service and Omnichannel CRM.** Omnichannel customer messaging (WhatsApp, Meta, Telegram) dengan AI, multi-tenant, dan billing.
>
> Status dokumen: **DRAFT DISETUJUI (arsitektur dasar)** · Terakhir diperbarui: 2026-07-25
>
> Dokumen ini adalah _source of truth_ arsitektur. Setiap keputusan besar dicatat di [Decision Log](#1-decision-log). Roadmap eksekusi ada di [`ROADMAP.md`](./ROADMAP.md).

---

## Daftar Isi

1. [Decision Log](#1-decision-log)
2. [Tujuan & Prinsip](#2-tujuan--prinsip)
3. [Arsitektur High-Level](#3-arsitektur-high-level)
4. [Struktur Monorepo](#4-struktur-monorepo)
5. [Tech Stack Lengkap](#5-tech-stack-lengkap)
6. [Multi-Tenancy & RBAC](#6-multi-tenancy--rbac)
7. [Model Data Inti](#7-model-data-inti)
8. [Pipeline Pesan (Inbound & Outbound)](#8-pipeline-pesan-inbound--outbound)
9. [Integrasi Channel](#9-integrasi-channel)
10. [Real-time Layer (Centrifugo)](#10-real-time-layer-centrifugo)
11. [AI Layer (Multi-Provider + Credits)](#11-ai-layer-multi-provider--credits)
12. [Search (Typesense)](#12-search-typesense)
13. [Billing, Subscription & Entitlements](#13-billing-subscription--entitlements)
14. [Storage (MinIO)](#14-storage-minio)
15. [Observability & Monitoring](#15-observability--monitoring)
16. [Keamanan](#16-keamanan)
17. [Deployment Topology](#17-deployment-topology)
18. [Status Scaffold Existing & Refactor Items](#18-status-scaffold-existing--refactor-items)
19. [Katalog Fitur Lengkap](#19-katalog-fitur-lengkap)

---

## 1. Decision Log

Keputusan arsitektur yang sudah dipatenkan (hasil diskusi 2026-07-24):

| #   | Topik            | Keputusan                                                                           | Alasan Singkat                                                |
| --- | ---------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| D1  | AI Provider      | **Multi-provider dari awal** (abstraksi `AiProvider` + "AI Credits" ternormalisasi) | Fleksibel; hindari lock-in; owner pilih provider per AI Agent |
| D2  | Real-time        | **Centrifugo dari awal**                                                            | Skala + mobile app; hindari refactor SSE→WS                   |
| D3  | Multi-tenant     | **Shared DB + `tenant_id` + Postgres RLS**                                          | Standar SaaS, hemat, RLS sebagai jaring pengaman kedua        |
| D4  | Repo             | **Monorepo (pnpm workspaces)**                                                      | Share types web/mobile/workers, atomic changes                |
| D5  | Contact identity | **Terpisah per channel + merge manual**                                             | Realistis; hindari salah gabung data                          |
| D6  | Billing          | **Base plan + add-on quota (metered)**                                              | Fleksibel untuk komersil; jual slot & AI credits terpisah     |
| D7  | Search           | **Typesense dari awal** + `search-indexer-worker`                                   | Volume ribuan chat/hari; jangan bebani DB utama               |
| D8  | Auth             | **Hybrid: session cookie (web) + JWT access/refresh (mobile/API)**                  | Web aman dari XSS; mobile pakai token; Centrifugo pakai JWT   |
| D9  | WAHA engine      | **GOWS default, NOWEB fallback**, WEBJS opsional                                    | GOWS paling ringan & stabil untuk multi-session               |
| D10 | Payment          | **Xendit prioritas pertama**, lalu Midtrans, PayPal menyusul                        | Target market Indonesia                                       |
| D11 | Build order      | **Web 100% dulu, mobile React Native belakangan**                                   | API matang dulu; mobile = chat-only                           |

---

## 2. Tujuan & Prinsip

### Tujuan Produk

- **Fase 1 (internal):** platform CRM omnichannel untuk mendukung online shop pribadi (volume: ribuan chat/hari).
- **Fase 2 (komersil):** SaaS multi-tenant dengan subscription + payment gateway.

### Prinsip Arsitektur

1. **Postgres = source of truth.** Redis, Typesense, MinIO adalah turunan/cache/index yang bisa di-rebuild.
2. **Async by default untuk I/O eksternal.** Semua interaksi ke provider (kirim/terima) lewat queue → tahan crash, retry, backpressure.
3. **Idempoten & at-least-once.** Provider sering kirim webhook dobel; dedup wajib.
4. **Tenant isolation berlapis.** Query scope + RLS. Tidak ada query tanpa `tenant_id`.
5. **Modular monolith, bukan microservices.** Satu codebase, banyak proses (web + workers). Pisah proses hanya berdasarkan karakteristik beban.
6. **Normalisasi channel.** Apapun channelnya (WA/IG/Messenger/Telegram), pesan disimpan dalam bentuk seragam (`messages` + `channel_type`).

---

## 3. Arsitektur High-Level

```
                          ┌──────────────────────────────────────┐
   Customers              │        EDGE (Nginx / Traefik)         │
   (WA/IG/FB/TG)          │   TLS · rate-limit · reverse proxy    │
        │                 └───────────────┬──────────────────────┘
        │ webhooks / events               │
        ▼                                 ▼
┌──────────────────┐          ┌──────────────────────────────────┐
│  CHANNEL LAYER   │          │   APP (AdonisJS + Inertia + Vue)  │
│                  │          │  · HTTP API (REST + Tuyau RPC)    │
│  WAHA cluster    │          │  · Web serving (SSR Inertia)      │
│   - gows (def)   │          │  · Auth (session + JWT)           │
│   - noweb (fb)   │◄────────►│  · Webhook receivers              │
│   - webjs (opt)  │  outbound│  · Business logic / policies      │
│                  │  send    └───────┬──────────────┬───────────┘
│  Meta Webhooks   │                  │              │
│   (WA Biz/IG/FB) │          publish  │              │ query/persist
│  Telegram Bot    │                  ▼              ▼
└────────┬─────────┘        ┌──────────────┐  ┌──────────────────┐
         │ inbound          │   RabbitMQ   │  │    Postgres      │
         └─────────────────►│  (exchanges  │  │  (source of      │
                            │   + queues)  │  │   truth + RLS)   │
                            └──────┬───────┘  └──────────────────┘
                                   │
        ┌──────────────────────────┼───────────────────────────────┐
        ▼            ▼             ▼            ▼            ▼        ▼
  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ ┌────────┐
  │ inbound- │ │ outbound-│ │  ai-     │ │  media-  │ │search- │ │billing-│
  │normalizer│ │dispatcher│ │  agent   │ │  worker  │ │indexer │ │ worker │
  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └───┬────┘ └───┬────┘
       │            │            │            │           │          │
       ▼            ▼            ▼            ▼           ▼          ▼
   Postgres    Provider     AI Providers   MinIO     Typesense   Postgres
   +Centrifugo  APIs        (Claude/GPT…)  (S3)       (index)    (quota)
       │
       ▼
  ┌──────────────┐        ┌──────────────────────────────────┐
  │  Centrifugo  │───────►│  Clients: Web (Inertia/Vue) +     │
  │ (WS pub/sub) │  realtime  Mobile (React Native)           │
  └──────────────┘        └──────────────────────────────────┘

  Observability: Prometheus · Grafana · Loki · Promtail · Sentry/GlitchTip
  Cache/locks/presence: Redis
```

### Proses yang berjalan (runtime processes)

| Proses                          | Perintah                                | Tanggung jawab                                                                     |
| ------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------- |
| **web**                         | `node ace serve` / `node bin/server.js` | HTTP API + Inertia SSR + webhook receiver                                          |
| **worker: inbound-normalizer**  | `node ace queue:work inbound`           | Ubah payload channel mentah → `messages` ternormalisasi, dedup, persist, broadcast |
| **worker: outbound-dispatcher** | `node ace queue:work outbound`          | Kirim ke provider, retry/backoff, update status, rate-limit                        |
| **worker: ai-agent**            | `node ace queue:work ai`                | Auto-reply, webchat bot, token metering                                            |
| **worker: media**               | `node ace queue:work media`             | Download media provider → MinIO, generate thumbnail                                |
| **worker: search-indexer**      | `node ace queue:work search`            | Index message/contact ke Typesense                                                 |
| **worker: notification**        | `node ace queue:work notifications`     | Push (FCM/APNs), email                                                             |
| **scheduler**                   | `node ace scheduler:run`                | Cron: expiry subscription, quota reset, working-hours, cleanup                     |

> Semua worker adalah proses AdonisJS Ace yang sama codebase-nya (modular monolith), dijalankan sebagai service Docker terpisah dengan `command` berbeda.

---

## 4. Struktur Monorepo

pnpm workspaces. Repo saat ini masih flat (AdonisJS di root) — akan direstrukturisasi bertahap ke bentuk berikut (lihat [Refactor Items](#18-status-scaffold-existing--refactor-items)).

```
crm-chat-multiagent/
├── apps/
│   ├── web/                  # AdonisJS + Inertia + Vue (kode saat ini pindah ke sini)
│   │   ├── app/              # controllers, models, services, policies, workers
│   │   ├── inertia/          # Vue pages + shadcn-vue components
│   │   ├── database/         # migrations, seeders, schema.ts (auto-gen)
│   │   └── start/            # routes, kernel, env
│   └── mobile/               # React Native (Fase 5) — chat-only
├── packages/
│   ├── shared/               # Zod schemas, TypeScript types, konstanta channel, enums
│   ├── ai/                   # Abstraksi AiProvider + adapter (claude, openai, …)
│   └── contracts/            # Tuyau API client types (web ↔ mobile ↔ backend)
├── infra/                    # Docker configs (postgres, centrifugo, nginx, monitoring, …)
├── docker-compose.yml        # Development (local)
├── docker-compose.prod.yml   # Production (Ubuntu server) — akan dibuat
├── docs/
│   ├── ARCHITECTURE.md       # dokumen ini
│   └── ROADMAP.md
└── pnpm-workspace.yaml
```

> **Catatan:** karena Fase 1–4 semuanya web/backend, restrukturisasi `apps/web` bisa ditunda sampai sebelum mulai mobile (Fase 5). Untuk sekarang cukup tambahkan `packages/shared` dan `packages/ai` sebagai workspace agar types bisa dibagi ke worker & mobile nanti.

---

## 5. Tech Stack Lengkap

### Backend

| Kategori      | Pilihan                                                                 | Catatan                                           |
| ------------- | ----------------------------------------------------------------------- | ------------------------------------------------- |
| Framework     | **AdonisJS 7**                                                          | Sudah terpasang                                   |
| ORM           | **Lucid** (Postgres)                                                    | Sudah terpasang; pakai schema-generator           |
| Validasi      | **VineJS** (server) + **Zod** (shared/inertia)                          | Zod di `packages/shared` untuk dipakai lintas app |
| API typing    | **Tuyau**                                                               | RPC end-to-end typesafe (web + mobile)            |
| Auth          | `@adonisjs/auth` — session guard (web) + **access tokens/JWT** (mobile) | Hybrid                                            |
| Authorization | `@adonisjs/bouncer` (policies/abilities)                                | Sudah terpasang                                   |
| Queue         | **RabbitMQ** (`amqplib`)                                                | Exchange topic + DLX untuk retry                  |
| Cache/locks   | **Redis** (`@adonisjs/redis`)                                           | Rate-limit, presence, distributed lock, cache     |
| Rate limiting | `@adonisjs/limiter` (Redis store)                                       | Sudah terpasang                                   |
| Mail          | `@adonisjs/mail` (SMTP/Resend)                                          | Sudah terpasang                                   |
| i18n          | `@adonisjs/i18n` (EN + ID)                                              | Sudah terpasang                                   |

### Frontend (Web)

| Kategori     | Pilihan                                              |
| ------------ | ---------------------------------------------------- |
| UI framework | **Vue 3 + Inertia 2**                                |
| Build        | **Vite 7**                                           |
| Komponen     | **shadcn-vue** (reka-ui/radix-vue) + Tailwind v4     |
| State        | **Pinia**                                            |
| Dark/Light   | Tailwind + `data-theme` (sudah ada `tw-animate-css`) |
| Tabel        | `@tanstack/vue-table`                                |
| Chart        | `@unovis/vue`                                        |
| Form         | `vee-validate` + `@vee-validate/zod`                 |
| Toast        | `vue-sonner`                                         |

### Infrastruktur

| Kategori            | Pilihan                                                   | Status                                |
| ------------------- | --------------------------------------------------------- | ------------------------------------- |
| Database            | **PostgreSQL** (custom image)                             | ✅ compose                            |
| Cache/Broker-lite   | **Redis 7**                                               | ✅ compose                            |
| Message broker      | **RabbitMQ 3.13**                                         | ⚠️ compose (commented) → **aktifkan** |
| Object storage      | **MinIO** (S3)                                            | ✅ compose                            |
| Realtime            | **Centrifugo v5**                                         | ✅ compose                            |
| Search              | **Typesense**                                             | ❌ **tambahkan**                      |
| WAHA cluster        | gows / noweb / webjs                                      | ✅ compose                            |
| Edge/Proxy          | **Nginx** (prod) — Traefik configs ada sebagai alternatif | infra/ ada, pilih salah satu          |
| Monitoring          | **Prometheus + Grafana + Loki + Promtail**                | infra/ ada → aktifkan di compose      |
| Error tracking      | **Sentry / GlitchTip**                                    | ❌ **tambahkan**                      |
| Push notif (mobile) | **FCM** (Android), APNs (iOS nanti)                       | Fase 5                                |
| Secrets             | `.env` (dev) → **Doppler/Vault** (prod, opsional)         | —                                     |

### Additions (rekomendasi yang belum disebut di brief)

- **Typesense** — search engine (D7).
- **Sentry/GlitchTip** — error tracing (metrics ≠ error tracking).
- **Outbox table** — reliable messaging pattern.
- **FCM** — push notification mobile.
- **`packages/ai`** — abstraksi multi-provider.
- **BullMQ (opsional)** — jika ingin queue in-Redis untuk job ringan (scheduler/notif); RabbitMQ tetap untuk pipeline pesan berat. _Default: pakai RabbitMQ saja dulu untuk kesederhanaan._

---

## 6. Multi-Tenancy & RBAC

### Hierarki

```
Platform (SocialForge)
└── Super Admin (kamu — platform owner, kelola semua tenant & billing)
    └── Tenant (1 langganan = 1 workspace bisnis)
        ├── Owner            (pemilik tenant, full akses dalam tenant)
        ├── Division/Group   (pengelompokan: Supervisor + Agent + Channel)
        │   ├── Supervisor   (kelola agent & channel dalam divisinya)
        │   └── Agent CS     (handle percakapan yang di-assign)
        └── Channels (WA/IG/Messenger/Telegram) → di-assign ke Division
```

### Roles & Kapabilitas (ringkas)

| Aksi                                        | Super Admin | Owner | Supervisor |   Agent    |
| ------------------------------------------- | :---------: | :---: | :--------: | :--------: |
| Kelola semua tenant & billing platform      |     ✅      |   —   |     —      |     —      |
| CRUD Division                               |      —      |  ✅   |     —      |     —      |
| CRUD Supervisor & Agent                     |      —      |  ✅   |     —      |     —      |
| Add/Edit Channel                            |      —      |  ✅   |     —      |     —      |
| Assign channel ke Division                  |      —      |  ✅   |     —      |     —      |
| Auto-reply & working hours setup            |      —      |  ✅   |     ✅     |     —      |
| Re-assign / keluarkan agent dari percakapan |      —      |  ✅   |     ✅     |     —      |
| Handle percakapan                           |      —      |  ✅   |     ✅     |     ✅     |
| Buat Label (unik per tenant)                |      —      |  ✅   |     ✅     |     ✅     |
| Balas cepat (quick reply)                   |      —      |  ✅   |     ✅     |     ✅     |
| Export kontak CSV                           |      —      |  ✅   |     ✅     | (opsional) |

Implementasi: `@adonisjs/bouncer` policies. Setiap policy menerima `user` (dengan `tenantId`, `role`, `divisionIds`) dan resource. Middleware `tenant` meng-inject `tenant_id` ke context + set `SET app.current_tenant` untuk RLS.

### Row-Level Security (RLS)

Setiap tabel ber-tenant punya policy:

```sql
CREATE POLICY tenant_isolation ON messages
  USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

Koneksi Lucid men-set `app.current_tenant` di awal request (via middleware). Ini jaring pengaman kedua bila ada bug query lupa `where tenant_id`.

---

## 7. Model Data Inti

Entitas utama (ringkasan; detail kolom dibuat saat migrasi). Semua tabel ber-tenant punya `tenant_id uuid` + index.

### Identity & Tenancy

- `tenants` — id, name, slug, plan_id, status, trial_ends_at, settings (jsonb)
- `users` — (sudah ada) + `tenant_id`, `role`, `status`, `last_seen_at`
- `roles` — (sudah ada) role definitions
- `divisions` — tenant_id, name, description
- `division_members` — division_id, user_id, role (supervisor/agent)

### Channels & Contacts

- `channels` — tenant_id, division_id, type (`whatsapp_waha`|`whatsapp_meta`|`messenger`|`instagram`|`telegram`), name, status, credentials (jsonb terenkripsi), waha_engine, waha_session_name, webhook_secret
- `contacts` — tenant_id, channel_id, external_id (no HP/PSID/IG-id/chat-id), display_name, avatar_url, is_blocked, attributes (jsonb), **UNIQUE(channel_id, external_id)**
- `contact_links` — untuk merge manual: master_contact_id ↔ linked_contact_id (D5)

### Conversations & Messages

- `conversations` — tenant_id, channel_id, contact_id, assigned_agent_id (nullable), status (`open`|`unassigned`|`completed`|`archived`), last_message_at, unread_count, is_pinned, service_window_expires_at (Meta 24h), labels (m2m)
- `messages` — tenant_id, conversation_id, direction (`in`|`out`), sender_type (`contact`|`agent`|`ai`|`system`), content_type (`text`|`image`|`video`|`audio`|`document`|`location`|`template`|`link`|`sticker`), body (text), media (jsonb → MinIO key), **provider_message_id** (UNIQUE untuk dedup), status (`pending`|`sent`|`delivered`|`read`|`failed`), reply_to_id, is_pinned, edited_at, deleted_at, created_at
- `message_outbox` — (outbox pattern) message_id, status, attempts, next_retry_at, error
- `labels` — tenant_id, name, color, **UNIQUE(tenant_id, name)**
- `conversation_labels` — m2m
- `quick_replies` — tenant_id, shortcut (unik/tenant), type (`text`|`text_image`|`text_video`), content, media_url
- `notes` / `conversation_events` — audit trail assign/unassign/label/complete

### AI & Webchat

- `ai_agents` — tenant_id, name, provider (`claude`|`openai`|…), model, system_prompt, temperature, knowledge_base_id, is_active
- `ai_knowledge` — dokumen/embedding untuk RAG webchat bot
- `webchat_widgets` — tenant_id, ai_agent_id, config (warna, greeting), embed_script_id
- `linkchats` — tenant_id, slug, target (division/channel), config → link share (mirip wa.me)

### Billing & Entitlements

- `plans` — code (`free`|`pro`), price, limits (jsonb: channels, agents, quick_replies, ai_credits…)
- `subscriptions` — tenant_id, plan_id, status, current_period_end, cancel_at
- `subscription_addons` — subscription_id, type (`channel_slot`|`agent_slot`|`ai_credits`), quantity
- `entitlements` — tenant_id, feature, limit, used (materialized untuk cek cepat)
- `ai_credit_ledger` — tenant_id, delta, reason, balance_after
- `invoices` — tenant_id, gateway (`xendit`|`midtrans`|`paypal`), external_id, amount, status, paid_at
- `payment_events` — raw webhook log (idempoten)

### Auto-response & Working Hours

- `auto_responses` — tenant_id, channel_id, trigger (`always`|`out_of_hours`|`keyword`|`call_rejected`), message, is_active
- `working_hours` — tenant_id/division_id, schedule (jsonb per hari), timezone
- `auto_assign_rules` — tenant_id, division_id, strategy (`round_robin`|`percentage`|`least_busy`), config

---

## 8. Pipeline Pesan (Inbound & Outbound)

### Inbound (pesan masuk dari customer)

```
1. Provider → webhook/WAHA event → APP receiver
2. Verifikasi signature (HMAC Meta / secret WAHA)
3. Publish RAW ke exchange `inbound` (routing key = channel type)
4. inbound-normalizer worker:
   a. Cek dedup by provider_message_id (skip jika sudah ada)
   b. Normalisasi → bentuk `messages` seragam
   c. Resolve/insert contact + conversation (buat baru jika perlu)
   d. Persist ke Postgres (transaction)
   e. Jika media → publish job ke `media` queue
   f. Update unread_count, service_window (Meta 24h)
   g. Broadcast ke Centrifugo channel `tenant:{id}:conversation:{id}`
   h. Publish job ke `search` queue (index)
   i. Jika auto-assign aktif & unassigned → jalankan rule assign
   j. Jika AI agent aktif / out-of-hours → publish job ke `ai` queue
```

### Outbound (agent/AI kirim pesan)

```
1. Agent kirim via API → validasi + policy check
2. Cek entitlement (quota, Meta 24h window → wajib template jika lewat)
3. Tulis `messages` status=pending + `message_outbox` (SATU transaction) ← Outbox pattern
4. Publish job ke exchange `outbound`
5. outbound-dispatcher worker:
   a. Rate-limit check (token bucket per channel di Redis)
   b. Kirim ke provider API / WAHA
   c. Update status (sent) + provider_message_id
   d. Broadcast status ke Centrifugo
   e. Jika gagal → retry via DLX dengan backoff; setelah N gagal → status=failed + notify
6. Delivery/read receipt dari provider (webhook) → update status → broadcast
```

### Jaminan

- **At-least-once + idempoten** → dedup by `provider_message_id` (inbound) & `outbox.message_id` (outbound).
- **Ordering** per-conversation dijaga dengan single active consumer per conversation key (atau order by created_at saat render; provider tak menjamin urutan absolut).
- **Backpressure** → RabbitMQ prefetch + DLX; media diproses async agar tak nge-block.

---

## 9. Integrasi Channel

### WhatsApp — WAHA (self-hosted)

- **3 image, 3 container** (`gows`, `noweb`, `webjs`), tiap container = worker terpisah dengan `WAHA_WORKER_ID`.
- **Engine default GOWS** (D9); NOWEB fallback; WEBJS opsional untuk fitur web-based.
- **Session storage: PostgreSQL** (`WHATSAPP_SESSIONS_POSTGRESQL_URL`) — **perlu diperbaiki**: saat ini menunjuk `localhost`, harus `postgres` (nama service) & jangan hardcode password.
- **Media: MinIO/S3** (sudah dikonfigurasi `WAHA_MEDIA_STORAGE=S3`).
- **Session→worker registry**: tabel `channels.waha_engine` + `waha_session_name` menentukan container mana yang meng-host session. APP memanggil WAHA API sesuai engine channel.
- **Webhook WAHA** → APP receiver (`/webhooks/waha/:channelId`) dengan secret.
- **Auto-reject call** (fitur brief): WAHA event `call.received` → dispatcher reject + kirim auto-response.

### Meta — WhatsApp Business / Messenger / Instagram (Graph API)

- **Tanpa container** — berbasis webhook + Graph API. Session = access token (long-lived) + app secret, disimpan terenkripsi di `channels.credentials`.
- **Webhook verification** (hub.challenge) + **X-Hub-Signature-256** HMAC.
- **24-hour customer service window**: field `conversations.service_window_expires_at`. Di luar window → hanya **Message Template** (WhatsApp) / tag (Messenger) yang boleh dikirim. UI menandai status window.
- **Rate limits** Meta ketat → token bucket per channel.

### Telegram (Bot API)

- **Tanpa container** — Bot API via webhook atau long-polling. Token bot di `channels.credentials`.
- Rekomendasi: **webhook mode** (konsisten dengan channel lain) di production; long-polling untuk dev lokal.

### Normalisasi

Semua channel → adapter yang mengubah payload ke bentuk `messages` seragam. Adapter hidup di `app/services/channels/{waha,meta,telegram}/`. Interface: `parseInbound()`, `sendOutbound()`, `verifyWebhook()`, `mapStatus()`.

---

## 10. Real-time Layer (Centrifugo)

- **Auth**: APP menerbitkan JWT Centrifugo (HS256, secret shared) saat login/refresh. Mobile & web pakai token yang sama.
- **Namespace channel**:
  - `tenant:{tid}:conversation:{cid}` — pesan & status per percakapan
  - `tenant:{tid}:agent:{uid}` — notifikasi personal agent (assign baru, mention)
  - `tenant:{tid}:presence` — online/typing (pakai presence Centrifugo)
  - `tenant:{tid}:inbox` — update list percakapan (badge unread, label, status)
- **Subscribe authorization**: Centrifugo proxy `subscribe` → APP verifikasi user berhak atas channel (tenant + division + assignment).
- **Publish**: worker publish via Centrifugo HTTP API (server-to-server) — bukan dari client.
- **Presence & typing**: fitur bawaan Centrifugo.

---

## 11. AI Layer (Multi-Provider + Credits)

### Abstraksi (`packages/ai`)

```ts
interface AiProvider {
  chat(messages, opts): Promise<AiResult>
  stream(messages, opts): AsyncIterable<AiChunk>
  countTokens(input): number
  embed(text): Promise<number[]> // untuk RAG webchat
}
```

Adapter: `ClaudeProvider`, `OpenAiProvider`, … (extensible). Owner tenant memilih provider + model per `ai_agents`.

### AI Credits (metering ternormalisasi)

- Harga token tiap provider beda → dinormalisasi ke **"AI Credit"** internal (mis. 1 credit = X token-equivalent, dengan faktor per model).
- Setiap panggilan AI mencatat `ai_credit_ledger` (debit) dengan `balance_after`.
- Cek saldo **sebelum** panggil (entitlement). Habis → auto-reply nonaktif + notifikasi upgrade.
- Default plan Pro: bundle credits awal; beli tambahan via add-on.

> **Klarifikasi brief:** "AI 1000 token" akan diterjemahkan sebagai paket credit awal (bukan literal 1000 token mentah — itu habis dalam ~1 percakapan). Angka final ditentukan saat menyusun paket.

### Use cases

1. **Auto-reply CS** (channel) — jawab pelanggan otomatis dalam konteks percakapan + working hours.
2. **Webchat bot** (floating bubble di website) — RAG dari `ai_knowledge` tenant.
3. **Suggest reply** (opsional) — draft jawaban untuk agent, tidak auto-kirim.

### Provider default untuk aplikasi (build internal)

Untuk pengembangan & bot bawaan platform, gunakan **Claude** sebagai default (kualitas bahasa Indonesia + prompt caching hemat), sambil tetap membuka adapter provider lain.

---

## 12. Search (Typesense)

- **Collections**: `messages`, `contacts`, `conversations` — masing-masing dengan field `tenant_id` (untuk scoping).
- **Scoped API keys**: backend menerbitkan key per-tenant yang terkunci `filter_by: tenant_id:={id}` → tenant tak bisa cari data tenant lain.
- **Sync async**: `search-indexer-worker` konsumsi event dari queue `search` → upsert ke Typesense. Postgres tetap source of truth.
- **Rebuild**: command `node ace search:reindex` untuk membangun ulang index dari Postgres.
- **Fitur**: fuzzy/typo-tolerant, filter by channel/label/agent/date-range, highlight.

---

## 13. Billing, Subscription & Entitlements

### Model (D6: base plan + add-on metered)

- **Plans**: `free`, `pro` (limits di jsonb).
- **Add-ons**: beli slot channel/agent, atau AI credits — nambah entitlement tanpa ganti plan.
- **Entitlements engine**: satu service `EntitlementService.check(tenant, feature, amount)` dipanggil di titik enforcement (buat channel, tambah agent, kirim AI). Materialized di tabel `entitlements` (limit vs used) untuk cek O(1).

### Limits awal (draft — dikonfirmasi saat susun paket)

| Fitur                       | Free     | Pro         |
| --------------------------- | -------- | ----------- |
| WhatsApp WAHA               | 0        | 1           |
| WhatsApp Business Meta      | 0        | 1           |
| Messenger                   | 1        | 10          |
| Instagram                   | 1        | 10          |
| Telegram                    | 1        | 10          |
| Agent (termasuk supervisor) | 1        | 10          |
| Quick replies               | 10       | 100         |
| Linkchat & Webchat          | terbatas | unlimited   |
| AI Agent                    | 0        | 1           |
| AI Credits                  | 0        | bundle awal |

> Free tier: brief tidak menyebut WhatsApp — dikonfirmasi 0 WhatsApp untuk free.

### Payment (D10: Xendit dulu)

- **Gateway abstraction**: interface `PaymentGateway` (create invoice, verify webhook, refund). Adapter Xendit → Midtrans → PayPal.
- **Flow**: pilih plan/add-on → buat `invoice` → redirect/checkout → **webhook** (idempoten via `payment_events`) → aktivasi entitlement → broadcast realtime ke halaman invoice (Centrifugo).
- **Verifikasi webhook** wajib (signature Xendit/Midtrans, IPN PayPal).

### Worker

- `billing-worker` / scheduler: hitung expiry subscription, downgrade otomatis saat lewat `current_period_end`, reset kuota periodik, kirim reminder H-3.

---

## 14. Storage (MinIO)

- **Buckets**: `media` (chat media), `avatars`, `waha` (media WAHA), `exports` (CSV kontak), `ai-knowledge` (dokumen RAG).
- **Akses**: presigned URL (upload & download) — client tak akses MinIO langsung dengan kredensial.
- **Media pipeline**: media dari provider (URL sementara) di-mirror `media-worker` → MinIO → simpan key di `messages.media`. Thumbnail untuk image/video.
- **Lifecycle**: retention policy per tenant (opsional), exports auto-expire.

---

## 15. Observability & Monitoring

Stack sudah ada di `infra/` (perlu diaktifkan di compose):

- **Prometheus** — metrics (`@julr/adonisjs-prometheus` sudah terpasang). Metrics kustom: pesan/detik, latency dispatch, queue depth, AI credit usage, error rate per channel.
- **Grafana** — dashboards. **Hapus/ganti** dashboard warisan template (`proxy_overview`, `scraper`, `health_checker`) dengan dashboard SocialForge (messaging throughput, channel health, queue, billing).
- **Loki + Promtail** — log aggregation.
- **Sentry/GlitchTip** — error tracking (tambahan).
- **Health checks** — endpoint `/health` (DB, Redis, RabbitMQ, MinIO, Centrifugo, WAHA reachability).

---

## 16. Keamanan

- **Secrets terenkripsi**: token Meta/Telegram/WAHA di `channels.credentials` dienkripsi (AdonisJS encryption / pgcrypto). Jangan plaintext.
- **Webhook signature verification**: semua (Meta HMAC, Xendit/Midtrans, PayPal IPN, WAHA secret).
- **RLS** + query scoping (tenant isolation berlapis).
- **Rate limiting**: auth endpoints (sudah ada `authThrottle`), API publik, webchat.
- **CSRF/Shield** (sudah ada `@adonisjs/shield`) untuk web session.
- **JWT rotation**: access token pendek + refresh token, revoke on logout.
- **Audit log**: aksi sensitif (assign, block, delete, billing, role change).
- **Input sanitization** & file type validation untuk media upload.
- **PII / GDPR**: export & hapus data tenant; retention policy.
- **CAPTCHA** (mis. Turnstile) untuk signup & webchat anti-spam.

---

## 17. Deployment Topology

### Development (lokal — Docker Desktop / Laragon)

- `docker-compose.yml` — semua service (postgres, redis, rabbitmq, minio, centrifugo, typesense, waha×3, monitoring).
- APP + workers bisa jalan di host (`node ace serve` / `queue:work`) atau dalam container.
- Port di-bind ke `127.0.0.1` (sudah begitu di compose).

### Production (Ubuntu Server + Nginx)

- `docker-compose.prod.yml` (dibuat) — image ter-build, resource limits, restart policy.
- **Nginx** reverse proxy + TLS (Let's Encrypt). _Traefik configs ada di `infra/traefik` sebagai alternatif — pilih salah satu; brief menyebut Nginx, jadi **Nginx = default**, Traefik dihapus/diarsipkan._
- Web app di-scale horizontal (beberapa instance) di belakang Nginx; workers di-scale per queue sesuai beban.
- Postgres, Redis, RabbitMQ, MinIO, Typesense: bind localhost, akses remote via SSH tunnel.
- CI/CD: GitHub Actions (lint, typecheck, test, build image, deploy).
- Backup: pg_dump terjadwal + MinIO replication/backup.

---

## 18. Status Scaffold Existing & Refactor Items

### ✅ Sudah ada & dipertahankan

- AdonisJS 7 + Inertia + Vue 3 + Tailwind v4 + shadcn-vue (banyak komponen UI termasuk `bubble`, `message`, `attachment`, `chart`).
- Auth flow lengkap (signup, login, forgot/reset password, email verification) + model `User`, `Role`.
- Docker compose: postgres (custom image), redis, centrifugo, minio, waha×3.
- Infra configs: centrifugo, prometheus, grafana, loki, promtail, rabbitmq, nginx, traefik, postgres.
- `@julr/adonisjs-prometheus`, `@adonisjs/limiter`, `@adonisjs/i18n`, `amqplib` terpasang.
- Schema-generator pattern (`database/schema.ts` auto-gen dari migrasi).

### ⚠️ Refactor / perbaikan (warisan template proxy-checker)

| Item                                                            | Masalah                                                                          | Aksi                                                                                                             |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `app/services/rabbitmq_publisher_service.ts`                    | Isi `healthcheck.jobs`, `proxyEntryId`, "Go health-checker" — sisa project proxy | Ganti total → publisher generik untuk pipeline pesan (exchanges: inbound/outbound/ai/media/search/notifications) |
| Grafana dashboards `proxy_overview/scraper/health_checker.json` | Bukan untuk messaging                                                            | Hapus, ganti dashboard SocialForge                                                                               |
| `infra/mongodb/`                                                | MongoDB tak dipakai (semua Postgres)                                             | Hapus                                                                                                            |
| RabbitMQ di `docker-compose.yml`                                | Di-comment                                                                       | **Aktifkan** + pasang `infra/rabbitmq/definitions.json` (exchanges, queues, DLX)                                 |
| WAHA `WHATSAPP_SESSIONS_POSTGRESQL_URL`                         | Menunjuk `localhost` + password hardcoded                                        | Ubah ke service `postgres` + ambil dari env, jangan hardcode                                                     |
| Traefik vs Nginx                                                | Dua-duanya ada                                                                   | Pilih **Nginx** (sesuai brief), arsipkan/hapus Traefik                                                           |
| Monitoring stack                                                | Volumes & services di-comment                                                    | Aktifkan (prometheus/grafana/loki/promtail)                                                                      |
| Typesense                                                       | Belum ada                                                                        | **Tambahkan** service + config                                                                                   |
| `.env.example`                                                  | Minim (belum ada var channel/AI/payment/typesense/centrifugo)                    | Lengkapi semua env                                                                                               |

### ❌ Belum ada (dibangun sesuai roadmap)

- Semua domain messaging (channels, contacts, conversations, messages, labels, quick replies).
- Worker processes (normalizer, dispatcher, ai, media, search, notification).
- Channel adapters (WAHA, Meta, Telegram).
- AI layer (`packages/ai`), Typesense integration.
- Billing/entitlements + payment gateways.
- Webchat widget, linkchat.
- Chat portal UI + admin panel + landing page.
- Mobile app (Fase 5).

---

## 19. Katalog Fitur Lengkap

Konsolidasi semua fitur dari brief + tambahan rekomendasi. Detail eksekusi per-fase di [`ROADMAP.md`](./ROADMAP.md).

### A. Manajemen & Admin

- Multi-tenant + RBAC (Owner/Supervisor/Agent) + Super Admin platform.
- Division/Group (kelompok supervisor + agent + channel).
- Channel management (add/edit — Owner only) dengan limit subscription.
- Manajemen Supervisor & Agent (CRUD — Owner).
- Manajemen Kontak (Edit, Block, Delete, Export CSV) + label channel.
- Label management (unik per tenant, dibuat Owner/Supervisor/Agent).
- Quick reply / balas cepat (text, text+image, text+video) dengan shortcut.
- Auto-response per channel (Owner/Supervisor).
- Working hours (Owner/Supervisor).
- Auto-reject call + auto-response (WAHA).
- Blocked contacts.
- Webhook management untuk integrasi channel.
- Audit log.

### B. Percakapan (Chat Portal Web)

- Conversation room realtime.
- Auto-assign (round-robin, percentage, least-busy).
- Manual re-assign / keluarkan agent (Owner/Supervisor); agent self-unassign → unassigned.
- Mark completed/uncompleted; archive/unarchive.
- Label percakapan.
- Emoji input; "/" untuk quick-reply picker.
- Media input (image, video, document, camera, location); audio recorder.
- Bubble UI auto-detect format (text, media, link-preview, template, location, dll).
- Menu per-pesan: reply, forward, delete, edit (own), pin/unpin.
- Pinned conversations (sidebar) & pinned messages (room).
- Filter: channel/label (agent), agent (owner/supervisor), date-range, search.
- Badge unread per-percakapan + total; badge label & status.

### C. AI & Growth

- AI Agent auto-reply (multi-provider, metered credits).
- Webchat floating bubble (embed script) + AI bot (RAG).
- Linkchat (share link group, mirip wa.me).

### D. Billing & Komersil

- Plans (Free/Pro) + add-on (slot & credits).
- Entitlements enforcement.
- Payment: Xendit → Midtrans → PayPal.
- Invoice checkout page + realtime webhook status.
- Subscription expiry worker.

### E. Landing Page (Frontend Publik)

- Home, About, Contact, Privacy, Terms, Blog, Help Center, Career, Roadmap, Documentation.
- i18n (EN + ID).
- Payment checkout invoice page (realtime).

### F. Mobile (React Native — Fase 5, chat-only)

- List & room percakapan (mirip WhatsApp).
- Swipe gestures (geser kanan = forward, kiri = reply).
- Contact & label management per agent.
- Account settings.
- Push notification (FCM).

---

_Dokumen ini akan di-update seiring keputusan baru. Perubahan arsitektur besar harus masuk [Decision Log](#1-decision-log)._
