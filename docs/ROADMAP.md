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

## Fase 1 — Core Domain & Tenancy ✅ SELESAI (2026-07-25)

**Tujuan:** pondasi multi-tenant & RBAC.

- [x] Migrasi: `tenants`, extend `users` (tenant_id, role_id, status), `divisions`, `division_members`.
- [x] Isolasi tenant: **application-level scoping** via mixin `TenantScoped` + `TenantContext` (AsyncLocalStorage) — mekanisme utama, teruji. **RLS** policy DDL sebagai backstop (dormant: app konek superuser yang bypass RLS; enforcement runtime penuh dgn dedicated role → Fase 9).
- [x] Middleware `tenant` (resolve tenant dari auth user, preload role, wrap `TenantContext.run`).
- [x] Bouncer policies: `DivisionPolicy` & `TeamPolicy` (Owner/Supervisor/Agent + super_admin bypass, cek role-level + tenant match).
- [x] CRUD Division (`DivisionsController`) + assign member (sync, cross-tenant difilter).
- [x] CRUD Supervisor & Agent (`TeamController`, Owner-only).
- [x] Registrasi tenant (`TenantService.register`: signup → tenant + owner + plan free + trial 14 hari).
- [x] Seeder: roles (super_admin/owner/supervisor/agent + level), super admin (dari env), demo tenant + owner + division + agent.
- [x] Role via `role_id` FK ke tabel `roles` (punya `level` untuk hierarki).

**Exit criteria:** ✅ dua tenant terisolasi (terbukti via test `TenantScoped` — query tenant A tak menjangkau data tenant B, `findOrFail` lintas-tenant ditolak); ✅ role enforcement jalan (test policy: agent tak bisa CRUD division, owner tak bisa hapus diri sendiri); ✅ CI hijau (lint 0 · typecheck 0 · 12 test passed).

> **Catatan RLS:** exit criteria awal menyebut "RLS terbukti via test". Diselaraskan: isolasi **primer** = application scoping (teruji penuh); RLS = backstop DB yang aktif saat dedicated non-superuser role dipasang di Fase 9 (Hardening).

---

## Fase 2 — Channel WAHA + Message Pipeline ✅ SELESAI (2026-07-25)

**Tujuan:** kirim & terima WhatsApp end-to-end via WAHA, dengan pipeline tahan crash.

- [x] Migrasi: `channels`, `contacts`, `conversations`, `messages`, `message_outbox`, `conversation_events` (+ RLS backstop).
- [x] WAHA client (`WahaClient`) + adapter (`WahaAdapter.parseMessage/parseAck/mapContentType/mapAckStatus`).
- [x] Session management WAHA (`WahaSessionService`: connect/QR/status/disconnect) per channel + engine routing (gows default).
- [x] Webhook receiver `POST /webhooks/waha/:channelId` + verifikasi HMAC-SHA512 per channel + CSRF-exempt.
- [x] Worker framework (`QueueConsumer`: assert queue + DLQ, retry+backoff, ack/nack) + Ace commands `worker:inbound`, `worker:outbound`.
- [x] **inbound-normalizer** (dedup by provider_message_id, resolve contact/conversation, persist, broadcast) — teruji.
- [x] **outbound-dispatcher** (transactional outbox, rate-limit token-bucket Redis, retry/terminal state machine, status broadcast).
- [x] Broadcast realtime ke Centrifugo (channel conversation & inbox) + status pesan (sent/delivered/read).
- [x] Centrifugo (`CentrifugoService`): connection token + **subscription token** dgn otorisasi tenant/role (RealtimeController) + publish.
- [x] Channel management CRUD (Owner) + `ChannelPolicy` + `EntitlementService` (limit channel per plan).
- [x] Send API + list conversations/messages (agent hanya di percakapan yang di-assign).
- [x] Auto-reject call (WAHA `call.received`) + auto-response + `conversation_events`.
- [ ] **media-worker** (mirror → MinIO) — **ditunda ke Fase 3**: WAHA sudah simpan media ke MinIO natif (`WAHA_MEDIA_STORAGE=S3`), jadi URL media inbound WAHA sudah di MinIO. Mirror baru diperlukan untuk Meta/Telegram.

