# Kingdom Mind

> "Be transformed by the renewing of your mind." — Romans 12:2

**Kingdom Mind** is a digital sanctuary for spiritual formation. A conversational AI mentor guides users through a 21-step curriculum of inner transformation across 7 life domains.

## The Experience

- **The Mentor:** An AI companion for spiritual guidance and growth
- **7 Domains:** Identity, Purpose, Mindset, Relationships, Vision, Action, Legacy
- **21 Steps:** A structured curriculum for lifelong transformation
- **Star Map:** Visual representation of your spiritual journey

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL + Drizzle ORM |
| Auth | TOTP + Seed Phrase |
| AI | OpenRouter (multi-provider) |
| Infra | Docker, Cloudflare Tunnels |
| Payments | Bitcoin (Lightning + On-chain) |

## Quick Start

```bash
npm install
npm run dev
```

## Documentation

| Document | Purpose |
|----------|---------|
| **[ROADMAP.md](./ROADMAP.md)** | Master document - all planning, decisions, and architecture |
| [CLAUDE.md](./CLAUDE.md) | AI instructions for Claude Code |
| [GEMINI.md](./GEMINI.md) | AI instructions for Gemini |

**See ROADMAP.md for complete project details.**

## Security

- User data encrypted with seed-derived keys
- No email-based authentication
- Cloudflare tunnel protection
- Self-sovereign identity via 20-word recovery phrase

## Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run db:push      # Push database schema
npm run test         # Run tests
```

---

*All glory to God.*
