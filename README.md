# 🚀 Social Foger

> **Omnichannel Customer Engagement Platform** with integrated Web Builder and WhatsApp Rotator

A powerful multi-tenant platform for managing customer conversations across multiple channels (WhatsApp, Facebook Messenger, Instagram, Telegram) with built-in landing page builder and intelligent message routing.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Development](#-development)
- [Deployment](#-deployment)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### Omnichannel Messaging

- 📱 **Multi-Channel Support**: WhatsApp, Messenger, Instagram, Telegram
- 🏢 **Multi-Tenant System**: Isolated tenant environments with role-based access
- 👥 **Team Management**: Owner, Supervisor, and Agent roles
- 📊 **Division Management**: Organize teams with automated message routing
- 💬 **Real-time Chat**: WebSocket-powered instant messaging
- 🤖 **AI Integration**: OpenAI/Anthropic for automated responses
- 📝 **Quick Replies**: Template messages for faster responses
- ⏰ **Working Hours**: Configure availability per division
- 📧 **Contact Management**: Centralized customer database

### Web Builder

- 🎨 **Drag & Drop Editor**: Build landing pages without coding
- 📱 **Responsive Design**: Mobile-first approach
- 🔗 **Integration**: Connect with chat divisions
- 🎯 **CTA Components**: Web chat and link chat widgets
- 📄 **Page Limits**: Up to 20 landing pages per tenant

### WhatsApp Rotator

- 🔄 **Smart Routing**: Percentage-based or equal distribution
- 🔗 **Division Links**: Shareable URLs for campaigns
- 📊 **Load Balancing**: Distribute conversations across agents
- 🚫 **Duplicate Prevention**: One conversation per customer

## 🛠 Tech Stack

### Backend

- **Language**: Go 1.22+
- **Framework**: [Fiber](https://docs.gofiber.io)
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **WebSocket**: [Centrifugo](https://centrifugal.dev) v5
- **Queue**: Asynq
- **Storage**: MinIO (S3-compatible)
- **Monitoring**: Prometheus + Grafana

### Frontend

- **Framework**: SvelteKit
- **UI Library**: shadcn-svelte
- **Styling**: TailwindCSS
- **State**: Svelte Stores
- **WebSocket**: Centrifugo Client

### Mobile

- **Platform**: Android
- **Language**: Kotlin
- **UI**: Jetpack Compose

### DevOps

- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **CI/CD**: GitHub Actions
- **Reverse Proxy**: Nginx

## 📦 Prerequisites

- Docker & Docker Compose
- Go 1.22+ (for local development)
- Node.js 20+ (for local development)
- golang-migrate CLI
- Make

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/socialforge.git
cd socialforge
```

### 2. Run installation script

```bash
chmod +x scripts/install.sh
./scripts/install.sh
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env with your configuration
nano .env
```

### 4. Start the services

```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d
```

### 5. Run migrations

```bash
cd server
make migrate-up
make seed
```

### 6. Access the application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **Grafana**: http://localhost:3001 (admin/admin123)
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin123)
- **Centrifugo**: http://localhost:8000

## 📁 Project Structure

```
socialforge/
├── .github/workflows/      # CI/CD pipelines
├── server/                 # Golang backend
│   ├── cmd/               # Application entry points
│   ├── config/            # Configuration
│   ├── database/          # Migrations & seeders
│   ├── internal/          # Internal packages
│   └── pkg/               # Public packages
├── frontend/              # SvelteKit application
│   ├── src/
│   │   ├── lib/          # Components & utilities
│   │   └── routes/       # Page routes
├── mobile/               # Kotlin Android app
├── docker/               # Docker configurations
│   ├── nginx/
│   ├── centrifugo/
│   ├── prometheus/
│   └── grafana/
└── scripts/              # Utility scripts
```

## 💻 Development

### Backend Development

```bash
cd server

# Run with hot reload
make dev

# Run tests
make test

# Run linter
make lint

# Create migration
make migrate-create name=create_users_table

# Run migrations
make migrate-up

# Rollback migration
make migrate-down

# Build binary
make build
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Docker Commands

```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Clean up (⚠️ removes volumes)
docker-compose down -v
```

## 🚢 Deployment

### Production Deployment

1. **Set up environment variables**

```bash
cp .env.example .env.production
# Update with production values
```

2. **Configure SSL certificates**

```bash
# Place certificates in docker/nginx/ssl/
# Update nginx configuration
```

3. **Deploy using Docker Compose**

```bash
docker-compose -f docker-compose.prod.yml up -d
```

4. **Run migrations**

```bash
docker-compose -f docker-compose.prod.yml exec backend /app/migrate -path /app/database/migrations -database "$DATABASE_URL" up
```

### GitHub Actions

Push to `main` or `develop` branch triggers automatic deployment:

- `main` → Production
- `develop` → Staging

Required secrets:

- `SSH_PRIVATE_KEY`
- `PRODUCTION_HOST`
- `PRODUCTION_USER`
- `STAGING_SSH_PRIVATE_KEY`
- `STAGING_HOST`
- `STAGING_USER`
- `SLACK_WEBHOOK` (optional)

## 📚 API Documentation

API documentation is available via Swagger UI:

**Development**: http://localhost:8080/swagger/index.html

Generate documentation:

```bash
cd server
make swag
```

## 🧪 Testing

### Backend Tests

```bash
cd server
make test              # Run all tests
make test-unit         # Unit tests only
make test-integration  # Integration tests only
make test-coverage     # Generate coverage report
```

### Frontend Tests

```bash
cd frontend
npm run test           # Run tests
npm run test:watch     # Watch mode
```

## 📊 Monitoring

Access monitoring dashboards:

- **Grafana**: http://localhost:3001 (or your domain)
- **Prometheus**: http://localhost:9090

Pre-configured dashboards:

- Backend Metrics
- System Metrics
- Database Metrics
- Redis Metrics

## 🔐 Security

- JWT-based authentication
- Role-based access control (RBAC)
- Rate limiting on API endpoints
- CORS configuration
- SSL/TLS encryption
- SQL injection prevention
- XSS protection

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Developer**: Your Name
- **Contact**: your.email@example.com

## 🙏 Acknowledgments

- [Fiber](https://gofiber.io) - Express-inspired web framework
- [SvelteKit](https://kit.svelte.dev) - Web framework
- [Centrifugo](https://centrifugal.dev) - Real-time messaging
- [shadcn-svelte](https://shadcn-svelte.com) - UI components

---

Made with ❤️ by Social Foger Team
