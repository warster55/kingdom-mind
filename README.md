# Kingdom Mind - Digital Sanctuary

"Be transformed by the renewing of your mind." (Romans 12:2)

## Architecture: The Conversational OS
Kingdom Mind is a faith-based transformation application designed as a "Zero-UI" conversational experience. The interface is a persistent, context-aware mentoring session where the AI orchestrates the entire user journey.

### Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v3 (Stone & Amber palette)
- **Database:** PostgreSQL (via Drizzle ORM)
- **Authentication:** NextAuth.js
- **AI Integration:** Google Gemini 1.5 Flash (Primary), OpenAI, Ollama
- **Infrastructure:** Docker, Cloudflare Tunnels, GitHub Actions (CI/CD)

## Deployment Status
The project is configured for automated deployment via GitHub Container Registry (GHCR) and Watchtower on EC2.

### Local Development
1. Start the dev stack: `docker-compose up`
2. Access the app: `http://localhost:4000`

### Production
- **URL:** [https://kingdomind.com](https://kingdomind.com)
- **Host:** AWS EC2 (SSP Dashboard)
- **Management:** Professional Git flow via Master branch.

## Navigation Commands
The application is controlled via conversational slash commands:
- `/status` - View your transformation progress.
- `/reset` - Complete the current session and start fresh.
- `/theme` - Toggle between light and dark modes.
- `/logout` - Securely sign out of the sanctuary.