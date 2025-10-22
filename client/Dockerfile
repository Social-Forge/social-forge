# syntax=docker/dockerfile:1

FROM node:24-alpine AS base
# Install pnpm globally
RUN npm install -g pnpm

# Stage 1: Development
FROM base AS development

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Expose port
EXPOSE 5173

# Default command for development
CMD ["pnpm", "run", "dev", "--", "--host", "0.0.0.0"]

# Stage 2: Builder
FROM base AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN pnpm run build

# Prune dev dependencies
RUN pnpm prune --prod

# Stage 3: Production
FROM node:24-alpine AS production

# Install dumb-init for proper signal handling with pinned version
RUN apk add --no-cache dumb-init=~1.2

# Create non-root user
RUN addgroup -g 1000 appuser && \
    adduser -D -u 1000 -G appuser appuser

# Set working directory
WORKDIR /app

# Copy built application from builder
COPY --from=builder --chown=appuser:appuser /app/build ./build
COPY --from=builder --chown=appuser:appuser /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appuser /app/package.json ./

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "build"]