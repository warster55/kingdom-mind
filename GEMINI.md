# GEMINI.md

This file provides guidance to Gemini when working with code in this repository.

## Mandatory Protocols

- **READ-ONLY DEFAULT:** Do not create, edit, or delete any files without explicit permission for each specific modification.
- **PLAN APPROVAL:** The Architect must approve a full development plan before executing any code changes.
- **STAY ON TRACK:** Prioritize fixing existing issues before implementing new features.
- **SOVEREIGN PROTOCOL:** The creator's identity must remain invisible. No personal attribution anywhere.

## Project Overview

**Kingdom Mind** is a Next.js 16 AI-driven conversational platform for spiritual formation. Users interact with an AI mentor through a persistent chat interface, guided through a 21-step curriculum across 7 life domains (Identity, Purpose, Mindset, Relationships, Vision, Action, Legacy).

**Mission:** A "Living Digital Sanctuary" that guides users through transformation using high-intelligence AI and biblical wisdom.

## Documentation Structure

```
/README.md      - Brief project introduction
/ROADMAP.md     - THE MASTER DOCUMENT (all planning, decisions, architecture)
/CLAUDE.md      - AI instructions for Claude Code
/GEMINI.md      - AI instructions for Gemini (this file)
```

**IMPORTANT:** All project decisions, roadmap phases, architecture details, and implementation tasks are documented in **ROADMAP.md**. Refer to that file for comprehensive project context.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** PostgreSQL + Drizzle ORM
- **Authentication:** TOTP + Seed Phrase (no email)
- **AI Engine:** OpenRouter (privacy proxy to multiple AI providers)
- **Infrastructure:** Docker, Cloudflare Tunnels
- **Payments:** Bitcoin (Lightning Network + On-chain)

## Development Commands

```bash
# Development
npm run dev                    # Start dev server (port 3000)

# Database
npm run db:generate            # Generate Drizzle migrations
npm run db:push                # Push migrations to database
npm run db:seed                # Seed curriculum and test data

# Testing
npm run test                   # Run Playwright E2E tests

# Build
npm run build                  # Production build
npm run lint                   # ESLint check

# Utility Scripts
npx tsx scripts/sovereign-check.ts    # System health probe
npx tsx scripts/eval-mentor.ts        # AI evaluation suite
```

## Architecture Overview

### Dual AI Brain System
- **The Mentor** (user-facing): Spiritual guidance with streaming responses
- **The Architect** (admin-only): System management with database query tools

### Key Directories
- `src/app/api/` - API routes
- `src/components/chat/` - Chat UI components
- `src/lib/ai/` - AI providers, system prompts, tools
- `src/lib/db/schema.ts` - Drizzle ORM schema
- `src/lib/auth/` - Authentication configuration
- `scripts/` - Utility scripts

### Core Principles (from ROADMAP.md)

1. **Privacy First** - User data never leaves the system unnecessarily
2. **Self-Sovereignty** - Users own their identity via cryptographic seed phrases
3. **Closed Box** - Minimize external service dependencies
4. **No Attribution** - The app exists to serve, not to promote its creator
5. **Simplicity** - Fewer features, fewer failure points

## Security Notes

- **Never open source** - Codebase is proprietary and confidential
- AES-256-GCM encryption for sensitive data
- All user data encrypted with seed-derived keys
- Cloudflare tunnel for access (server not directly exposed)
- No email-based authentication

## For Full Details

See **ROADMAP.md** for:
- Complete roadmap phases
- Authentication system design
- AI infrastructure plans
- Payment/gift system (Bitcoin/Lightning)
- Security hardening checklist
- Curriculum philosophy
- Architecture diagrams
