# 🚀 Quick Start - PWA Development

## Prerequisites

- Node.js 18+
- Discord developer account
- Local backend infrastructure running

## First Time Setup

### 1. Install Dependencies

```bash
bun install
```

### 2. Create Discord Dev Application

Follow the guide in `LOCAL_DEV_SETUP.md` to create a separate Discord application for development.

### 3. Configure Environment

```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local with your values
# - Generate AUTH_SECRET: openssl rand -base64 32
# - Add your DEV Discord client ID and secret
# - Verify backend URLs (default: localhost:8080)
```

### 4. Start Development Server

```bash
bun run dev
```

Visit http://localhost:5173

## Available Scripts

```bash
bun run dev          # Start dev server with hot reload
bun run build        # Build for production
bun run preview      # Preview production build
bun run check        # Run Svelte type checking
bun run lint         # Lint code
bun run format       # Format with Prettier
bun run test         # Run Vitest tests
```

## Project Structure

```
src/
├── lib/
│   ├── components/       # Reusable UI components
│   │   ├── UserProfile.svelte
│   │   ├── Leaderboard.svelte
│   │   ├── RoundCard.svelte
│   │   └── ScoreCard.svelte
│   ├── services/         # Business logic & API clients
│   │   ├── mockData.ts   # Mock data for development
│   │   └── websocket.ts  # WebSocket client (TODO)
│   ├── types/            # TypeScript type definitions
│   │   └── backend.ts    # Types matching Go backend
│   └── server/           # Server-side code (auth, etc.)
└── routes/               # SvelteKit pages
    ├── +page.svelte      # Dashboard (/)
    └── +layout.svelte    # Root layout with auth
```

## Development Workflow

### Working with Components

1. **Add to page** (`src/routes/+page.svelte`)
2. **Test with real data** (connect to backend)

### Mock Data vs Real Backend

By default, the PWA uses mock data from `src/lib/services/mockData.ts`.

To connect to real backend:

1. Ensure backend is running (http://localhost:8080)
2. Implement WebSocket service in `src/lib/services/websocket.ts`
3. Replace mock data with WebSocket subscription

### Testing Discord OAuth Locally

1. Go to http://localhost:5173
2. Click "Sign in with Discord"
3. Authorize your DEV application
4. You'll be redirected back with session

**Note:** Make sure your Discord dev app has redirect URL:
`http://localhost:5173/auth/callback/discord`

## Common Tasks

### Add a New Component

```bash
# Create component
touch src/lib/components/NewComponent.svelte

# Add to index
# Edit src/lib/index.ts
```

### Add a New Route

```bash
# Create page
mkdir -p src/routes/new-page
touch src/routes/new-page/+page.svelte

# Add server data loader (optional)
touch src/routes/new-page/+page.server.ts
```

### Update TypeScript Types

```bash
# Edit src/lib/types/backend.ts to match Go structs
# Run type check
bun run check
```

## Environment Variables

| Variable                | Description                   | Example                                 |
| ----------------------- | ----------------------------- | --------------------------------------- |
| `AUTH_SECRET`           | Secret for session encryption | Generate with `openssl rand -base64 32` |
| `DISCORD_CLIENT_ID`     | Discord OAuth client ID       | From dev.discord.com                    |
| `DISCORD_CLIENT_SECRET` | Discord OAuth secret          | From dev.discord.com                    |
| `PUBLIC_API_URL`        | Backend API base URL          | `http://localhost:8080`                 |
| `PUBLIC_NATS_URL`       | NATS WebSocket endpoint       | `wss://localhost:4443`                  |

**Security:** Never commit `.env.local` - it's in `.gitignore`

## Troubleshooting

### "Cannot connect to backend"

- Check backend is running: `curl http://localhost:8080/health`
- Verify `PUBLIC_API_URL` in `.env.local`

### OAuth redirect fails

- Check redirect URL in Discord app matches exactly
- Must be `http://localhost:5173/auth/callback/discord`
- Try clearing cookies

### Hot reload not working

- Restart dev server: `bun run dev`
- Check for TypeScript errors: `bun run check`

## Tips & Best Practices

✅ **Use TypeScript** - Catch errors before runtime  
✅ **Use mock data initially** - Don't depend on backend  
✅ **Type your events** - Avoid runtime surprises  
✅ **Test with real Discord** - Use dev application  
✅ **Check component props** - Use proper TypeScript types

## Next Steps

1. ✅ Set up local development environment
2. ⏳ Build WebSocket client service
3. ⏳ Connect dashboard to real-time events
4. ⏳ Add guild selector
5. ⏳ Implement round creation UI
6. ⏳ Add score submission flow

See `LOCAL_DEV_SETUP.md` for complete infrastructure setup.

---

**Need help?** Check the main README or ask in Discord!
