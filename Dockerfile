# PWA Production Image (for CI + K8s)
FROM oven/bun:1-alpine AS builder
WORKDIR /app

COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun \
    bun install --frozen-lockfile

COPY . .

ARG VITE_API_URL
ARG VITE_NATS_URL
ARG VITE_OTEL_ENDPOINT
ARG VITE_USE_MOCK=false
ARG VITE_DEBUG=false

ENV VITE_API_URL=${VITE_API_URL} \
    VITE_NATS_URL=${VITE_NATS_URL} \
    VITE_OTEL_ENDPOINT=${VITE_OTEL_ENDPOINT} \
    VITE_USE_MOCK=${VITE_USE_MOCK} \
    VITE_DEBUG=${VITE_DEBUG}

RUN bun run build

# --- Runtime ---
FROM oven/bun:1-alpine
WORKDIR /app

RUN addgroup -S app && adduser -S app -G app

COPY --from=builder /app/build build/
COPY --from=builder /app/package.json .
COPY --from=builder /app/node_modules node_modules/

USER app
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
    CMD wget -qO- http://localhost:3000/api/ping || exit 1

CMD ["bun", "build/index.js"]
