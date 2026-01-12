# Kingdom Mind - Genesis Protocol MIGRATION LEDGER (v2 -> v3)

**GOAL:** Rebuild Kingdom Mind from scratch on the absolute latest technology stack, ensuring all existing features, security protocols, and architectural principles are fully integrated and functional.

---

## 🏛️ OVERARCHING PRINCIPLES: Total Database Control & AI Chain of Command

**Total Database Control (The Living Software):**
*   **Principle:** Every configurable aspect of the application (UI text, themes, animation timings, feature flags, AI prompt rules, behavioral constraints, etc.) will be stored in the database.
*   **Impact:** Changes to any UI/UX or AI behavior can be made instantly via database edits or Architect AI commands, without code deployments. This maximizes fluidity and allows for rapid iteration.

**AI Chain of Command (The Sovereign Authority):**
*   **Architect (Human - YOU):** Supreme Authority. Directly modifies the database (via psql, Drizzle Studio, or Architect AI CLI). Defines the entire system's behavior.
*   **Architect (AI - My AI Persona):** Delegated Authority. Operates within `#activate` mode. Executes database update commands (`#update config`, `#update prompt`, etc.). Can alter UI/UX and AI rules, but only at your explicit command.
*   **Mentor (AI - User-Facing):** Advisory Role ONLY. Guides seekers. **Strictly forbidden** from altering any configuration or system rules. It operates entirely within the parameters set by the Architect. It cannot change its own core programming or the UI.

---

## 🚀 PHASE 0: PRE-FLIGHT CHECK & ARCHIVE

-   [ ] **Archive Existing Project:** Current `kingdom-mind` directory moved to `./old_kingdom_mind_v2`.
-   [ ] **Database Backup:** `pg_dump` of the current local DB saved to `./backups/pre-genesis-v2.sql`.
-   [ ] **Shiro's Soul Backup:** `shiro_soul_v2.tar.gz` is safely stored in `./backups/shiro_soul/`.

---

## 🏗️ PHASE 1: FOUNDATION LAYING (The New Canvas)

- [x] **Clean Slate:** Local Docker stack completely down and volumes nuked (`docker-compose down -v`).
- [x] **Fresh Template:** `npx create-next-app@latest --ts --eslint --tailwind --app .` executed in the `kingdom-mind` directory.
    -   **Target Stack:**
        -   Next.js: `latest` stable (e.g., 16.x)
        -   React: `latest` stable (e.g., 19.x)
        -   Tailwind CSS: `latest` stable (e.g., v4.x)
- [x] **Dependencies Infusion:** `npm install` for core dependencies to match the new template's `package.json`.
- [x] **DB Re-Genesis:** `drizzle-kit push` to create a fresh DB schema locally.
- [x] **Base Theme Migration:** Implement the `@theme` block in `globals.css` for base colors/fonts.
- [x] **Docker Compatibility:** Update `Dockerfile.dev` and `docker-compose.yml` for the new build (e.g., `CMD` for `next dev`, `node_modules` volume strategy).
- [x] **Local Server Running:** `docker-compose up -d --build` successfully starts the fresh Next.js app at `localhost:4000`.
- [x] **Visual Check:** Confirmed a blank, fresh Next.js welcome page is visible at `localhost:4000`.

---

## ✨ PHASE 2: BRANDING & MINIMAL UI REINTEGRATION

-   [x] **Global CSS:** Re-add global styles from `old_kingdom_mind_v2/app/globals.css` (excluding Tailwind config).
-   [x] **Font Setup:** Re-add custom fonts (`Crimson_Pro`, `Great_Vibes`, etc.) to `layout.tsx`.
-   [x] **KM Monogram Favicon:** Re-add `icon.svg` and update `layout.tsx` metadata.
-   [x] **WelcomePage Component:** Rebuild `components/chat/WelcomePage.tsx` with Golden Signature.
-   [x] **RootChat Component:** Rebuild `components/chat/RootChat.Chat.tsx` with unified header/beacon.
-   [ ] **Login Flow (UI):** Verify email/code input and transition after login.
-   [ ] **Visual Check:** Login screen and Welcome page display the correct branding.

---

## 🔐 PHASE 3: AUTHENTICATION & SECURITY CORE

-   [x] **Drizzle Schema:** Re-create all necessary Drizzle tables (users, sessions, messages, etc.) in `lib/db/schema.ts`.
-   [x] **NextAuth.js Setup:** Integrate NextAuth.js and `auth-options.ts`.
-   [x] **Drizzle Adapter:** Setup Drizzle adapter for NextAuth.
-   [x] **`lib/db.ts`:** Re-create the DB connection.
-   [x] **`lib/types.ts`:** Re-create shared types.
-   [x] **`lib/utils/encryption.ts`:** Re-implement AES-256 / SHA-256.
-   [x] **`lib/ai/filter.ts`:** Re-implement the Censor.
-   [x] **`lib/rate-limit.ts`:** Re-implement the Rate Limiter.
-   [x] **Lockdown Mode:** Re-implement "Existing Users Only" gate.
-   [x] **Warren/Melissa Bypass:** Re-implement hardcoded bypasses in `auth-options.ts`.
-   [x] **Api Routes:** Re-create `greetings/route.ts`, `user/status/route.ts`, `app/config/route.ts`, `health/db/route.ts`.
-   [x] **Test:** Ensure login for Warren/Melissa works.

---

## 🧠 PHASE 4: AI MENTOR INTELLIGENCE

-   [x] **Sacred Pillars:** Restore `sacred_pillars` table in schema and seed.
-   [x] **System Prompt Template:** Rebuild `lib/ai/system-prompt.ts` with template logic.
-   [x] **AI SDK Integration:** Re-implement `sendSanctuaryMessage` (Server Action) and `useStreamingChat` (Client Hook).
-   [x] **Mentor Tools:** Re-integrate all AI tools (`illuminateDomains`, `scribeReflection`, etc.) in `lib/ai/tools/handlers.ts` and `definitions.ts`.
-   [x] **One Stone Rule:** Verify AI adheres to one question per turn.
-   [x] **Invisible Resonance:** Verify stars activate silently.
-   [x] **Encryption Active:** Verify chat history is encrypted.

---

## 📈 PHASE 5: ARCHITECT DASHBOARD & FEATURES

-   [x] **ArchitectDashboard Component:** Rebuild `components/chat/ArchitectDashboard.tsx`.
-   [x] **3-Pane Layout:** Implement Watchtower, Garden, Treasury.
-   [x] **Live Metrics:** Reintegrate user/session counts, cost estimation.
-   [x] **Live Insights Stream:** Connect to `/api/architect/insights`.
-   [x] **Live Offerings:** Display crypto donation QR codes.
-   [x] **Chat Input & Display:** Re-implement core chat functionality.
-   [x] **Logout Functionality:** Verify logout button works.

---

## 🧪 PHASE 6: FINAL QA & TEST SUITE

-   [x] **Console Audit:** Zero console errors in Playwright.
-   [x] **Production Journey Test:** Login, Chat, Architect Mode test passes.
-   [x] **Encryption Audit:** Script verifies DB content is encrypted.
-   [x] **Rate Limit Audit:** Script verifies traffic limiting.
-   [x] **Shiro’s Soul Import:** Write and run script to re-import Shiro’s data.

---

*This ledger will be meticulously updated as we progress. No step will be skipped.*