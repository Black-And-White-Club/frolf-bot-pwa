# =============================================================================
# Frolf-Bot PWA - Production Dockerfile
# =============================================================================
# Multi-stage build optimized for SvelteKit with Node.js adapter
#
# Build: docker build -t frolf-bot-pwa .
# Run:   docker run -p 3000:3000 --env-file .env.production frolf-bot-pwa
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
# Install all dependencies (including devDependencies for build)
FROM oven/bun:1-alpine AS deps

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install all dependencies (need devDeps for build)
RUN bun install --frozen-lockfile

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
# Build the SvelteKit application
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source files
COPY . .

# Build arguments for environment variables needed at build time
# These are baked into the client bundle during SSR build
ARG VITE_NATS_URL
ARG VITE_OTEL_ENDPOINT
ARG VITE_API_URL
ARG VITE_USE_MOCK=false
ARG VITE_DEBUG=false

# Set as environment variables for the build process
ENV VITE_NATS_URL=$VITE_NATS_URL
ENV VITE_OTEL_ENDPOINT=$VITE_OTEL_ENDPOINT
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_USE_MOCK=$VITE_USE_MOCK
ENV VITE_DEBUG=$VITE_DEBUG

# Generate paraglide i18n files and build
RUN bun run build

# -----------------------------------------------------------------------------
# Stage 3: Production
# -----------------------------------------------------------------------------
# Minimal production image
FROM node:22-alpine AS production

WORKDIR /app

# Security: Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 sveltekit

# Copy built output from builder
# SvelteKit with adapter-node outputs to 'build' directory
COPY --from=builder --chown=sveltekit:nodejs /app/build ./build
COPY --from=builder --chown=sveltekit:nodejs /app/package.json ./

# Copy node_modules for production dependencies only
# Note: adapter-node bundles most deps, but some may still be needed
COPY --from=deps --chown=sveltekit:nodejs /app/node_modules ./node_modules

# Runtime environment variables (can be overridden at container start)
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV ORIGIN=http://localhost:3000

# Expose the port
EXPOSE 3000

# Switch to non-root user
USER sveltekit

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the server
# The entrypoint is the built SvelteKit server
CMD ["node", "build/index.js"]
