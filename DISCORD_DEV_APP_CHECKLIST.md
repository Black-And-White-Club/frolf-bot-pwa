# 📋 Discord Dev Application Setup Checklist

Use this checklist to ensure your Discord development application is configured correctly.

## Step 1: Create Application

- [ ] Go to https://discord.com/developers/applications
- [ ] Click "New Application"
- [ ] Name: "Frolf Bot - Dev" (or similar)
- [ ] Click "Create"
- [ ] Note your **Application ID**: `_____________________`

## Step 2: Configure Bot

- [ ] Go to "Bot" tab
- [ ] Click "Reset Token" and save it securely
- [ ] **Bot Token**: `_____________________` (save in password manager)
- [ ] Enable Privileged Gateway Intents:
  - [ ] Presence Intent
  - [ ] Server Members Intent  
  - [ ] Message Content Intent
- [ ] Click "Save Changes"

## Step 3: OAuth2 Configuration

- [ ] Go to "OAuth2" → "General" tab
- [ ] Under "Redirects", click "Add Redirect"
- [ ] Add: `http://localhost:5173/auth/callback/discord`
- [ ] Click "Save Changes"
- [ ] Copy **Client ID**: `_____________________`
- [ ] Copy **Client Secret**: `_____________________` (save in password manager)

## Step 4: Generate Bot Invite URL

- [ ] Go to "OAuth2" → "URL Generator"
- [ ] Select scopes:
  - [ ] `bot`
  - [ ] `applications.commands`
- [ ] Select permissions:
  - [ ] Manage Roles
  - [ ] Manage Channels
  - [ ] Send Messages
  - [ ] Send Messages in Threads
  - [ ] Embed Links
  - [ ] Attach Files
  - [ ] Read Message History
  - [ ] Add Reactions
  - [ ] Use Slash Commands
- [ ] Copy the generated URL
- [ ] **Bot Invite URL**: `_____________________`

## Step 5: Create Test Server

- [ ] Create new Discord server: "Frolf Bot - Testing"
- [ ] Enable Developer Mode:
  - User Settings → Advanced → Developer Mode (toggle on)
- [ ] Right-click server → Copy Server ID
- [ ] **Guild ID**: `_____________________`
- [ ] Use bot invite URL to add bot to test server
- [ ] Verify bot appears in member list (should show as offline initially)

## Step 6: Configure Local Environment

### PWA (.env.local)

```bash
# Generate secret: openssl rand -base64 32
AUTH_SECRET=_____________________

DISCORD_CLIENT_ID=_____________________
DISCORD_CLIENT_SECRET=_____________________

PUBLIC_API_URL=http://localhost:8080
PUBLIC_WS_URL=ws://localhost:8080/ws
```

- [ ] Created `.env.local` in `frolf-bot-pwa/`
- [ ] Filled in all values
- [ ] Generated unique `AUTH_SECRET`

### Discord Bot (config.local.yaml)

```yaml
database_url: "postgres://local:local@localhost:5432/frolf_bot?sslmode=disable"

nats:
  url: "nats://localhost:4222"

discord:
  token: "_____________________"
  app_id: "_____________________"
  guild_id: "_____________________"
  
  signup_channel_id: ""
  signup_message_id: ""
  event_channel_id: ""
  leaderboard_channel_id: ""
  
  registered_role_id: ""
  admin_role_id: ""
  
  signup_emoji: "✋"

service:
  name: "discord-frolf-bot-dev"
  version: "local"

observability:
  environment: "development"
  metrics_address: ":8081"
```

- [ ] Created `config.local.yaml` in `discord-frolf-bot/`
- [ ] Filled in bot token, app_id, guild_id

### Backend (config.local.yaml)

```yaml
postgres:
  dsn: "postgres://local:local@localhost:5432/frolf_bot?sslmode=disable"

nats:
  url: "nats://localhost:4222"

observability:
  environment: "development"
  metrics_address: ":8080"
```

- [ ] Created `config.local.yaml` in `frolf-bot/`

## Step 7: Start Infrastructure

- [ ] Start PostgreSQL and NATS:
  ```bash
  cd frolf-bot-pwa
  docker-compose -f docker-compose.dev.yml up -d
  ```
- [ ] Verify PostgreSQL: `docker ps | grep postgres`
- [ ] Verify NATS: `curl http://localhost:8222/varz`

## Step 8: Start Services

- [ ] Start backend:
  ```bash
  cd frolf-bot
  go run main.go --config config.local.yaml
  ```
- [ ] Verify backend: `curl http://localhost:8080/health`

- [ ] Start Discord bot:
  ```bash
  cd discord-frolf-bot
  go run main.go --config config.local.yaml
  ```
- [ ] Check bot is online in Discord server (green circle)

- [ ] Start PWA:
  ```bash
  cd frolf-bot-pwa
  npm run dev
  ```
- [ ] Open http://localhost:5173

## Step 9: Initialize Test Server

- [ ] In Discord test server, run: `/frolf-setup`
- [ ] Configure channels when prompted
- [ ] Verify setup completion message

## Step 10: Verification Tests

- [ ] **Test Discord Bot**:
  - [ ] Run `/round create` in test server
  - [ ] Fill out modal and submit
  - [ ] Verify round created in channel

- [ ] **Test PWA OAuth**:
  - [ ] Go to http://localhost:5173
  - [ ] Click "Sign in with Discord"
  - [ ] Authorize application
  - [ ] Verify successful redirect
  - [ ] Check user profile appears

- [ ] **Test WebSocket** (once implemented):
  - [ ] Open PWA in browser
  - [ ] Create round in Discord
  - [ ] Verify round appears in PWA (real-time)

- [ ] **Test Leaderboard**:
  - [ ] Submit scores in Discord
  - [ ] Check leaderboard updates in PWA

## 🎉 Success Criteria

✅ Discord dev bot is online in test server  
✅ Can run slash commands (`/round create`)  
✅ Backend API responds to health check  
✅ PWA loads at localhost:5173  
✅ Can sign in via Discord OAuth  
✅ No console errors in browser  
✅ WebSocket connection established (check Network tab)  

## 🔒 Security Reminders

- ⚠️ **NEVER** commit config files with secrets
- ⚠️ Keep dev and production tokens separate
- ⚠️ Use test servers only - never production guilds
- ⚠️ Regenerate tokens if accidentally exposed
- ⚠️ Store tokens in password manager

## 📝 Credentials Summary

Keep this information secure and accessible:

| Item | Value | Location |
|------|-------|----------|
| Application ID | `_____________________` | Discord Developers |
| Bot Token | `_____________________` | config.local.yaml |
| Client ID | `_____________________` | .env.local |
| Client Secret | `_____________________` | .env.local |
| Test Guild ID | `_____________________` | config.local.yaml |
| AUTH_SECRET | `_____________________` | .env.local |

## 🆘 Need Help?

If something isn't working:

1. Check this checklist - did you miss a step?
2. See [LOCAL_DEV_SETUP.md](./LOCAL_DEV_SETUP.md) for detailed instructions
3. Check [QUICK_START.md](./QUICK_START.md) for troubleshooting
4. Review service logs for error messages

---

**Last Updated**: {{ date }}  
**Environment**: Local Development