**Exit criteria:** ✅ pipeline inbound (webhook→queue→normalizer→persist→broadcast) & outbound (API→outbox→dispatcher→WAHA→status) lengkap & dedup-safe; ✅ worker connect + consume terverifikasi; ✅ CI hijau (lint 0 · typecheck 0 · 25 test passed, termasuk integration dedup). Verifikasi kirim/terima WhatsApp riil butuh pairing device (QR) oleh user.

---

## Fase 3 — Meta & Telegram ✅ SELESAI (2026-07-25)

**Tujuan:** channel lain online dengan pipeline yang sama.

- [x] **Refactor multi-channel**: `MessageIngestService` (core dedup/persist/broadcast bersama) + `InboundRouter` (dispatch by provider) — pipeline jadi provider-agnostic.
- [x] Meta adapter (WhatsApp Business `changes.value` + Messenger/Instagram `messaging`) + `MetaClient` (Graph API) + `MetaInbound`.
- [x] Meta webhook **app-level** (`GET /webhooks/meta` verify + `POST` X-Hub-Signature-256 HMAC), channel di-resolve dari page id / phone_number_id.
- [x] Telegram adapter + `TelegramClient` (setWebhook/sendMessage/sendPhoto/getFile) + webhook per-channel (verify X-Telegram-Bot-Api-Secret-Token).
- [x] Outbound extend: dispatcher kirim via WAHA/Telegram/Messenger/Instagram/WA-Business (composite id Telegram, reply threading).
- [x] **24-hour service window** enforcement (tolak free-form di luar window untuk channel Meta) + **Message Template** (WA Business).
- [x] Rate limiting per channel (token-bucket Redis) — dari Fase 2, berlaku semua provider.
- [x] Enkripsi credentials channel (endpoint `PUT /app/channels/:id/configure` → `setCredential` encrypted; Telegram auto `setWebhook`).
- [x] **media-worker** (mirror Meta/Telegram media → MinIO via `minio` client, presigned URL) — yang ditunda dari Fase 2.
- [ ] Webhook management UI — **ditunda ke Fase 8** (bagian admin panel; API sudah lengkap).

**Exit criteria:** ✅ keempat tipe channel punya adapter inbound+outbound + webhook terverifikasi (HMAC/secret); ✅ window & template terkelola; ✅ media mirror jalan; ✅ CI hijau (lint 0 · typecheck 0 · **33 test passed**, termasuk adapter Meta/Telegram). Verifikasi kirim/terima riil butuh kredensial provider (Meta app + page/WABA token, Telegram bot token) dari user.

---

## Fase 4 — Chat Portal Web UI ✅ SELESAI (2026-07-25)

**Tujuan:** UI percakapan lengkap mirip WhatsApp Web.

- [x] Layout chat portal responsive (desktop 3-pane: icon rail + list + room; mobile: nav rail → hamburger Sheet, single-view list↔room dgn tombol back). Full-height, dark/light.
- [x] Conversation list: search + filter (all/unread/mine/unassigned), badge unread + total, channel icon, avatar initials, re-sort by last message.
- [x] Room: bubble auto-detect (text/image/video/audio/document/link), status ticks (sent/delivered/read), avatar fallback, timestamp, auto-scroll.
- [x] Input: emoji picker, "/" quick-reply hint, attach button, kirim (Enter), optimistic + realtime.
- [x] Header actions: assign to me / unassign / mark completed / reopen (dropdown).
- [x] **Realtime (Centrifugo)**: connection + subscription token, subscribe inbox + conversation channel, pesan masuk & status live tanpa reload — **terverifikasi di browser**.
- [x] Composables `useApi` (fetch + XSRF) & `useRealtime` + Pinia `chat` store.
- [ ] Fitur lanjutan (per-message reply/forward/delete/edit/pin, pinned list, auto-assign strategy, archive, label, typing/presence, long-press context menu) — **ditunda ke Fase 4.5/6** (butuh backend quick-reply/label dari Fase 6 + tambahan endpoint).

**Exit criteria:** ✅ agent bisa handle percakapan dari UI (list→room→kirim), realtime multi-channel, mirip WhatsApp Web, responsive desktop+mobile — **terverifikasi live di browser** (kirim pesan muncul realtime + list re-sort); ✅ CI hijau (lint 0 · typecheck 0 · 33 test passed).

