# 🥏 Frolf Bot PWA

A modern progressive web app for disc golf (frolf) round management, scoring, and leaderboards. Built with SvelteKit, TypeScript, and real-time WebSocket updates.

## ✨ Features

- 🎯 **Real-time Scoring** - Watch round scores update live via WebSocket
- 🏆 **Dynamic Leaderboards** - Competitive rankings with automatic updates
- 📊 **Player Statistics** - Track performance over time
- 🎨 **Component Library** - Reusable UI components built in Storybook
- 🔐 **Discord OAuth** - Seamless authentication
- 📱 **Mobile-First** - Responsive design optimized for mobile devices
- 🌓 **Theme Support** - Custom mint/teal color scheme

## 🚀 Quick Start

**New to the project?** See [QUICK_START.md](./QUICK_START.md)

**Setting up local development?** See [LOCAL_DEV_SETUP.md](./LOCAL_DEV_SETUP.md)

### Installation

```bash
bun install
```

### Development

```bash
# Start local infrastructure (PostgreSQL + NATS)
docker-compose -f docker-compose.dev.yml up -d

# Start dev server
bun run dev
```

Visit http://localhost:5173

### Configuration

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

See [LOCAL_DEV_SETUP.md](./LOCAL_DEV_SETUP.md) for detailed configuration instructions.

## 📚 Documentation

- **[QUICK_START.md](./QUICK_START.md)** - Get started in 5 minutes
- **[LOCAL_DEV_SETUP.md](./LOCAL_DEV_SETUP.md)** - Complete development environment setup
- **[Component Library](http://localhost:6006)** - Run `bun run storybook`

## 🏗️ Project Structure

```
src/
├── lib/
│   ├── components/       # Reusable UI components
│   ├── services/         # Business logic & API clients
│   ├── types/            # TypeScript definitions
│   └── server/           # Server-side code (auth)
└── routes/               # SvelteKit pages
    ├── +page.svelte      # Dashboard
    └── +layout.svelte    # Root layout
```

## 🛠️ Available Scripts

| Command             | Description              |
| ------------------- | ------------------------ |
| `bun run dev`       | Start development server |
| `bun run build`     | Build for production     |
| `bun run preview`   | Preview production build |
| `bun run check`     | Run type checking        |
| `bun run lint`      | Lint code                |
| `bun run format`    | Format with Prettier     |
| `bun run test`      | Run tests                |
| `bun run storybook` | Start Storybook          |

## 🧩 Tech Stack

- **Framework**: [SvelteKit](https://kit.svelte.dev/) 2.x (Svelte 5)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.x
- **Auth**: [@auth/sveltekit](https://authjs.dev/)
- **Component Dev**: Storybook 9.x
- **Testing**: Vitest
- **Real-time**: WebSocket (NATS JetStream)

## 🔐 Environment Variables

| Variable                | Description               | Required |
| ----------------------- | ------------------------- | -------- |
| `AUTH_SECRET`           | Session encryption secret | ✅       |
| `DISCORD_CLIENT_ID`     | Discord OAuth client ID   | ✅       |
| `DISCORD_CLIENT_SECRET` | Discord OAuth secret      | ✅       |
| `PUBLIC_API_URL`        | Backend API URL           | ✅       |
| `PUBLIC_WS_URL`         | WebSocket endpoint        | ✅       |

Generate `AUTH_SECRET`: `openssl rand -base64 32`

## 🧪 Development Workflow

1. **Start infrastructure** (PostgreSQL, NATS)
2. **Start backend** (Go API server)
3. **Start PWA** (`bun run dev`)
4. Make changes → See live reload
5. Build components in Storybook
6. Test with Discord dev application

See [LOCAL_DEV_SETUP.md](./LOCAL_DEV_SETUP.md) for complete workflow.

## 🐛 Troubleshooting

**Can't connect to backend?**

- Check backend is running: `curl http://localhost:8080/health`
- Verify `PUBLIC_API_URL` in `.env.local`

**OAuth fails?**

- Verify redirect URL in Discord app: `http://localhost:5173/auth/callback/discord`
- Clear browser cookies

**Types not matching backend?**

- Update `src/lib/types/backend.ts` to match Go structs
- Run `bun run check`

## 📦 Building for Production

```bash
bun run build
```

Preview the build:

```bash
bun run preview
```

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run `bun run check` and `bun run test`
4. Submit a pull request

## 📄 License

[Your License Here]

---

Built with ❤️ for disc golf enthusiasts
