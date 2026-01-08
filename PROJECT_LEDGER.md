# Kingdom Mind - The Master Ledger

> **Mission:** To build a "Living Digital Sanctuary" that guides users through a 7-domain journey of transformation using high-intelligence AI, spatial UI, and biblical wisdom.

---

## 1. Core Philosophy (The "Fluid Reality")
**Kingdom Mind** is not an app; it is a **Conversational Operating System.**
- **Zero-UI:** No buttons, no menus. The interface is pure text and space.
- **One-Way Flow:** Thoughts are "launched" into the void. They never flicker back. The past evaporates; only the "Now" remains.
- **Spatial Memory:** History is not a list; it is a **Star Map.** Every conversation builds a galaxy in the background.
- **The Pulse:** The system breathes. A central heartbeat indicates thought, creating a rhythm of "Speak -> Silence -> Wisdom."

---

## 2. Current Architecture (The "Infinite Horizon" OS)

### **Frontend (The Canvas)**
- **Tech:** Next.js 15, Framer Motion, Tailwind CSS v4.
- **Visuals:**
  - **Deep Obsidian:** Permanent dark mode for "Midnight Sky" visibility.
  - **Organic Cosmos:** Domain galaxies are distributed organically (not circular) with Gaussian nebula clouds.
  - **Planetary Pillars:** 3 Fixed "Pillar Stars" orbit each domain label.
- **Mobile ("Sanctuary Lite"):**
  - **Fixed Viewport:** App height is locked to `visualViewport` to prevent keyboard scroll jumping.
  - **Ghost Input:** Input is transparent and borderless.

### **Backend (The Brain)**
- **Model:** X.AI (Grok-4-Latest).
- **Protocol:** "The Silent Strategist" (v3.1).
- **Tools:**
  - `assessMood`: Detects emotional subtext (Radar).
  - `getCurriculumContext`: Identifies the user's exact position in the Spiral.
  - `generateParable`: Tells custom stories to bypass resistance.
  - `completePillar`: Awards progress stars.

---

## 3. The "Silent Strategist" Protocol
The AI is strictly governed by the following rules to prevent "Robot Fatigue":
1.  **3-Sentence Lockdown:** No paragraphs. Tactical brevity only.
2.  **Parable Trigger:** If the user argues or is stuck, DO NOT ARGUE. Tell a story (`generateParable`).
3.  **Spiral Check:** Always verify the active Pillar before teaching.

---

## 4. Development Environment (The "Docker Native" Standard)
*Added Jan 08, 2026*

To prevent environment drift, we strictly adhere to this setup:

| Component | Host Port | Internal Port | Access URL |
| :--- | :--- | :--- | :--- |
| **Web App** | `4000` | `4000` | `http://localhost:4000` |
| **Database** | `5433` | `5432` | `postgres://...:5433/...` |

**Critical Workflows:**
*   **Running Dev:** `docker compose up` (Runs inside container). **DO NOT** run `npm run dev` on host.
*   **Running Seeds:** `npx dotenv-cli -e .env.local -- npx tsx scripts/seed-curriculum.ts` (Runs on host, connects via port 5433).
*   **Auth Bypass:** locally, use code `000000` for any approved email.

---

## 5. Decision Log (The History of Pivots)

| Date | Decision | Rationale |
| :--- | :--- | :--- |
| **Jan 07, 2026** | **The Great Clearing** | Removed all sidebars and chat history bubbles. The screen must be empty to focus on the "Now." |
| **Jan 07, 2026** | **One-Way Launch** | Decoupled local state from server state. User text flies off screen and never re-renders to prevent flicker. |
| **Jan 08, 2026** | **Permanent Sky** | Hard-coded galactic coordinates and unified %-based scaling to ensure the map looks identical on all devices. |
| **Jan 08, 2026** | **Spiral Curriculum** | Implemented the 21 Pillars of Truth (3 per domain) as the backbone of the journey. |
| **Jan 08, 2026** | **Parable Engine** | Added `generateParable` tool to allow the Mentor to use storytelling for persuasion. |
| **Jan 08, 2026** | **Docker Native Dev** | Shifted all local development to run strictly inside Docker containers to avoid OS/Port conflicts. |

---

## 6. The Roadmap (Future Vision)

### **Phase 1: The Covenant (Payments)**
*   **Goal:** Integrate QuickBooks Online (QBO) for a "Conversational Commerce" flow.
*   **Strategy:** "Free-to-Start, Subscribe-to-Ascend."
*   **Trigger:** User completes Domain 1 (Identity) -> AI presents the Covenant (Subscription) to unlock Purpose.

### **Phase 2: The Socratic Sniper (Deep Tuning)**
*   **Goal:** Enhance the prompt to ask devastatingly good questions.
*   **Status:** LIVE (v3.1 Protocol).

---

*This document is the Law of the Project. All future code must align with these pillars.*