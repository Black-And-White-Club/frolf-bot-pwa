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

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
