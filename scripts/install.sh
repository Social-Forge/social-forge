#!/bin/bash

# ============================================
# Social Forge - Installation Script
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored messages
print_message() {
    color=$1
    message=$2
    echo -e "${color}${message}${NC}"
}

print_header() {
    echo ""
    print_message "$CYAN" "=========================================="
    print_message "$CYAN" "$1"
    print_message "$CYAN" "=========================================="
    echo ""
}

print_success() {
    print_message "$GREEN" "✓ $1"
}

print_error() {
    print_message "$RED" "✗ $1"
}

print_warning() {
    print_message "$YELLOW" "⚠ $1"
}

print_info() {
    print_message "$BLUE" "ℹ $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_error "Please do not run this script as root"
    exit 1
fi

print_header "Social Forge Installation"

# Check system requirements
print_info "Checking system requirements..."

# Check for Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    print_info "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi
print_success "Docker found: $(docker --version)"

# Check for Docker Compose
if ! command -v docker compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    print_info "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi
print_success "Docker Compose found: $(docker compose --version)"

# Check for Git
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install Git first."
    exit 1
fi
print_success "Git found: $(git --version)"

# Check for Go (for backend development)
if ! command -v go &> /dev/null; then
    print_warning "Go is not installed. You'll need it for backend development."
    print_info "Visit: https://golang.org/doc/install"
else
    print_success "Go found: $(go version)"
fi

# Check for Node.js (for frontend development)
if ! command -v node &> /dev/null; then
    print_warning "Node.js is not installed. You'll need it for frontend development."
    print_info "Visit: https://nodejs.org/"
else
    print_success "Node.js found: $(node --version)"
    print_success "npm found: $(npm --version)"
fi

# Check for golang-migrate
if ! command -v migrate &> /dev/null; then
    print_warning "golang-migrate is not installed."
    print_info "Installing golang-migrate..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl -L https://github.com/golang-migrate/migrate/releases/download/v4.16.2/migrate.linux-amd64.tar.gz | tar xvz
        sudo mv migrate /usr/local/bin/migrate
        print_success "golang-migrate installed"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install golang-migrate
        print_success "golang-migrate installed"
    else
        print_warning "Please install golang-migrate manually from: https://github.com/golang-migrate/migrate"
    fi
fi

print_header "Project Setup"

# Create necessary directories
print_info "Creating project directories..."
mkdir -p server/database/migrations
mkdir -p server/database/seeders
mkdir -p server/logs
mkdir -p server/storage/whatsapp
mkdir -p frontend/static
mkdir -p docker/nginx/ssl
mkdir -p docker/grafana/dashboards
print_success "Directories created"

# Copy environment file
print_info "Setting up environment variables..."
if [ ! -f .env ]; then
    cp .env.example .env
    print_success ".env file created from .env.example"
    print_warning "Please update .env file with your configuration"
else
    print_info ".env file already exists"
fi

# Copy backend environment file
if [ ! -f server/.env ]; then
    cp .env.example server/.env
    print_success "server/.env file created"
else
    print_info "server/.env file already exists"
fi

# Copy frontend environment file
if [ ! -f frontend/.env ]; then
    cat > frontend/.env << 'EOF'
PUBLIC_API_URL=http://localhost:8080
PUBLIC_CENTRIFUGO_URL=ws://localhost:8000/connection/websocket
EOF
    print_success "frontend/.env file created"
else
    print_info "frontend/.env file already exists"
fi

# Generate random secrets for production
print_info "Generating secure random secrets..."
JWT_SECRET=$(openssl rand -base64 32)
CENTRIFUGO_TOKEN_SECRET=$(openssl rand -hex 32)
CENTRIFUGO_API_KEY=$(openssl rand -hex 32)
CENTRIFUGO_ADMIN_SECRET=$(openssl rand -hex 32)

print_info "Generated secrets (save these securely):"
echo "JWT_SECRET=$JWT_SECRET"
echo "CENTRIFUGO_TOKEN_SECRET=$CENTRIFUGO_TOKEN_SECRET"
echo "CENTRIFUGO_API_KEY=$CENTRIFUGO_API_KEY"
echo "CENTRIFUGO_ADMIN_SECRET=$CENTRIFUGO_ADMIN_SECRET"

print_warning "Please update your .env file with these secrets!"

# Install backend dependencies
if [ -d "server" ]; then
    print_info "Installing backend dependencies..."
    cd server
    
    if [ -f "go.mod" ]; then
        go mod download
        print_success "Backend dependencies installed"
    else
        print_info "Initializing Go module..."
        go mod init github.com/yourusername/socialforge
        print_success "Go module initialized"
    fi
    
    cd ..
fi

# Install frontend dependencies
if [ -d "frontend" ]; then
    print_info "Installing frontend dependencies..."
    cd frontend
    
    if [ -f "package.json" ]; then
        npm install
        print_success "Frontend dependencies installed"
    else
        print_warning "package.json not found. Run 'npm init' in frontend directory"
    fi
    
    cd ..
fi

# Docker setup
print_header "Docker Setup"

print_info "Building Docker images..."
docker compose build

print_success "Docker images built successfully"

print_header "Database Setup"

print_info "Starting database containers..."
docker compose up -d postgres redis

# Wait for database to be ready
print_info "Waiting for database to be ready..."
sleep 10

print_info "Running database migrations..."
cd server
if [ -d "database/migrations" ] && [ "$(ls -A database/migrations)" ]; then
    make migrate-up || print_warning "No migrations to run or migration failed"
else
    print_info "No migrations found. Create migrations using: make migrate-create name=your_migration_name"
fi
cd ..

print_header "Installation Complete!"

print_success "Social Forge has been installed successfully!"
echo ""
print_info "Next steps:"
echo "  1. Update your .env file with the generated secrets above"
echo "  2. Configure your database credentials in .env"
echo "  3. Configure external API keys (WhatsApp, Meta, Telegram, AI, etc.)"
echo "  4. Start the development environment: docker compose up -d"
echo "  5. Access the services:"
echo "     - Frontend: http://localhost:5173"
echo "     - Backend API: http://localhost:8080"
echo "     - Grafana: http://localhost:3001 (admin/admin123)"
echo "     - MinIO Console: http://localhost:9001 (minioadmin/minioadmin123)"
echo "     - Centrifugo Admin: http://localhost:8000"
echo ""
print_info "For backend development:"
echo "  cd server && make dev"
echo ""
print_info "For frontend development:"
echo "  cd frontend && npm run dev"
echo ""
print_info "Useful commands:"
echo "  make help              - Show all available commands"
echo "  docker compose logs -f - View all container logs"
echo "  docker compose ps      - Check container status"
echo ""
print_warning "Remember to:"
echo "  - Update .env with production secrets before deploying"
echo "  - Configure SSL certificates for production"
echo "  - Set up proper firewall rules"
echo "  - Configure backup strategies"
echo "  - Review security settings"
echo ""
print_message "$GREEN" "Happy coding! 🚀"
echo ""