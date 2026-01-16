# Kingdom Mind

> "Be transformed by the renewing of your mind." — Romans 12:2

**Kingdom Mind** is a minimalist digital sanctuary for spiritual reflection. An AI mentor guides you through conversations about identity, purpose, mindset, relationships, vision, action, and legacy.

## The Experience

- **Open and Chat** - No accounts, no login, no friction
- **Your Data, Your Device** - Everything encrypted and stored locally in your browser
- **7 Domains** - Identity, Purpose, Mindset, Relationships, Vision, Action, Legacy
- **Breakthrough Moments** - AI recognizes insights and tracks your growth
- **Backup & Restore** - Export via QR code, transfer between devices

## Architecture

Kingdom Mind uses a **Sanctuary Architecture** - client-side first, privacy by design:

```
┌─────────────────────────────────────────────────────┐
│                    Your Browser                      │
│  ┌───────────────────────────────────────────────┐  │
│  │           IndexedDB (Encrypted Blob)          │  │
│  │  • Your breakthroughs                         │  │
│  │  • Your progress across 7 domains             │  │
│  │  • Your preferences                           │  │
│  │  • AES-256-GCM encrypted                      │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                         │
                         │ Encrypted blob sent with each message
                         ▼
┌─────────────────────────────────────────────────────┐
│                     Server                           │
│  • Decrypts blob                                    │
│  • Sends context to AI                              │
│  • Parses breakthrough tags                         │
│  • Re-encrypts blob                                 │
│  • Returns to browser                               │
│  • STORES NOTHING about you                         │
└─────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL (config only) |
| Storage | IndexedDB (Dexie.js) |
| Encryption | AES-256-GCM |
| AI | X.AI (Grok) |
| Infra | Docker, Cloudflare Tunnels |

## Routes

The entire app is 2 API routes:

```
Route (app)
├ ○ /                     # Main page
├ ƒ /api/app/config       # UI configuration
└ ƒ /api/sanctuary/chat   # Chat endpoint
```

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL and XAI_API_KEY

# Run development server
npm run dev

# Open http://localhost:3000
```

## Environment Variables

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/kingdom_mind
XAI_API_KEY=your-xai-api-key
XAI_MODEL=grok-3
SANCTUARY_ENCRYPTION_KEY=your-32-byte-base64-key
```

## Documentation

| Document | Purpose |
|----------|---------|
| **[ROADMAP.md](./ROADMAP.md)** | Master document - all planning, decisions, architecture |
| [CLAUDE.md](./CLAUDE.md) | AI instructions for Claude Code |
| [GEMINI.md](./GEMINI.md) | AI instructions for Gemini |

## Production

```bash
# Build
npm run build

# Docker (recommended)
docker-compose up -d

# Access at http://localhost:4000
```

## Backup & Restore

- **Settings > Backup Journey** - Export your data as a QR code or file
- **Settings > Restore Journey** - Scan QR or import file on new device
- Your data never leaves your control

---

*All glory to God.*
