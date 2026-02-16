# PWA Production Image (for CI + K8s)
FROM oven/bun:1-alpine AS builder
WORKDIR /app

COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun \
    bun install --frozen-lockfile

COPY . .

ARG PUBLIC_API_URL
ARG PUBLIC_NATS_URL
ARG PUBLIC_OTEL_ENDPOINT
ARG PUBLIC_USE_MOCK=false
ARG PUBLIC_DEBUG=false

ENV PUBLIC_API_URL=${PUBLIC_API_URL} \
    PUBLIC_NATS_URL=${PUBLIC_NATS_URL} \
    PUBLIC_OTEL_ENDPOINT=${PUBLIC_OTEL_ENDPOINT} \
    PUBLIC_USE_MOCK=${PUBLIC_USE_MOCK} \
    PUBLIC_DEBUG=${PUBLIC_DEBUG}

RUN bun run prepare
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
