# GEMINI.md

This file provides guidance to Gemini when working with code in this repository.

## Mandatory Protocols

- **READ-ONLY DEFAULT:** Do not create, edit, or delete any files without explicit permission for each specific modification.
- **PLAN APPROVAL:** The Architect must approve a full development plan before executing any code changes.
- **STAY ON TRACK:** Prioritize fixing existing issues before implementing new features.
- **SOVEREIGN PROTOCOL:** The creator's identity must remain invisible. No personal attribution anywhere.
- **VERIFICATION PROTOCOL:** After every code change, run `scripts/sovereign-check.ts` to verify system health.

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
- **Authentication:** TOTP + Seed Phrase (no email, AWS SES removed)
- **AI Engine:** OpenRouter (privacy proxy), xAI Grok (current primary)
- **Infrastructure:** Local Ubuntu Server + Cloudflare Tunnels (EC2 Decommissioned)
- **Payments:** Bitcoin (Lightning Network + On-chain)
- **Voice (Planned):** Whisper.cpp (STT) + Piper (TTS)
- **Architect Memory (Planned):** SQLite + FTS5

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
npm run test:factory           # Create test data

# Build
npm run build                  # Production build
npm run lint                   # ESLint check

# Utility Scripts
npx tsx scripts/sovereign-check.ts    # System health probe
npx tsx scripts/eval-mentor.ts        # AI evaluation suite
```

## Architecture & Roadmap Highlights

### Phase 2B: Privacy-First Memory (v8.0)
- **Core Rule:** Insight CONTENT never leaves the server.
- **Mechanism:** AI receives metadata only ("Breakthrough in Identity 3 days ago").
- **PII Stripping:** Original insights are sanitized of names/dates BEFORE storage.

### Phase 9: Voice Chat + Proprietary Tools (Planned)
- **Goal:** In-app voice control for Architect dashboard.
- **Stack:** Whisper.cpp (STT) -> OpenRouter AI -> Piper (TTS).
- **Tools:** Custom file/bash tools (no vendor lock-in like Claude SDK).

### Phase 10: Local Production (Active)
- **Setup:** Production runs on local Ubuntu machine via Cloudflare Tunnel (`km-production`).
- **Ports:** Prod: 4000, Dev: 3000, DB: 5434.
- **Status:** AWS EC2 fully decommissioned.

### Phase 11: Infinite Chat Log (Planned)
- **Target:** Architect mode only.
- **Storage:** Local SQLite database with FTS5 search.
- **Retention:** Permanent (unlike Mentor chat 30-day purge).

### Phase 12: Security Intelligence (Planned)
- **Components:** Cloudflare Edge + Local Middleware + AI Agent.
- **Action:** AI analyzes logs every 15m to auto-block threats.

### Core Principles

1. **Privacy First** - User data never leaves the system unnecessarily.
2. **Self-Sovereignty** - Users own their identity via cryptographic seed phrases.
3. **Closed Box** - Minimize external service dependencies.
4. **No Attribution** - The app exists to serve, not to promote its creator.
5. **Simplicity** - Fewer features, fewer failure points.

## Current Priorities (Executive Review)

1.  **Technical Debt:** Fix 100+ ESLint errors and implement proper connection pooling.
2.  **Testing:** Add unit tests (currently 0) and expand E2E coverage.
3.  **Security:** Hardening encryption key management (remove hardcoded fallbacks).
4.  **Sustainability:** Implement Phase 7 (Bitcoin Gifts) to cover AI costs.

## Security Notes

- **Never open source** - Codebase is proprietary and confidential.
- AES-256-GCM encryption for sensitive data.
- All user data encrypted with seed-derived keys.
- Cloudflare tunnel for access (server not directly exposed).
- No email-based authentication.