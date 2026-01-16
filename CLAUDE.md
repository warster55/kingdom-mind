# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Documentation Structure

```
/README.md      - Brief project introduction
/ROADMAP.md     - THE MASTER DOCUMENT (all planning, decisions, architecture)
/CLAUDE.md      - AI instructions for Claude Code (this file)
/GEMINI.md      - AI instructions for Gemini
```

**IMPORTANT:** All project decisions, roadmap phases, architecture details, and implementation tasks are documented in **ROADMAP.md**. Refer to that file for comprehensive project context.

## Project Overview

**Kingdom Mind** is a Next.js 16 AI-driven conversational platform for spiritual formation. Users interact with an AI mentor through a persistent chat interface, guided through a 21-step curriculum across 7 life domains (Identity, Purpose, Mindset, Relationships, Vision, Action, Legacy).

## Development Commands

```bash
# Development
npm run dev                    # Start dev server (port 3000)

# Database (requires .env.local)
npm run db:generate            # Generate Drizzle migrations from schema
npm run db:push                # Push migrations to database
npm run db:seed                # Seed curriculum and test data

# Testing
npm run test                   # Run Playwright E2E tests
npm run test:factory           # Create test data

# Build
npm run build                  # Production build
npm run lint                   # ESLint check

# Utility Scripts
npx tsx scripts/sovereign-check.ts       # System health probe
npx tsx scripts/eval-mentor.ts           # AI evaluation suite
```

## Architecture

### Dual AI Brain System
- **The Mentor** (user-facing): Spiritual guidance with streaming responses
- **The Architect** (admin-only): System management with database query tools

### Key Directories
- `src/app/api/` - API routes (auth, architect, user endpoints)
- `src/components/chat/` - Chat UI components (RootChat, ChatMessage, ChatInput)
- `src/lib/ai/` - AI providers, system prompts, tool definitions
- `src/lib/db/schema.ts` - Drizzle ORM schema
- `src/lib/auth/auth-options.ts` - NextAuth.js configuration
- `scripts/` - Database seeding, evaluation, deployment utilities

### Data Flow
1. Chat messages sent via server action `sendSanctuaryMessage()` in `src/lib/actions/chat.ts`
2. AI responses stream via Vercel AI SDK's `createStreamableValue()`
3. Special tags in AI output trigger client behavior:
   - `[RESONANCE: domain]` - Increment domain resonance
   - `[BREAKTHROUGH: text]` - Create visual "star" and save insight

### Database
PostgreSQL with Drizzle ORM. Key tables:
- `users` - Profiles with 7-domain resonance tracking
- `curriculum` - 21-step curriculum structure
- `chat_messages` - Encrypted conversation history (30-day retention)
- `insights` - Encrypted breakthrough moments (permanent)
- `system_prompts` - Versioned AI prompt templates
- `app_config` - Database-driven configuration KV store

### Security
- AES-256-GCM encryption for sensitive data
- All user data encrypted with seed-derived keys
- Cloudflare tunnel (server not directly exposed)
- No email-based authentication (TOTP + seed phrase)
- **Never open source** - codebase is proprietary

## Port Standards (IMPORTANT - MEMORIZE THIS)

| Environment | Port | Container Name |
|-------------|------|----------------|
| **Production** | **4000** | `km-prod` |
| **Development** | **3000** | N/A (npm run dev) |

**Cloudflare tunnel ALWAYS points to port 4000. Never change this.**

### Simple Deployment Process
```bash
# 1. Build the new image
docker build -t km-app:latest .

# 2. Quick swap (only ~1 second downtime)
docker stop km-prod && docker rm km-prod && \
docker run -d --name km-prod \
  --env-file .env.production.local \
  -e NODE_ENV=production \
  -e PORT=4000 \
  -e DATABASE_URL="postgresql://kingdom_user:<password>@db:5432/kingdom_mind" \
  -p 4000:4000 \
  --network km-master_km-prod-net \
  --restart unless-stopped \
  km-app:latest
```

**NO blue-green deployment. NO multiple containers. Simple and clean.**

## Key Environment Variables

```
DATABASE_URL              # PostgreSQL connection string
NEXTAUTH_SECRET          # NextAuth session secret
IDENTITY_SALT            # HMAC salt for email hashing
ENCRYPTION_KEY           # 32-byte base64 key for AES encryption
OPENROUTER_API_KEY       # AI provider (via OpenRouter proxy)
```

## Common Workflows

**Modify System Prompt:** Edit via Architect mode (`/architect` in chat) or directly in `system_prompts` table.

**Add Database Table:** Edit `src/lib/db/schema.ts`, run `npm run db:generate`, then `npm run db:push`.

**Add API Endpoint:** Create file at `src/app/api/[route]/route.ts`, export GET/POST handlers.

## For Full Details

See **ROADMAP.md** for:
- Complete roadmap phases (7 phases documented)
- Authentication system design (TOTP + seed phrase)
- AI infrastructure plans (OpenRouter now, self-hosted future)
- Payment/gift system (Bitcoin Lightning + on-chain)
- Security hardening checklist (30+ items)
- Curriculum philosophy
- Architecture diagrams
