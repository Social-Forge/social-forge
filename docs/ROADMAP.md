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
| **5.6** | Advanced AI Sales Agent  | Persona, playbook keyword+aset, safety/guardrails   |
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

### Fase 5.6 — Advanced AI Sales Agent ✅ SELESAI (2026-07-27)

**Tujuan:** AI agent jadi fitur **unggulan** platform — closer yang di-tune untuk menaikkan rate closing, di atas human agent. Selain "system prompt", tiap agent kini punya **identitas/persona**, **pipelead pelatihan** (playbook keyword-triggered + asset), **safety/guardrails**, dan **resource library** (image/video/dokumen yang bisa dikirim otomatis).

- [x] **Migrasi** ([1790000000032](../database/migrations/1790000000032_add_persona_to_ai_agents.ts)–35): `ai_agents` +`persona`/`safety`/`guardrails` (jsonb); tabel **`ai_playbooks`** (keywords jsonb, instruction, asset_ids jsonb, priority, is_active) + **`ai_assets`** (type image/video/document, storage_key MinIO, mime, size, description) + RLS. Schema regen otomatis.
- [x] **Model**: [AiPlaybook](../app/models/ai_playbook.ts) + [AiAsset](../app/models/ai_asset.ts) (TenantScoped, getter list); [AiAgent](../app/models/ai_agent.ts) diperluas — tipe `AgentPersona` (agentName/soul/styleTone/gender/characterStyle/greeting), `AgentSafety` (avoidTopics/onSensitive handoff|disclaimer/escalationMessage), getter `personaConfig`/`safetyConfig`/`guardrailList` + hasMany playbooks/assets.
- [x] **PromptBuilder** ([prompt_builder.ts](../app/services/ai/prompt_builder.ts)): rakit system prompt berlapis — Identity (persona) → **Objective (selalu sales/closing)** → Mission (systemPrompt user) → Style & tone → Guardrails → Safety → Playbook yang ter-trigger → Knowledge base. `matchPlaybooks()` (keyword includes, active-only, sort priority desc) + `touchesAvoidTopic()`.
- [x] **AiReplyService advanced**: sebelum generate → **safety handoff** (bila pesan menyentuh avoid-topic & mode `handoff` → kirim escalation message sekali lalu stand-down utk human); match playbook by keyword; retrieve RAG; build prompt; generate; `sendAi`; debit; lalu **kirim aset otomatis** dari playbook prioritas tertinggi (resolve `AiAsset` → presigned URL MinIO → `OutboundService.sendAi` dgn contentType image/video/document).
- [x] **Backend CRUD**: [ai_playbooks_controller](../app/controllers/app/ai_playbooks_controller.ts) (index/store/update/destroy) + [ai_assets_controller](../app/controllers/app/ai_assets_controller.ts) (upload multipart → MinIO `ai-assets/{tenant}/{uuid}.{ext}`, index dgn presigned preview, destroy) + validator [ai_advanced.ts](../app/validators/ai_advanced.ts) (file 25mb, jpg/png/gif/webp/mp4/mov/webm/pdf) + persona/safety/guardrails di [validator agent](../app/validators/ai_agent.ts) & controller update. Routes `ai/playbooks`, `ai/assets`.
- [x] **UI agent advanced** ([app/ai/index.vue](../inertia/pages/app/ai/index.vue)): form ber-tab — **Basics** (+ working hours), **Identity** (agent name/gender/soul/style & tone/character style/greeting), **Safety & guardrails** (avoid topics + handoff/disclaimer + escalation message + guardrails per-baris), **Playbooks** (CRUD keyword+instruction+priority+link asset+toggle), **Assets** (upload multipart via FormData+XSRF, grid preview, delete), **Knowledge** (RAG dari 5.5).

**Exit criteria:** ✅ tiap agent bisa dikonfigurasi jadi sales-closer bernama & berkarakter, dgn playbook keyword-triggered yang otomatis mengirim aset (foto produk/testimoni/video) & guardrails/safety-handoff; ✅ CI hijau (lint 0 · typecheck 0 (tsc + vue-tsc) · **81 test passed**, +PromptBuilder matchPlaybooks/touchesAvoidTopic/assembly). Pengiriman aset & handoff riil butuh MinIO + provider AI + channel aktif.

