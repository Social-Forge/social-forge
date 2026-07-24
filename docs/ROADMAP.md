# Social Forge — Execution Roadmap

> Rencana eksekusi bertahap. Referensi arsitektur: [`ARCHITECTURE.md`](./ARCHITECTURE.md).
>
> Prinsip urutan: **API/backend matang dulu → Web App → komersil → Mobile** (Decision D11).
> Setiap fase punya _exit criteria_ yang jelas sebelum lanjut ke fase berikutnya.

---

## Ringkasan Fase

| Fase   | Fokus                     | Output Utama                                        |
| ------ | ------------------------- | --------------------------------------------------- |
| **0**  | Fondasi infra & cleanup   | Docker stack lengkap & rapi, monorepo skeleton, env |
| **1**  | Core domain & tenancy     | Multi-tenant, RBAC, division, migrasi data inti     |
| **2**  | Channel WAHA + pipeline   | Kirim/terima WA end-to-end, worker, outbox          |
| **3**  | Meta & Telegram           | WA Business, Messenger, IG, Telegram                |
| **4**  | Chat Portal Web UI        | Conversation room realtime, semua fitur chat        |
| **5**  | AI Layer                  | Multi-provider, auto-reply, webchat bot, credits    |
| **6**  | Search & Contacts         | Typesense, kontak, label, quick reply               |
| **7**  | Billing & Komersil        | Plans, entitlements, Xendit, invoice                |
| **8**  | Landing & Admin polish    | Landing page i18n, admin panel, super admin         |
| **9**  | Observability & Hardening | Monitoring, security, load test, prod deploy        |
| **10** | Mobile (React Native)     | App chat-only + push notif                          |

---

## Fase 0 — Fondasi Infra & Cleanup ✅ SELESAI (2026-07-25)

**Tujuan:** infrastruktur development berjalan mulus & bersih dari warisan template.

- [x] Aktifkan **RabbitMQ** di `docker-compose.yml` + `enabled_plugins` (management + prometheus). _Deviasi: topology (exchanges `sf.inbound/outbound/ai/media/search/notifications` + `sf.dlx`) di-assert dari kode (`app/services/messaging/`), bukan `definitions.json` — lebih robust & survive broker restart._
- [x] Tambahkan **Typesense** service + config (`config/typesense.ts`) + healthcheck.
- [x] Aktifkan monitoring: **Prometheus, Grafana, Loki, Promtail** (profile `monitoring`; Grafana host port 3003 karena 3000-3002 dipakai WAHA).
- [x] **Cleanup warisan template:**
  - [x] Hapus `infra/mongodb/` + blok env MongoDB.
  - [x] Grafana dashboards proxy sudah dibersihkan (tinggal `infra.json`).
  - [x] Rewrite `rabbitmq_publisher_service.ts` → `app/services/messaging/rabbitmq.ts` (publisher generik) + `topology.ts`.
  - [x] Pilih **Nginx** (hapus `infra/traefik/`).
  - [x] Bersihkan sisa `proxy/healthcheck` di `env.ts`, `.env`, `prometheus.yml`, `nginx`, `rabbitmq.conf`, branding "Residential Proxy".
- [x] Perbaiki WAHA env (`WHATSAPP_SESSIONS_POSTGRESQL_URL` → service `postgres`; fallback compose fail-fast).
- [x] Lengkapi `.env.example` (semua var: DB, Redis, RabbitMQ, MinIO, Centrifugo, Typesense, WAHA, Meta, Telegram, AI providers, payment).
- [x] Setup `packages/shared` & `packages/ai` sebagai pnpm workspace.
- [x] Health endpoint `/health` (DB, Redis, RabbitMQ, MinIO, Centrifugo, Typesense) — **semua service UP** ✅.
- [x] CI dasar: lint + typecheck + test (`.github/workflows/ci.yml`).
- [x] **Perbaikan bonus (blocker yang ditemukan):** install driver `pg`, regenerate `database/schema.ts` (RoleSchema), hapus `cacheCollector` prometheus, normalisasi line-ending (`.gitattributes` + `pnpm format`), fix lint shadow & vue-tsc.

**Exit criteria:** ✅ `docker compose up` menyalakan seluruh stack sehat; ✅ `/health` hijau (6/6 service UP); ✅ CI hijau lokal (lint 0 · typecheck 0 · 3 test passed).

---

## Fase 1 — Core Domain & Tenancy

**Tujuan:** pondasi multi-tenant & RBAC.