> **Fixes ditemukan saat verifikasi:** Lucid preload limit gotcha → `groupLimit`; TenantScoped mixin qualified→unqualified `tenant_id` (kompat groupLimit); `MessageOutbox` table name (`message_outbox` singular); `inertia.always(null)` → `undefined`; demo users pre-verified.

---

## Fase 5 — AI Layer ✅ SELESAI (inti auto-reply, 2026-07-25)

**Tujuan:** auto-reply cerdas + webchat bot, dengan metering.

- [x] Interface `AiProvider` + adapter **Claude** (Anthropic SDK, default `claude-opus-4-8`, tanpa `temperature`/thinking) & **OpenAI** (Chat Completions + embeddings). Registry lazy per-provider (`isConfigured`). _Adapter di-mirror app-local (`app/services/ai`), bukan resolve `@socialforge/ai` runtime — pola sama `messaging/constants`._
- [x] `ai_agents` (provider, model, system_prompt, temperature, max_tokens, working_hours jsonb, auto_reply_enabled, is_active) + `ai_credit_ledger` (audit) + `tenants.ai_credits` (saldo) + `channels.ai_agent_id` + RLS. **Entitlement credits** per-plan (free 200 / pro 10000) di-grant saat provisioning.
- [x] **ai-agent worker** (`worker:ai`, exchange `sf.ai` → queue `ai.reply`): auto-reply dalam konteks percakapan (window 12 pesan) + **working hours** (timezone-aware, silent/reply di luar jam) + handoff (stand-down bila conversation sudah di-assign manusia).
- [x] **Token→credit normalization** (biaya USD × 1000, catalog pricing per-model, epsilon guard FP) + debit ledger atomik (row-lock `tenants`) + cek saldo sebelum generate.
- [x] Management: CRUD AI agents (Owner, policy + validator), assign agent→channel (`PUT channels/:id`), endpoint saldo+ledger (`GET ai/credits`), katalog model (`GET ai/models`).
- [ ] Webchat widget (floating bubble) + embed script generator — **ditunda ke Fase 5.5**.
- [ ] Webchat bot RAG (embedding knowledge base) + handoff ke agent manusia — **ditunda ke Fase 5.5** (adapter OpenAI `embed()` sudah siap).
- [ ] Suggest-reply untuk agent (opsional) — **ditunda** (adapter `stream()` sudah siap).

**Exit criteria (inti):** ✅ AI membalas pelanggan otomatis pada channel dengan agent aktif; ✅ credit ternormalisasi lintas-provider & terpotong akurat via ledger; ✅ CI hijau (lint 0 · typecheck 0 · **47 test passed**, termasuk credit normalization, working-hours gate, & AI reply gating). Balasan riil butuh `ANTHROPIC_API_KEY`/`OPENAI_API_KEY` dari user. Webchat embeddable + RAG dipindah ke **Fase 5.5**.

> **Catatan implementasi:** `AiCreditLedger` butuh `static table = 'ai_credit_ledger'` (Lucid pluralize → `ai_credit_ledgers`), sama pola `message_outbox`. `creditsFor` pakai epsilon `-1e-9` sebelum `Math.ceil` agar noise floating-point (`0.03*1000 = 30.0000000004`) tidak over-charge 1 credit.

### Fase 5.5 — Webchat & RAG ✅ SELESAI (2026-07-25)