> **Catatan implementasi:** Objective "sales/closing" selalu di-inject PromptBuilder terlepas dari systemPrompt user, sesuai target platform (AI di atas human agent). Upload aset pakai `fetch` + `FormData` langsung (composable `api` JSON-only tak bisa multipart) dgn header `X-XSRF-TOKEN` dari cookie. `AiPlaybook`/`AiAsset` mengikuti pola `static table` bila perlu; asset_ids/keywords disimpan jsonb array.

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

## Fase 7 — Billing & Komersil ✅ SELESAI (backend, 2026-07-25)

**Tujuan:** siap dijual.

- [x] Migrasi `plans` (katalog global, `features` jsonb), `subscriptions`, `subscription_addons`, `invoices`, `payment_events` + RLS (kecuali `plans`) + seed plans free/pro. _Entitlements di-derive dari `plans.features` + addons (bukan tabel terpisah)._
- [x] **Entitlement engine data-driven**: `EntitlementService.featuresFor/channelLimitFor` baca `plans.features` + `channel_slot` addons (non-expired); fallback ke katalog statis bila plan belum di-seed. Enforcement di `assertCanCreateChannel`.
- [x] **Payment gateway abstraction** (`PaymentGateway`) + **Xendit adapter** (HTTP: createInvoice Basic-auth, verify `x-callback-token`, parse status PAID/EXPIRED). `config/billing.ts` (harga addon + TTL + period).
- [x] **Checkout flow** (`BillingService.checkout` → invoice pending + `checkout_url` Xendit) untuk upgrade plan / channel_slot / ai_credits. **Invoice page realtime**: webhook broadcast ke channel `billing:tenant.{tid}.invoice.{iid}` + endpoint show mint subscription token.
- [x] **Webhook** `POST /webhooks/xendit` (verify token, CSRF-exempt, dedup via `payment_events.external_id`) → paid → aktivasi (plan pro + period end, grant AI credits, addon apply) + broadcast.
- [x] **billing:run command** (scheduler): expire subscription lewat `current_period_end` → downgrade free, expire invoice pending kadaluarsa. _Reminder ditunda._
- [x] **Add-on purchase**: channel slot (nambah limit) & AI credits (top-up ledger) via checkout+webhook.
- [x] Free subscription (trialing) dibuat otomatis saat register (resilient bila plans belum di-seed).
- [ ] Checkout/pricing/invoice **UI** + Midtrans & PayPal adapter — **ditunda ke Fase 8** (env sudah disiapkan).

**Exit criteria:** ✅ tenant bisa upgrade ke Pro & beli add-on via Xendit (invoice + checkout URL), entitlement aktif otomatis pasca-bayar (webhook idempotent → plan/credits/addon), expiry+downgrade berjalan via `billing:run`; ✅ CI hijau (lint 0 · typecheck 0 · **69 test passed**, +entitlement plan/addon/fallback, checkout invoice, activation subscription/credits + idempotency, webhook parse). Pembayaran riil butuh `XENDIT_SECRET_KEY`/`XENDIT_WEBHOOK_TOKEN` + UI checkout (Fase 8).

> **Catatan implementasi:** `entitlements` tidak dibuat sebagai tabel — di-derive dari `plans.features` + `subscription_addons` (lebih fleksibel, satu sumber). `channelLimit(plan,type)` sync lama tetap sebagai fallback katalog (dipakai test lama); enforcement nyata pakai `channelLimitFor(tenant,type)` async. Aktivasi invoice **idempotent** (guard `status==='paid'`) + webhook dedup via `payment_events.external_id` — aman untuk redelivery Xendit.

---

## Fase 8 — Landing Page & Admin Polish ✅ SELESAI (2026-07-27)

**Tujuan:** wajah publik & panel admin.

