# 🛠️ Local Development Setup Guide

This guide walks you through setting up a complete local development environment with a separate Discord application to avoid interfering with production.

## 📋 Prerequisites

- Node.js 18+ and npm
- Docker Desktop or Colima (for local backend/NATS/PostgreSQL)
- A Discord account with developer access

---

## Part 1: Create Development Discord Application

### 1. Create a New Discord Application

1. Go to https://discord.com/developers/applications
2. Click **"New Application"**
3. Name it: **"Frolf Bot - Dev"** (or similar)
4. Click **"Create"**

### 2. Configure Bot Settings

1. Go to the **"Bot"** tab
2. Click **"Reset Token"** and copy your bot token
3. Enable these **Privileged Gateway Intents**:
   - ✅ Presence Intent
   - ✅ Server Members Intent
   - ✅ Message Content Intent
4. Save changes

### 3. Configure OAuth2 Settings

1. Go to the **"OAuth2"** tab
2. Under **"Redirects"**, add:
   ```
   http://localhost:5173/auth/callback/discord
   ```
3. Copy your **Client ID** and **Client Secret**
4. Under **"OAuth2 URL Generator"**:
   - Select scopes: `identify`, `email`, `guilds`
   - This generates your OAuth URL

### 4. Generate Bot Invite URL

1. Go to **"OAuth2"** > **"URL Generator"**
2. Select scopes:
   - ✅ `bot`
   - ✅ `applications.commands`
3. Select bot permissions:
   - ✅ Manage Roles
   - ✅ Manage Channels
   - ✅ Send Messages
   - ✅ Embed Links
   - ✅ Read Message History
   - ✅ Add Reactions
   - ✅ Use Slash Commands
4. Copy the generated URL

### 5. Create Test Discord Server(s)

1. Create a new Discord server: **"Frolf Bot - Testing"**
2. Use the bot invite URL to add your dev bot to the test server
3. Note your server's Guild ID:
   - Enable Developer Mode: User Settings → Advanced → Developer Mode
   - Right-click your server → Copy Server ID

---

## Part 2: Configure Local Environment

### 1. PWA Environment Setup

Create `.env.local` in `frolf-bot-pwa/`:

```bash
# Generate a random secret: openssl rand -base64 32
AUTH_SECRET=your_generated_secret_here

# Discord OAuth (from your DEV application)
DISCORD_CLIENT_ID=your_dev_client_id
DISCORD_CLIENT_SECRET=your_dev_client_secret

# Local backend endpoints
PUBLIC_API_URL=http://localhost:8080
PUBLIC_NATS_URL=wss://localhost:4443

# Optional: Enable debug logging
PUBLIC_DEBUG=true
```

**Security Note:** Never commit `.env.local` - it's already in `.gitignore`

### 2. Discord Bot Configuration

Create `config.local.yaml` in `discord-frolf-bot/`:

```yaml
# Local development configuration
database_url: 'postgres://local:local@localhost:5432/frolf_bot?sslmode=disable'

nats:
  url: 'nats://localhost:4222'

discord:
  # Your DEV bot token (not production!)
  token: 'YOUR_DEV_BOT_TOKEN_HERE'

  # Your DEV application ID
  app_id: 'YOUR_DEV_APP_ID_HERE'

  # Your test server guild ID
  guild_id: 'YOUR_TEST_GUILD_ID_HERE'

  # These will be set via /frolf-setup command
  signup_channel_id: ''
  signup_message_id: ''
  event_channel_id: ''
  leaderboard_channel_id: ''

  # Role IDs (optional for local dev)
  registered_role_id: ''
  admin_role_id: ''

  signup_emoji: '✋'

service:
  name: 'discord-frolf-bot-dev'
  version: 'local'

observability:
  environment: 'development'
  loki_url: ''
  metrics_address: ':8081' # Different port to avoid conflicts
  tempo_endpoint: ''
```

### 3. Backend Configuration

Create `config.local.yaml` in `frolf-bot/`:

```yaml
postgres:
  dsn: 'postgres://local:local@localhost:5432/frolf_bot?sslmode=disable'

nats:
  url: 'nats://localhost:4222'

observability:
  environment: 'development'
  loki_url: ''
  metrics_address: ':8080'
  tempo_endpoint: ''
  tempo_insecure: true
  tempo_sample_rate: 1.0 # 100% sampling for local dev
```

Backend security requirements:

- Use a strong `JWT_SECRET` for any non-throwaway environment.
- If enabling `pprof` outside localhost, require `PPROF_AUTH_TOKEN` and restrict network access.

---

## Part 3: Start Local Infrastructure

### Option A: Using Tilt (Recommended)

If you have the `frolf-bot-infrastructure` repo set up:

```bash
cd frolf-bot-infrastructure
make dev
```

This starts:

- PostgreSQL (localhost:5432)
- NATS (localhost:4222)
- Backend API (localhost:8080)
- Discord Bot
- Monitoring stack (Grafana, Loki, etc.)