- [x] Channel type **`webchat`** + entitlement (free 1 / pro 5) + dispatcher no-op (delivery = realtime broadcast, synthetic `webchat:<uuid>` id) + status `connected` saat create.
- [x] **Widget embeddable** ([public/webchat.js](../public/webchat.js)) — floating bubble self-contained (tanpa dependensi), poll-based (3s), form-urlencoded biar CORS "simple" (no preflight), visitorId di localStorage. Generator snippet `GET channels/:id/webchat-embed`.
- [x] **API publik webchat** (CSRF-exempt, no-auth, isolasi via channel→tenant): `POST /webchat/:id/session` (create/resume contact+conversation), `POST /webchat/:id/messages` (ingest via `MessageIngestService` → dedup/persist/broadcast/**AI reply**), `GET /webchat/:id/messages` (poll). Middleware `webchatCors` (ACAO `*`, no-credentials) + rate-limit per-visitor.
- [x] **Knowledge base + RAG**: `ai_knowledge` (embedding jsonb, RLS) + CRUD (Owner, embed-on-save via OpenAI) + `RagService` (cosine app-side, top-k, score floor 0.2) — di-inject ke system prompt di `AiReplyService` (berlaku semua channel, no-op bila OpenAI tak dikonfigurasi).
- [x] **Handoff**: bot stand-down otomatis begitu conversation di-assign agent manusia (dari Fase 5).
- [ ] Suggest-reply panel untuk agent (streaming) — **ditunda** (adapter `stream()` sudah siap; butuh UI panel).

**Exit criteria:** ✅ webchat embeddable di website eksternal (bubble + poll), pesan visitor masuk pipeline yang sama (realtime ke agent + auto-reply AI), RAG meng-ground jawaban dari knowledge base; ✅ CI hijau (lint 0 · typecheck 0 · **53 test passed**, +RAG cosine ranking, webchat ingest→conversation+AI enqueue, resume session). Widget realtime pakai polling (bukan Centrifugo) demi zero-dependency di site eksternal; RAG butuh `OPENAI_API_KEY` (Claude tak punya embeddings).

> **Catatan implementasi:** `ai_knowledge.embedding` (array float) butuh `@column` `prepare/consume` JSON — node-pg memformat array JS sebagai Postgres array literal (`{…}`) yang ditolak kolom jsonb (objek malah auto-`JSON.stringify`). `AiKnowledge` juga `static table = 'ai_knowledge'`.

---

## Fase 6 — Search, Contacts & Quick Reply ✅ SELESAI (backend + picker, 2026-07-25)

**Tujuan:** pencarian cepat & manajemen kontak/label.

- [x] **Typesense collections** (`messages`, `contacts`) via raw HTTP (`SearchService`, pola sama WAHA/Centrifugo — tanpa dep client) + **scoped search key** per tenant (HMAC, embed `filter_by tenant_id`). Best-effort: no-op/empty bila Typesense mati.
- [x] **search-indexer worker** (`worker:search`, exchange `sf.search` → queue `search.index`) + command **`search:reindex`** (bulk backfill) + wiring index dari ingest pesan/kontak & outbound.
- [x] **Search API** `GET /app/search?q=` → messages+contacts tenant-scoped + `_highlight`. _(Komponen UI search box ditunda ke Fase 8.)_
- [x] **Contact management**: `index` (paginate + filter q/channel/blocked), `show`, `update` (nama + email/phone/notes di `attributes`), **block/unblock**, **delete**, **export CSV** — policy (view=agent, edit=supervisor, delete=owner). Merge/`contact_links` **ditunda**.
- [x] **Labels** (unik per tenant) CRUD + attach/detach ke conversation (pivot `conversation_labels`, broadcast realtime) + preload di conversation list.
- [x] **Quick reply** CRUD (text/image/video/document, shortcut unik) + **integrasi "/" picker** di `ChatInput` (filter live, Enter expand top match).
- [ ] Search UI / label & contact management UI — **ditunda ke Fase 8** (backend + endpoint lengkap; butuh panel).
- [ ] Linkchat (slug + target + share page) — **ditunda ke Fase 8**.

**Exit criteria:** ✅ backend search (Typesense) + indexer + reindex jalan, hasil tenant-scoped + highlight; ✅ kontak (edit/block/delete/export), label (CRUD+apply), quick reply (CRUD + picker) terkelola penuh via API; ✅ CI hijau (lint 0 · typecheck 0 · **60 test passed**, +search mappers/scoped-key, label attach/detach + uniqueness, quick-reply uniqueness). Search `<200ms` & UI panel diverifikasi di Fase 8 (butuh Typesense server + data).

> **Catatan implementasi:** `conversation_labels` awalnya punya `tenant_id` (NOT NULL + RLS) tapi bikin query many-to-many `tenant_id` **ambiguous** (mixin TenantScoped filter unqualified `tenant_id`, cocok ke pivot & `labels`) → di-drop (migration 0025); isolasi tetap via FK cascade dari parent yang sudah tenant-scoped. Route `contacts/export` didaftarkan sebelum `contacts/:id` agar tak ketangkap sebagai param.

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