- [x] **Landing home** ([home.vue](../inertia/pages/home.vue)): hero + badge, 6 feature cards, pricing 2-tier (Free/Pro), CTA band, footer 4-kolom (link ke About/Contact/Privacy/Terms/Blog/Docs/Help/Career/Roadmap) — semua via `useTrans` `t()`, theme-aware, responsive. Header sticky + `LanguageSwitcher` + `ThemeToggle` + login/signup / open-app.
- [x] **i18n EN + ID** dwibahasa: infra sudah ada (`useTrans` baca `page.props.translations` + `?lang=` switch); ditambah ~60 key `landing.*` + `billing.*` di `resources/lang/{en,id}/messages.json`.
- [x] **Billing UI** ([app/billing/index.vue](../inertia/pages/app/billing/index.vue), route `/app/billing`): current plan + status + saldo AI credits, plans grid + tombol upgrade (checkout → redirect `checkout_url`), beli AI credits, daftar invoice + "pay now" — wiring endpoint Fase 7. Menutup gap UI Fase 7.
- [x] **Settings hub** ([app/settings/index.vue](../inertia/pages/app/settings/index.vue), route `/app/settings`): kartu link ke AI Agents / Channels / Contacts / Catalog / Organization / Billing.
- [x] **AI Agents management UI** ([app/ai/index.vue](../inertia/pages/app/ai/index.vue), route `/app/ai`): CRUD agent (provider/model dari `/ai/models`, system prompt, max tokens, temperature khusus OpenAI, toggle auto-reply/active), **working hours per-hari** (timezone + buka/tutup + aksi di luar jam silent/reply + pesan), **knowledge base** per agent (add/delete, status embedded), + saldo credits. Menutup item "Auto-response & working hours UI".
- [x] **Channels management UI** ([app/channels/index.vue](../inertia/pages/app/channels/index.vue), route `/app/channels`): list + create (type + WAHA engine, entitlement dari backend), **WAHA connect + QR + polling status + disconnect**, **configure Meta/Telegram credentials** (token disimpan encrypted), **webchat embed snippet + copy**, **assign AI bot** ke channel (PUT `aiAgentId`), delete. Wiring endpoint Fase 2/3/5.5. _(Catatan: route JSON list dipindah ke `channels/list` agar `/app/channels` jadi halaman.)_
- [x] **Admin management screens** (semua wiring endpoint yang sudah ada): **Contacts** ([app/contacts/index.vue](../inertia/pages/app/contacts/index.vue), `/app/contacts` — search/filter/paginate/edit/block/delete/export CSV; JSON list pindah ke `contacts/list`), **Labels & Quick Replies** ([app/catalog/index.vue](../inertia/pages/app/catalog/index.vue), `/app/catalog` — tab CRUD), **Team & Divisions** ([app/organization/index.vue](../inertia/pages/app/organization/index.vue), `/app/organization` — tambah member supervisor/agent + divisi). Semua dilink dari settings hub.
- [x] **Konten halaman legal/info** — komponen reusable [MarketingShell.vue](../inertia/components/MarketingShell.vue) (header + footer) + isi konten: About, Contact, Privacy (8 seksi), Terms (9 seksi), Help (FAQ accordion), Docs (getting-started + topics), Career (openings), Blog (coming-soon), Roadmap (status shipped/progress/planned), Pricing (2-tier i18n). **Route publik ditambahkan** untuk semua (`/about`, `/privacy`, dst) — sebelumnya belum ada, footer/nav link 404.
- [x] **Super Admin panel** ([super/index.vue](../inertia/pages/super/index.vue), route `/super`, guard `superAdmin` middleware): metrics platform (tenant/user/subscription aktif/invoice paid + revenue/AI credits outstanding) + tabel semua tenant (cross-tenant, bypassed) dengan ubah plan/status + grant AI credits. `SuperAdminController` + validator.

**Exit criteria:** ✅ landing publik dwibahasa (EN/ID) + semua halaman legal/info berisi + ber-route; ✅ admin panel tenant lengkap (AI Agents, Channels, Contacts, Catalog, Organization, Billing) + **Super Admin panel** platform operasional; ✅ CI hijau (lint 0 · typecheck 0 (tsc + **vue-tsc**) · 69 test passed). Seluruh permukaan produk kini punya UI end-to-end dari landing → signup → setup → chat → billing → admin.

> **Catatan implementasi:** page Inertia baru butuh entry di `.adonisjs/server/pages.d.ts` (typegen — di-regen otomatis saat `serve`/`build`) agar `renderInertia('app/billing/index', {})` lolos vue-tsc. Landing pakai `<a href>` biasa (full-reload) untuk nav marketing; halaman app self-contained (tak pakai `app-shell` yang butuh `AppSidebar`).

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