Access Tilt UI: http://localhost:10350

### Option B: Manual Docker Compose

If you don't have infrastructure repo, create `docker-compose.local.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: local
      POSTGRES_PASSWORD: local
      POSTGRES_DB: frolf_bot
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

  nats:
    image: nats:2.10-alpine
    command: ['-js', '-m', '8222']
    ports:
      - '4222:4222' # NATS client
      - '8222:8222' # Monitoring

volumes:
  postgres_data:
```

Start with:

```bash
docker-compose -f docker-compose.local.yml up -d
```

### Option C: Run Services Individually

```bash
# Terminal 1: Start PostgreSQL
docker run --name postgres-dev -e POSTGRES_PASSWORD=local -e POSTGRES_USER=local -e POSTGRES_DB=frolf_bot -p 5432:5432 postgres:15-alpine

# Terminal 2: Start NATS
docker run --name nats-dev -p 4222:4222 -p 8222:8222 nats:2.10-alpine -js -m 8222

# Terminal 3: Start Backend
cd frolf-bot
go run main.go --config config.local.yaml

# Terminal 4: Start Discord Bot
cd discord-frolf-bot
go run main.go --config config.local.yaml
```

---

## Part 4: Start PWA Development Server

```bash
cd frolf-bot-pwa
npm install
npm run dev
```

Access the PWA: http://localhost:5173

---

## Part 5: Initialize Your Test Server

### 1. Run Setup Command in Discord

In your test Discord server, run:

```
/frolf-setup
```

This will:

- Create required channels
- Set up roles
- Initialize the leaderboard

### 2. Test Round Creation

```
/round create
```

Fill out the modal to create a test round.

### 3. Verify PWA Integration

1. Go to http://localhost:5173
2. Click **"Sign in with Discord"**
3. Authorize your dev application
4. You should see your test server data

---

## 🔍 Verification Checklist

✅ Discord dev application created  
✅ Dev bot invited to test server  
✅ `.env.local` configured with dev credentials  
✅ Local PostgreSQL running (port 5432)  
✅ Local NATS running (port 4222)  
✅ Backend API responding (curl http://localhost:8080/health)  
✅ Discord bot online in test server  
✅ PWA dev server running (localhost:5173)  
✅ Can sign in via Discord OAuth  
✅ WebSocket connection established

---

## 🐛 Troubleshooting

### PWA Won't Connect to Backend

- Check `.env.local` has correct `PUBLIC_API_URL`
- Verify backend is running: `curl http://localhost:8080/health`
- Check browser console for CORS errors

### Discord Bot Not Responding

- Verify bot token in `config.local.yaml`
- Check bot has proper permissions in test server
- Check bot is online (green circle in member list)
- View logs: backend and discord bot terminals

### Database Connection Failed

- Ensure PostgreSQL is running: `docker ps`
- Check credentials match in all config files
- Try connecting manually: `psql -h localhost -U local -d frolf_bot`

### WebSocket Not Connecting

- Verify NATS is running: `curl http://localhost:8222/varz`
- Check backend logs for WebSocket errors
- Ensure `PUBLIC_NATS_URL` in `.env.local` is correct

### OAuth Redirect Errors

- Verify redirect URL in Discord app settings matches exactly
- Must be `http://localhost:5173/auth/callback/discord`
- Clear browser cookies and try again

---

## 📚 Next Steps

Once your local environment is working:

1. **Create test data**: Use `/round create` to create several rounds
2. **Test scoring**: Join rounds and submit scores
3. **Check leaderboard**: Verify leaderboard updates
4. **Test WebSocket**: Watch real-time updates in PWA
5. **Build features**: Make changes and see live reload

---

## 🔒 Security Reminders

- ⚠️ Never commit `config.local.yaml` or `.env.local`
- ⚠️ Keep dev bot token separate from production
- ⚠️ Use test servers only - never point to production guilds
- ⚠️ Generate unique `AUTH_SECRET` for local dev
- ⚠️ Don't share your dev credentials

---

## 📝 Useful Commands

```bash
# PWA
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run check        # Type check

# Backend (Go)
go run main.go --config config.local.yaml
go test ./...        # Run tests

# Discord Bot (Go)
go run main.go --config config.local.yaml

# Database
psql -h localhost -U local -d frolf_bot
# Or use a GUI like Postico, TablePlus, pgAdmin

# NATS CLI (if installed)
nats stream list
nats consumer list <stream>
nats sub "round.>"  # Subscribe to all round events
```

---

## 🎯 Development Workflow

1. **Start infrastructure** (PostgreSQL, NATS)
2. **Start backend** (frolf-bot)
3. **Start Discord bot** (discord-frolf-bot)
4. **Start PWA** (npm run dev)
5. Make changes → See live reload
6. Test in Discord test server
7. Verify updates in PWA

---

Happy coding! 🚀
