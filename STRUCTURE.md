social-forge/
├── .github/
│ └── workflows/
│ ├── backend-deploy.yml
│ ├── frontend-deploy.yml
│ └── docker-build.yml
├── server/ # Backend Golang
│ ├── cmd/
│ │ ├── api/
│ │ │ └── main.go # Entry point API server
│ │ ├── worker/
│ │ │ └── main.go # Entry point Asynq worker
│ │ └── migrate/
│ │ └── main.go # Entry point migration CLI
│ ├── config/
│ │ ├── config.go # Main config loader
│ │ ├── database.go # Database configuration
│ │ ├── redis.go # Redis configuration
│ │ ├── centrifugo.go # Centrifugo configuration
│ │ ├── minio.go # MinIO configuration
│ │ └── logger.go # Logger setup (zerolog/zap)
│ ├── database/
│ │ ├── migrations/ # SQL migration files
│ │ │ ├── 000001_create_users_table.up.sql
│ │ │ ├── 000001_create_users_table.down.sql
│ │ │ ├── 000002_create_tenants_table.up.sql
│ │ │ ├── 000002_create_tenants_table.down.sql
│ │ │ └── ...
│ │ └── seeders/ # Database seeders
│ │ ├── seeder.go
│ │ ├── user_seeder.go
│ │ ├── tenant_seeder.go
│ │ └── role_seeder.go
│ ├── internal/
│ │ ├── app/
│ │ │ └── app.go # Fiber app initialization
│ │ ├── dependencies/
│ │ │ └── container.go # Dependency injection container
│ │ ├── dto/ # Data Transfer Objects
│ │ │ ├── auth_dto.go
│ │ │ ├── tenant_dto.go
│ │ │ ├── conversation_dto.go
│ │ │ ├── message_dto.go
│ │ │ ├── contact_dto.go
│ │ │ ├── division_dto.go
│ │ │ ├── agent_dto.go
│ │ │ ├── quick_reply_dto.go
│ │ │ └── page_builder_dto.go
│ │ ├── entity/ # Database entities/models
│ │ │ ├── user.go
│ │ │ ├── tenant.go
│ │ │ ├── role.go
│ │ │ ├── permission.go
│ │ │ ├── division.go
│ │ │ ├── agent_assignment.go
│ │ │ ├── conversation.go
│ │ │ ├── message.go
│ │ │ ├── contact.go
│ │ │ ├── channel_integration.go
│ │ │ ├── quick_reply.go
│ │ │ ├── working_hours.go
│ │ │ ├── page_builder.go
│ │ │ ├── auto_reply.go
│ │ │ └── webhook_log.go
│ │ ├── factory/
│ │ │ ├── factory.go # Main factory
│ │ │ ├── handler_factory.go
│ │ │ ├── service_factory.go
│ │ │ ├── repository_factory.go
│ │ │ ├── middleware_factory.go
│ │ │ └── routes_factory.go
│ │ ├── handlers/ # HTTP Handlers
│ │ │ ├── auth_handler.go
│ │ │ ├── tenant_handler.go
│ │ │ ├── user_handler.go
│ │ │ ├── division_handler.go
│ │ │ ├── conversation_handler.go
│ │ │ ├── message_handler.go
│ │ │ ├── contact_handler.go
│ │ │ ├── channel_handler.go
│ │ │ ├── quick_reply_handler.go
│ │ │ ├── page_builder_handler.go
│ │ │ ├── webhook_handler.go
│ │ │ └── health_handler.go
│ │ ├── helpers/
│ │ │ ├── response.go # Standard API response
│ │ │ ├── pagination.go
│ │ │ ├── validator.go
│ │ │ └── error.go
│ │ ├── infra/
│ │ │ ├── asynq-client/
│ │ │ │ ├── client.go
│ │ │ │ └── tasks.go
│ │ │ ├── ai-client/
│ │ │ │ ├── openai.go
│ │ │ │ └── anthropic.go
│ │ │ ├── centrifugo/
│ │ │ │ ├── client.go
│ │ │ │ └── publisher.go
│ │ │ ├── contextpool/
│ │ │ │ └── pool.go
│ │ │ ├── minio-client/
│ │ │ │ ├── client.go
│ │ │ │ └── uploader.go
│ │ │ ├── redis-client/
│ │ │ │ ├── client.go
│ │ │ │ └── cache.go
│ │ │ ├── repository/
│ │ │ │ ├── user_repository.go
│ │ │ │ ├── tenant_repository.go
│ │ │ │ ├── division_repository.go
│ │ │ │ ├── conversation_repository.go
│ │ │ │ ├── message_repository.go
│ │ │ │ ├── contact_repository.go
│ │ │ │ ├── channel_repository.go
│ │ │ │ ├── quick_reply_repository.go
│ │ │ │ └── page_builder_repository.go
│ │ │ ├── taskhandlers/ # Asynq task handlers
│ │ │ │ ├── message_handler.go
│ │ │ │ ├── webhook_handler.go
│ │ │ │ ├── notification_handler.go
│ │ │ │ └── ai_handler.go
│ │ │ └── channels/ # Channel integrations
│ │ │ ├── whatsapp/
│ │ │ │ ├── whatsmeow.go
│ │ │ │ └── handler.go
│ │ │ ├── meta/
│ │ │ │ ├── messenger.go
│ │ │ │ ├── instagram.go
│ │ │ │ └── whatsapp_business.go
│ │ │ ├── telegram/
│ │ │ │ └── bot.go
│ │ │ └── webchat/
│ │ │ └── handler.go
│ │ ├── middlewares/
│ │ │ ├── auth.go
│ │ │ ├── tenant.go
│ │ │ ├── permission.go
│ │ │ ├── rate_limiter.go
│ │ │ ├── cors.go
│ │ │ └── logger.go
│ │ ├── routes/
│ │ │ ├── routes.go # Main routes
│ │ │ ├── api_v1.go
│ │ │ ├── webhook_routes.go
│ │ │ └── public_routes.go
│ │ ├── services/
│ │ │ ├── auth_service.go
│ │ │ ├── tenant_service.go
│ │ │ ├── user_service.go
│ │ │ ├── division_service.go
│ │ │ ├── conversation_service.go
│ │ │ ├── message_service.go
│ │ │ ├── contact_service.go
│ │ │ ├── channel_service.go
│ │ │ ├── quick_reply_service.go
│ │ │ ├── page_builder_service.go
│ │ │ ├── rotator_service.go
│ │ │ ├── assignment_service.go
│ │ │ └── notification_service.go
│ │ └── utils/
│ │ ├── crypto.go # Encryption utilities
│ │ ├── jwt.go # JWT utilities
│ │ ├── slug.go
│ │ ├── string.go
│ │ └── time.go
│ ├── pkg/ # Shared packages
│ │ ├── constants/
│ │ │ └── constants.go
│ │ └── errors/
│ │ └── errors.go
│ ├── .env.example
│ ├── .gitignore
│ ├── Dockerfile
│ ├── Makefile
│ ├── go.mod
│ └── go.sum
├── frontend/ # SvelteKit Frontend
│ ├── src/
│ │ ├── lib/
│ │ │ ├── components/
│ │ │ │ ├── ui/ # shadcn-svelte components
│ │ │ │ │ ├── button/
│ │ │ │ │ ├── card/
│ │ │ │ │ ├── dialog/
│ │ │ │ │ ├── input/
│ │ │ │ │ ├── select/
│ │ │ │ │ └── ...
│ │ │ │ ├── chat/
│ │ │ │ │ ├── ChatRoom.svelte
│ │ │ │ │ ├── MessageList.svelte
│ │ │ │ │ ├── MessageInput.svelte
│ │ │ │ │ ├── ContactList.svelte
│ │ │ │ │ └── QuickReply.svelte
│ │ │ │ ├── dashboard/
│ │ │ │ │ ├── Sidebar.svelte
│ │ │ │ │ ├── Navbar.svelte
│ │ │ │ │ ├── StatsCard.svelte
│ │ │ │ │ └── Chart.svelte
│ │ │ │ ├── builder/ # Page Builder Components
│ │ │ │ │ ├── Canvas.svelte
│ │ │ │ │ ├── Toolbar.svelte
│ │ │ │ │ ├── PropertyPanel.svelte
│ │ │ │ │ ├── ComponentTree.svelte
│ │ │ │ │ └── elements/
│ │ │ │ │ ├── Text.svelte
│ │ │ │ │ ├── Image.svelte
│ │ │ │ │ ├── Button.svelte
│ │ │ │ │ ├── Container.svelte
│ │ │ │ │ ├── Form.svelte
│ │ │ │ │ └── WebChat.svelte
│ │ │ │ └── layout/
│ │ │ │ ├── Header.svelte
│ │ │ │ ├── Footer.svelte
│ │ │ │ └── Container.svelte
│ │ │ ├── stores/
│ │ │ │ ├── auth.ts
│ │ │ │ ├── tenant.ts
│ │ │ │ ├── chat.ts
│ │ │ │ ├── centrifugo.ts
│ │ │ │ └── builder.ts
│ │ │ ├── services/
│ │ │ │ ├── api.ts # API client
│ │ │ │ ├── websocket.ts # Centrifugo client
│ │ │ │ ├── auth.ts
│ │ │ │ └── upload.ts
│ │ │ ├── utils/
│ │ │ │ ├── formatters.ts
│ │ │ │ ├── validators.ts
│ │ │ │ └── constants.ts
│ │ │ └── types/
│ │ │ ├── auth.ts
│ │ │ ├── chat.ts
│ │ │ ├── tenant.ts
│ │ │ └── builder.ts
│ │ ├── routes/
│ │ │ ├── (auth)/
│ │ │ │ ├── login/
│ │ │ │ │ └── +page.svelte
│ │ │ │ └── register/
│ │ │ │ └── +page.svelte
│ │ │ ├── (app)/
│ │ │ │ ├── dashboard/
│ │ │ │ │ └── +page.svelte
│ │ │ │ ├── chat/
│ │ │ │ │ └── +page.svelte
│ │ │ │ ├── contacts/
│ │ │ │ │ └── +page.svelte
│ │ │ │ ├── divisions/
│ │ │ │ │ └── +page.svelte
│ │ │ │ ├── agents/
│ │ │ │ │ └── +page.svelte
│ │ │ │ ├── channels/
│ │ │ │ │ └── +page.svelte
│ │ │ │ ├── quick-replies/
│ │ │ │ │ └── +page.svelte
│ │ │ │ ├── builder/
│ │ │ │ │ ├── +page.svelte
│ │ │ │ │ └── [id]/
│ │ │ │ │ └── +page.svelte
│ │ │ │ └── settings/
│ │ │ │ └── +page.svelte
│ │ │ ├── (public)/
│ │ │ │ ├── p/
│ │ │ │ │ └── [slug]/ # Public landing pages
│ │ │ │ │ └── +page.svelte
│ │ │ │ └── c/
│ │ │ │ └── [divisionId]/ # Link chat divisi
│ │ │ │ └── +page.svelte
│ │ │ └── +layout.svelte
│ │ ├── app.html
│ │ └── app.css
│ ├── static/
│ │ └── favicon.png
│ ├── .env.example
│ ├── .gitignore
│ ├── Dockerfile
│ ├── package.json
│ ├── svelte.config.js
│ ├── tailwind.config.js
│ ├── tsconfig.json
│ └── vite.config.ts
├── mobile/ # Kotlin Mobile App
│ ├── app/
│ │ ├── src/
│ │ │ ├── main/
│ │ │ │ ├── java/com/socialforge/
│ │ │ │ │ ├── data/
│ │ │ │ │ │ ├── model/
│ │ │ │ │ │ ├── repository/
│ │ │ │ │ │ └── remote/
│ │ │ │ │ ├── di/
│ │ │ │ │ ├── ui/
│ │ │ │ │ │ ├── auth/
│ │ │ │ │ │ ├── chat/
│ │ │ │ │ │ └── common/
│ │ │ │ │ ├── utils/
│ │ │ │ │ └── MainActivity.kt
│ │ │ │ ├── res/
│ │ │ │ └── AndroidManifest.xml
│ │ │ └── ...
│ │ └── build.gradle
│ ├── gradle/
│ ├── build.gradle
│ └── settings.gradle
├── docker/
│ ├── nginx/
│ │ ├── nginx.conf
│ │ └── Dockerfile
│ ├── centrifugo/
│ │ └── config.json
│ ├── prometheus/
│ │ └── prometheus.yml
│ └── grafana/
│ ├── dashboards/
│ │ ├── backend-metrics.json
│ │ └── system-metrics.json
│ └── provisioning/
│ ├── datasources/
│ │ └── prometheus.yml
│ └── dashboards/
│ └── dashboard.yml
├── scripts/
│ ├── install.sh # Initial setup script
│ ├── deploy.sh # Deployment script
│ └── backup.sh # Backup script
├── .gitignore
├── docker-compose.yml
├── docker-compose.prod.yml
└── README.md
