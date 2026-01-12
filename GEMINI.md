# Kingdom Mind - Project Context

## Mandatory Protocols
- **READ-ONLY DEFAULT:** I am strictly forbidden from creating, editing, or deleting any files, or executing any shell commands that modify the system, without explicit, per-action permission from the Architect for EVERY specific modification.
- **PLAN APPROVAL:** The Architect must always approve a full development plan before I execute any code changes or system-modifying commands.
- **STAY ON TRACK:** Prioritize fixing existing issues and completing current phase tasks. New features or recommendations will be planned but not implemented until current broken functionalities are resolved and the current phase is complete.
- **SOVEREIGN PROTOCOL:** No code walls, mandatory probes after every change, and the creator's identity must remain erased.

## Project Overview
**Kingdom Mind** is a faith-based transformation web application designed to help users "be transformed by the renewing of their mind" (Romans 12:2). It features a "Reflect" design philosophy—minimalist, peaceful, and focus-driven.

- **Production IP:** `3.131.126.239`

### Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 (Stone & Amber palette)
- **Database:** PostgreSQL (via Drizzle ORM)
- **Authentication:** NextAuth.js
- **AI Integration:** OpenAI, Google Generative AI, Anthropic SDK
- **Testing:** Vitest (Unit), Playwright (E2E)

## Architecture

### The "Reflect" UI
- **Full-Screen Canvas:** Sidebar is hidden by default (Drawer style).
- **Minimal Branding:** Centered "Kingdom Mind" title at the top; no persistent header bars.
- **Warm Aesthetic:** Uses `bg-stone-50` and `font-serif` for a "book-like" and inviting feel.
- **Reflect States:**
  - **Idle:** Centered greeting and minimalist Scripture of the Day.
  - **Active:** Full-width, borderless AI Mentor chat centered for focus.

### Directory Structure
- **`app/`**: Next.js App Router.
  - **`(auth)/reflect/`**: The core "Reflect" experience (kept as `/reflect` route for internal logic).
  - **`api/mentoring/main`**: Singleton session logic for the chat.
- **`components/`**: 
  - **`mentoring/StreamingChat.tsx`**: Main interaction component.
  - **`progress/ActiveFocusCard.tsx`**: Linear journey driver.
- **`lib/`**:
  - **`hooks/useStreamingChat.ts`**: Real-time message orchestration.
  - **`config/navigation.config.ts`**: Streamlined navigation paths.

## Development Workflow

### Service Management
The development server is managed as a **systemd user service**.
- **Restart Service:** `systemctl --user restart kingdom-mind.service`
- **Check Status:** `systemctl --user status kingdom-mind.service`
- **Stop Service:** `systemctl --user stop kingdom-mind.service`

### Manual Scripts
| Command | Description |
| :--- | :--- |
| `npm run build` | Verify types and build for production |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:push` | Push schema to database |
| `npm run test:e2e` | Run Playwright journey tests |

## Key Patterns
- **Linear Journey:** Users are guided through 7 domains one at a time via the "Active Focus" card.
- **Event-Driven Chat:** External components trigger chat messages via the `trigger-chat-message` custom DOM event.
- **Concise AI:** System prompts are configured to prioritize short, conversational responses.

## Current Status
- **Completed:** Reflect layout overhaul, naming transition (from Dashboard to Reflect), singleton chat, linear journey integration.
- **Next Steps:** 
  - Refine library modules to match Reflect aesthetic.
  - Expand "Active Focus" logic.