- [ ] Migrasi: `tenants`, extend `users` (tenant_id, role, status), `divisions`, `division_members`.
- [ ] **RLS** policies pada tabel ber-tenant + middleware set `app.current_tenant`.
- [ ] Middleware `tenant` (resolve tenant dari user/subdomain) + scoping helper.
- [ ] Bouncer policies: Owner/Supervisor/Agent/SuperAdmin.
- [ ] CRUD Division + assign member.
- [ ] CRUD Supervisor & Agent (Owner).
- [ ] Registrasi tenant (signup → buat tenant + owner + plan free).
- [ ] Seeder: super admin, tenant demo, roles.

**Exit criteria:** dua tenant terisolasi penuh (RLS terbukti via test); role enforcement jalan.

---

## Fase 2 — Channel WAHA + Message Pipeline

**Tujuan:** kirim & terima WhatsApp end-to-end via WAHA, dengan pipeline tahan crash.

- [ ] Migrasi: `channels`, `contacts`, `conversations`, `messages`, `message_outbox`, `conversation_events`.
- [ ] WAHA adapter: `parseInbound`, `sendOutbound`, `verifyWebhook`, `mapStatus`.
- [ ] Session management WAHA (start/stop/QR pairing) per channel + engine routing (gows/noweb/webjs).
- [ ] Webhook receiver `/webhooks/waha/:channelId` + signature.
- [ ] **inbound-normalizer** worker (dedup, normalisasi, persist, broadcast).
- [ ] **outbound-dispatcher** worker (outbox, rate-limit, retry/backoff, status).
- [ ] **media-worker** (mirror media → MinIO).
- [ ] Broadcast realtime ke Centrifugo (channel conversation & inbox).
- [ ] Centrifugo JWT auth + subscribe authorization proxy.
- [ ] Auto-reject call (WAHA) + auto-response.

**Exit criteria:** chat masuk dari WA muncul realtime; balasan agent terkirim & status delivered; worker survive restart tanpa pesan hilang/dobel.

---

## Fase 3 — Meta & Telegram

**Tujuan:** channel lain online dengan pipeline yang sama.

- [ ] Meta adapter (WhatsApp Business, Messenger, Instagram) — Graph API + webhook + HMAC.
- [ ] Handling **24-hour service window** + Message Template.
- [ ] Telegram adapter (Bot API, webhook mode).
- [ ] Rate limiting per channel (token bucket Redis).
- [ ] Enkripsi credentials channel (token).
- [ ] Webhook management UI (setup URL, verify token, status).

**Exit criteria:** keempat tipe channel bisa kirim/terima; window & template terkelola; semua webhook terverifikasi.

---

## Fase 4 — Chat Portal Web UI

**Tujuan:** UI percakapan lengkap mirip WhatsApp Web.

- [ ] Layout chat portal (sidebar list + room + panel info).
- [ ] Conversation list: filter (channel/label/agent/date/search), badge unread, status, pinned.
- [ ] Room: bubble auto-detect format (text/media/link-preview/location/template), avatar fallback, timestamp.
- [ ] Input: emoji, "/" quick-reply picker, media (image/video/doc/camera/location), audio recorder.
- [ ] Menu per-pesan: reply, forward, delete, edit (own), pin/unpin.
- [ ] Pinned message (room) & pinned conversation (sidebar).
- [ ] Auto-assign (round-robin/percentage/least-busy) + manual re-assign/unassign.
- [ ] Mark complete/uncomplete, archive/unarchive, label conversation.
- [ ] Typing & presence indicator (Centrifugo).
- [ ] Long-press context menu (delete, unassign, block, mark, label, archive).

**Exit criteria:** agent bisa handle percakapan penuh dari UI, realtime, multi-channel, mirip WhatsApp Web.

---

## Fase 5 — AI Layer

**Tujuan:** auto-reply cerdas + webchat bot, dengan metering.

- [ ] `packages/ai`: interface `AiProvider` + adapter Claude & OpenAI.
- [ ] `ai_agents`, `ai_knowledge`, `ai_credit_ledger`, entitlement credits.
- [ ] **ai-agent worker**: auto-reply dalam konteks percakapan + working hours.
- [ ] Token→credit normalization + debit ledger + cek saldo.
- [ ] Webchat widget (floating bubble) + embed script generator.
- [ ] Webchat bot RAG (embedding knowledge base) + handoff ke agent manusia.
- [ ] Suggest-reply untuk agent (opsional).

**Exit criteria:** AI membalas pelanggan otomatis, credit terpotong akurat, webchat embeddable di website eksternal.

---

## Fase 6 — Search, Contacts & Quick Reply

**Tujuan:** pencarian cepat & manajemen kontak/label.

- [ ] Typesense collections (`messages`, `contacts`, `conversations`) + scoped keys per tenant.
- [ ] **search-indexer worker** + command `search:reindex`.
- [ ] Search UI (fuzzy, filter, highlight).
- [ ] Contact management (Edit, Block, Delete, Export CSV) + merge manual (contact_links).
- [ ] Label management (unik per tenant) + apply ke conversation.
- [ ] Quick reply CRUD (text/image/video) + integrasi "/" picker.
- [ ] Linkchat (slug + target + share page).

**Exit criteria:** cari pesan/kontak <200ms; kontak & label & quick reply terkelola penuh.

---

## Fase 7 — Billing & Komersil

**Tujuan:** siap dijual.

- [ ] `plans`, `subscriptions`, `subscription_addons`, `entitlements`, `invoices`, `payment_events`.
- [ ] Entitlement engine + enforcement di semua titik (channel/agent/AI/quick-reply).
- [ ] Payment gateway abstraction + **Xendit** adapter (invoice, webhook, verify).
- [ ] Checkout flow + invoice page realtime (Centrifugo webhook status).
- [ ] **billing/scheduler worker**: expiry, downgrade, reset kuota, reminder.
- [ ] Add-on purchase (slot & AI credits).
- [ ] (Menyusul) Midtrans & PayPal adapter.

**Exit criteria:** tenant bisa upgrade ke Pro & beli add-on via Xendit; entitlement aktif otomatis pasca-bayar; expiry berjalan.

---

## Fase 8 — Landing Page & Admin Polish

**Tujuan:** wajah publik & panel admin.

- [ ] Landing: Home, About, Contact, Privacy, Terms, Blog, Help Center, Career, Roadmap, Documentation.
- [ ] i18n EN + ID (landing + app).
- [ ] Admin panel (tenant): dashboard, settings, channel, division, member, billing.
- [ ] Super Admin panel (platform): kelola tenant, plan, billing global, metrics.
- [ ] Auto-response & working hours UI.

**Exit criteria:** landing lengkap dwibahasa; admin & super-admin operasional.

---

## Fase 9 — Observability & Hardening

**Tujuan:** siap production.

- [ ] Grafana dashboards SocialForge (throughput, channel health, queue depth, billing, AI usage).
- [ ] Sentry/GlitchTip integrasi.
- [ ] Audit log lengkap.
- [ ] Security pass: RLS audit, secret encryption, webhook verify, rate limits, CAPTCHA (Turnstile) signup/webchat.
- [ ] `docker-compose.prod.yml` + Nginx TLS + CI/CD deploy.
- [ ] Backup (pg_dump terjadwal + MinIO).
- [ ] Load test (target ribuan chat/hari/tenant) + tuning prefetch/rate-limit.

**Exit criteria:** deploy ke Ubuntu server; monitoring & alert jalan; lolos load test.

---

## Fase 10 — Mobile (React Native)

**Tujuan:** app chat-only untuk agent.

- [ ] Setup `apps/mobile` (React Native) + share types via `packages/shared` & Tuyau client.
- [ ] Auth JWT (access/refresh) + Centrifugo realtime.
- [ ] List & room percakapan (mirip WhatsApp mobile).
- [ ] Swipe gestures (kanan=forward, kiri=reply), long-press menu.
- [ ] Contact & label management per agent, account settings.
- [ ] Push notification (FCM).

**Exit criteria:** agent bisa handle chat penuh dari HP dengan notifikasi realtime.

---

## Catatan Cross-Cutting (berlaku semua fase)

- **Testing**: Japa (unit + functional) untuk tiap domain; e2e untuk flow kritis.
- **Migrasi aman**: additive-first, hindari breaking di production.
- **Type-safety**: shared Zod/TS types di `packages/shared`; Tuyau untuk API contract.
- **Idempotensi & dedup**: wajib di setiap integrasi eksternal (channel & payment).
- **Dokumentasi**: update `ARCHITECTURE.md` Decision Log tiap keputusan baru.

---

## Item yang Perlu Konfirmasi Sebelum Fase Terkait

1. **Free tier WhatsApp** — diasumsikan 0 WA (brief tak menyebut). _(Fase 7)_
2. **Besaran AI credits** & konversi token→credit per model. _(Fase 5/7)_
3. **Harga plan & add-on** (angka final). _(Fase 7)_
4. **Domain & branding** (nama produk final; "SocialForge" dipakai sebagai codename dari config existing). _(Fase 8)_
5. **Nginx vs Traefik** — default Nginx; konfirmasi untuk hapus Traefik. _(Fase 0)_
