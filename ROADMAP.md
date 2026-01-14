# Kingdom Mind - Product Roadmap

> Last Updated: January 13, 2026 (Privacy & Encryption Architecture)
> Status: Active Development

---

## Vision Statement

Kingdom Mind is a completely **closed-box** spiritual formation platform. All data stays within the system. No external dependencies for core functionality. Users own their identity cryptographically. All glory to God.

**This project will NEVER be open source.** The codebase, architecture, and implementation details are proprietary and confidential. Nothing about how this system works should ever be discoverable by external parties.

---

## Core Principles

1. **Privacy First** - User data never leaves the system unnecessarily
2. **Self-Sovereignty** - Users own their identity via cryptographic seed phrases
3. **Closed Box** - Minimize external service dependencies
4. **No Attribution** - The app exists to serve, not to promote its creator
5. **Mission Focus** - Every feature serves spiritual transformation
6. **Simplicity** - Fewer features, fewer failure points. Complexity is the enemy.
7. **Lifelong Growth** - Users should always have something new to learn, regardless of age

---

## Roadmap Items

### Phase 1: Authentication Overhaul (High Priority)

**Goal:** Remove AWS SES dependency, implement self-contained authentication with zero email.

#### Authentication Tiers:

**REQUIRED - TOTP Authenticator App**
- Every user MUST set up an authenticator app (Google Authenticator, Authy, etc.)
- User scans QR code during initial signup
- Generates time-based codes locally
- Zero external service calls
- This is non-negotiable for all users

**SECONDARY - Biometric/Passkeys (WebAuthn)**
- If user's device supports fingerprint or Face ID, offer this as additional option
- Works on mobile (fingerprint, Face ID) and desktop (Windows Hello, Touch ID)
- Not required, but encouraged if available
- Provides convenience without compromising security

**OPTIONAL - Hardware Security Keys**
- YubiKey and similar FIDO2 devices supported
- Offered as premium security option
- User purchases their own hardware
- Highest security tier for those who want it

**FORBIDDEN - Email-Based Authentication**
- NO email codes, ever
- NO "magic links"
- NO password reset via email
- Email is not used for authentication under any circumstances

#### Seed Phrase System:

**Generation:**
- 20-word BIP39 mnemonic created at the moment of account signup
- Seed phrase is used to derive encryption keys for ALL user data
- Everything stored in database is encrypted with keys derived from this seed

**Revelation:**
- Seed phrase shown to user AFTER onboarding is complete (not during)
- Less overwhelming, user is already invested
- Clear, serious warning displayed:

```
YOUR 20-WORD RECOVERY PHRASE

Write these words down and store them in a safe place.

⚠️ CRITICAL: If you lose access to your authenticator app AND lose
this recovery phrase, your account and ALL your data are PERMANENTLY
UNRECOVERABLE. There is no "forgot password" option. No one - not even
the system administrators - can access your data without this phrase.

This extreme security exists to protect YOU. Your spiritual journey,
your breakthroughs, your insights - they belong to you alone.
```

**Recovery:**
- User enters 20 words to recover account
- System derives encryption keys from seed
- Data is decrypted and access restored
- New TOTP can be set up after seed recovery

**Lost Access Policy:**
- If user loses BOTH authenticator AND seed phrase: account is gone forever
- No admin backdoor
- No recovery process
- True sovereignty = true responsibility

#### Encryption Architecture: Practical Sovereignty

**Decision:** Per-user encryption keys derived from seed phrase.

**Flow:**
1. User creates account → 20-word seed phrase generated (BIP39)
2. Encryption key derived from seed using HKDF
3. Derived key stored in DB, encrypted with (user_id + server_secret)
4. At login, server decrypts user's key, loads into session
5. All user data encrypted/decrypted with their personal key

**What this provides:**
- ✅ Everything encrypted at rest (AES-256-GCM)
- ✅ Per-user keys (breach doesn't expose everyone with same key)
- ✅ Seed phrase recovery (re-derives the same key)
- ✅ No UX friction (seed not required at every login)
- ✅ Decryption overhead negligible (~0.01ms per item)

**Architecture:**
- NOT zero-knowledge (server CAN decrypt with session key)
- Policy-based trust: server has ability but policy says it won't
- Protects against: database breach, stolen backups, unauthorized DB access

#### Implementation Tasks:
- [ ] Remove ALL AWS SES integration
- [ ] Implement TOTP setup flow with QR code generation
- [ ] Build BIP39 seed phrase generation at signup
- [ ] Implement HKDF key derivation from seed phrase
- [ ] Add `encryptedUserKey` column to users table
- [ ] Store encrypted user key at signup
- [ ] Load user key into session at login
- [ ] Migrate encryption to use per-user keys
- [ ] Implement WebAuthn/Passkey as secondary auth
- [ ] Implement hardware key (FIDO2) support as optional
- [ ] Create seed phrase reveal screen (post-onboarding)
- [ ] Design clear warning messaging for seed reveal
- [ ] Implement seed phrase recovery flow
- [ ] Update database schema for new auth methods
- [ ] Migration path for existing users (derive keys from user_id + server_secret)

---

### Phase 2: AI Infrastructure (High Priority)

**Goal:** Privacy-first AI access with clear path to eventual self-hosting.

#### Current Approach: OpenRouter

- Aggregates 100+ AI models through single API
- Privacy layer: AI providers don't see our domain or users
- Maximum model flexibility
- Request flow: `User -> Kingdom Mind -> OpenRouter -> AI Provider`
- Priority: Security first, then capability

#### Model Strategy: Hybrid (Current)

- Non-reasoning model for general conversation (fast, ~3-5 sec)
- Reasoning model triggered for breakthrough moments
- Balanced speed vs depth priority

#### Future Goal: Self-Hosted AI

**Timeline:** When revenue allows (not immediate priority)

**Vision:**
- Hybrid approach: OpenRouter + Self-hosted LLMs
- Eventually: 100% self-hosted if quality matches remote AI
- AWS GPU instances (p4d/p5) or equivalent
- Run open-weight models (Llama, Mistral, etc.)
- Complete data sovereignty - nothing leaves our infrastructure

**Budget Consideration:** $2000+/month when ready

**Key Principle:** Only move to self-hosted when we can provide the SAME or BETTER experience as remote AI. User experience is non-negotiable.

**Planning Note:** All architectural decisions should consider future self-hosting. Don't create dependencies that would make this transition difficult.

#### Implementation Tasks:
- [ ] Integrate OpenRouter API
- [ ] Update provider configuration for model switching
- [ ] Build "breakthrough detection" logic for hybrid model switching
- [ ] Remove direct xAI API calls (route through OpenRouter)
- [ ] Document self-hosting architecture for future reference
- [ ] Research vLLM/TGI deployment options
- [ ] Create cost analysis for self-hosting scenarios

---

### Phase 2B: AI Memory Architecture - Privacy First (IMPLEMENTED)

**Goal:** Give the AI useful context about each user WITHOUT exposing personal information to external AI providers.

**Status:** ✅ COMPLETE (v7.0)

#### The Core Privacy Principle

**Insight CONTENT never leaves the server.**

When a user has a breakthrough like *"I forgave my father John for abandoning me in Seattle"*, that exact text:
- ✅ Gets encrypted and stored in our database
- ✅ Can be viewed by the user in-app
- ❌ NEVER gets sent to external AI (xAI, OpenRouter, etc.)

Instead, the AI receives only **metadata**: "User had a breakthrough in Identity domain, 3 days ago."

#### What Gets Sent to External AI

| Data | Sent? | Example |
|------|-------|---------|
| Current conversation | Yes (unavoidable) | The live chat messages |
| User's name | Yes | "Seeker" or their chosen name |
| Resonance scores | Yes (just numbers) | Identity: 12, Purpose: 8 |
| Days since joined | Yes (just a number) | 14 days |
| Insight **metadata** | Yes | "3 breakthroughs in Identity, most recent: yesterday" |
| Insight **content** | **NO** | Never leaves server |
| Curriculum truth content | **NO** | Only domain counts |
| Historical chat logs | **NO** | Only current session |

#### What the AI "Sees" (Example)

```
USER CONTEXT:
- Journey: 14 days in the Sanctuary
- Strong Domains: Identity (12), Purpose (8)
- Growth Areas: Relationships, Legacy
- Breakthroughs: 5 total (Identity: 3, Purpose: 2), most recent: yesterday
- Curriculum Progress: 4 truths completed (Identity: 2, Purpose: 2)
```

The AI knows the user is growing in Identity without knowing the personal details of their breakthroughs.

#### Database-Driven Configuration

All settings stored in `app_config` table, tunable via Architect mode:

| Config Key | Default | Description |
|------------|---------|-------------|
| `mentor_chat_history_limit` | 15 | Messages from current session |
| `mentor_insight_depth` | 5 | Number of breakthrough metadata entries |
| `mentor_include_resonance_scores` | true | Show domain scores to AI |
| `mentor_include_completed_curriculum` | true | Show curriculum progress counts |
| `mentor_onboarding_enabled` | false | Formal onboarding protocol |

#### Simplified Tools

The Mentor has 4 tools (no onboarding-specific tools):

1. **illuminateDomains** - Visual feedback (light up stars)
2. **recordBreakthrough** - Save insights permanently (encrypted, stays on server)
3. **incrementResonance** - Track domain growth
4. **advanceCurriculum** - Move to next truth

#### Sanitized Insights at Creation (TO IMPLEMENT)

**Decision:** The AI sanitizes breakthroughs BEFORE they're stored.

When recording a breakthrough, the Mentor removes:
- Names (people, places, organizations)
- Specific ages and dates
- Identifying details

**Example:**
- User says: "I forgave my father John for leaving us in Seattle when I was 7"
- Stored as: "Achieved forgiveness toward a parent figure for childhood abandonment"

**Why:**
- Database contains no PII (breach-safe)
- Sanitized insights CAN be sent to AI for richer context
- Spiritual essence preserved, biographical details discarded
- Users never need to see their original words - the Mentor explains their journey

**Implementation:**
- [ ] Update `recordBreakthrough` tool description to require sanitization

#### Files Modified:
- `src/lib/config/mentor-config.ts` - Config helper utility
- `src/lib/actions/chat.ts` - Privacy-first context fetching
- `src/lib/ai/system-prompt.ts` - Metadata-only injection (v7.0)
- `src/lib/ai/tools/mentor-tools.ts` - Simplified tools
- `scripts/seed.ts` - Default config values

#### Future Privacy Enhancements

| Phase | Enhancement | Status |
|-------|-------------|--------|
| Now | Metadata-only context | ✅ Complete |
| Next | Sanitized insights at creation | Planned |
| Soon | Local LLM PII scrubber for live chat | Planned |
| Future | Self-hosted inference | When revenue allows |

---

### Phase 3: Data & Memory Philosophy (High Priority)

**Goal:** Smart, minimal data storage that serves user growth without bloat.

#### Core Philosophy: Insights Over Logs

**What we SHOULD store:**
- **Insights** - Summarized breakthroughs, realizations, growth moments
- **Progress markers** - Domain resonance, curriculum advancement
- **Key context** - Important details that help the Mentor guide the user
- **Encrypted summaries** - Condensed wisdom from conversations

**What we should RECONSIDER:**
- **Full chat logs** - Every message ever sent
  - Problem: Database bloat over time
  - Problem: Most messages are not important long-term
  - Alternative: AI summarizes and extracts insights, then chat is discarded

#### Proposed Memory Model:

```
Conversation happens
       |
       v
AI extracts insights & key details
       |
       v
Insights saved to database (encrypted)
       |
       v
Chat messages discarded (or kept for limited time)
       |
       v
Next conversation: AI has insights, not full transcript
```

**Benefits:**
- Smaller database footprint
- Faster queries
- Only meaningful data persists
- User's "essence" is captured, not noise

#### Chat Retention Policy: 30-Day Rolling Window

**DECIDED:**
- Each chat message has its own 30-day lifespan
- Messages fall off individually as they age past 30 days (rolling purge, NOT batch wipe)
- Insights extracted and saved permanently (encrypted)
- AI has full recent context + lifetime of insights
- User always has ~30 days of recent conversation available

**Why this works:**
- Recent context: AI can reference "what we talked about last week"
- Long-term wisdom: Insights capture the transformation, not the noise
- Database efficiency: Chat purges prevent bloat
- Privacy: Less data stored = less exposure risk

#### Implementation Tasks:
- [ ] Design insight extraction prompts for AI
- [ ] Implement automatic summarization after conversations
- [ ] Create insight storage schema
- [ ] Build 30-day chat purge job (cron/scheduled task)
- [ ] Build insight retrieval for conversation context
- [ ] Ensure all insights are encrypted with user's seed-derived key
- [ ] Test that AI maintains coherent relationship after chat purge

---

### Phase 3B: User Reports & Export (DECIDED: NO EXPORT)

**Decision:** Data NEVER leaves the database.

#### Rationale:
- Maximum security guarantee
- No attack surface for data extraction
- "What happens in Kingdom Mind stays in Kingdom Mind"
- Aligns with closed-box philosophy

#### What Users CAN Do:
- View their insights beautifully formatted in-app
- See their progress and domain resonance
- Review their breakthrough history

#### What Users CANNOT Do:
- Download PDF reports
- Export data in any format
- Take their data outside the app

#### Trade-off Accepted:
- Users who leave cannot take their journey with them
- No offline access to insights
- This is intentional: the app IS the secure container

#### Implementation:
- No PDF generation code needed
- No export endpoints
- Consider blocking print/screenshot where technically feasible (deterrent, not prevention)

---

### Phase 4: Security Hardening (Ongoing - Critical)

**Goal:** Make Kingdom Mind impenetrable. Defense in depth.

#### Current Security Measures:
- Cloudflare reverse proxy tunnel
- AES-256-GCM encryption for sensitive data
- Email hashing (HMAC-SHA256) - though email auth being removed
- Rate limiting with Redis
- IP whitelisting for Architect dashboard

#### Additional Security Measures to Implement:

**Infrastructure:**
- [ ] Ensure server is not directly accessible (Cloudflare tunnel only)
- [ ] Database not exposed to internet (internal network only)
- [ ] Regular security audits of dependencies
- [ ] Automated vulnerability scanning (Snyk, npm audit)
- [ ] Container isolation if using Docker

**Application:**
- [ ] All database queries parameterized (SQL injection prevention)
- [ ] Content Security Policy (CSP) headers
- [ ] CORS locked down to exact domain only
- [ ] No sensitive data in client-side JavaScript
- [ ] No API keys or secrets in frontend code
- [ ] Server-side validation of all inputs
- [ ] Rate limiting on all endpoints

**Operational Security:**
- [ ] No personal identifiers in codebase
- [ ] Git history scrubbed of any sensitive commits
- [ ] No GitHub public repos (if using GitHub, private only)
- [ ] Consider self-hosted Git (Gitea, GitLab CE) for maximum control
- [ ] Secrets management (environment variables, never committed)
- [ ] Regular rotation of API keys and secrets

**AI Security:**
- [ ] System prompts cannot be extracted via user input
- [ ] Prompt injection protection
- [ ] No user ability to access admin/architect functions
- [ ] AI cannot reveal implementation details
- [ ] Conversation isolation between users

**Logging & Monitoring:**
- [ ] Log access attempts without logging sensitive data
- [ ] Anomaly detection for unusual access patterns
- [ ] Alert system for security events
- [ ] No personally identifiable information in logs

**Client-Side:**
- [ ] Disable right-click/inspect (deterrent, not prevention)
- [ ] Obfuscate client JavaScript
- [ ] No source maps in production
- [ ] Disable copy/paste in sensitive areas (if appropriate)

#### Security Principles:

1. **Assume breach** - Design so breach of one layer doesn't expose everything
2. **Least privilege** - Every component gets minimum necessary access
3. **Defense in depth** - Multiple layers, not single points of failure
4. **Security by obscurity is NOT security** - But combined with real security, obscurity helps
5. **Zero trust** - Verify everything, trust nothing

---

### Phase 5: Developer Anonymity (Ongoing)

**Goal:** Complete separation of creator identity from the product.

#### Decisions Made:
- **Anonymity Level:** Complete
  - No personal name anywhere in code, comments, or UI
  - Domain registered through privacy protection service
  - Business entity via LLC or trust (no personal name visible)
  - Payments processed through anonymous business entity

- **App Attribution:** None
  - No "About" page
  - No "Team" page
  - No "Built by" footer
  - No personal branding
  - The app simply exists - a gift that points to God, not to man

- **Code Security:**
  - NEVER open source
  - Private repositories only (or self-hosted Git)
  - No public documentation of architecture
  - Git history clean of personal identifiers

#### Implementation Tasks:
- [ ] Audit entire codebase for personal identifiers (names, emails)
- [ ] Scrub git history if any personal info exists
- [ ] Review domain registration privacy settings
- [ ] Establish anonymous business entity
- [ ] Set up privacy-preserving payment processing
- [ ] Document operational security practices (for personal reference only)

---

### Phase 6: Curriculum Philosophy (Deep Dive Pending)

**Goal:** Create a lifelong spiritual growth framework that never ends.

#### Guiding Principles:

**1. Lifelong Journey**
- No user should ever "complete" the curriculum
- Every domain has infinite depth
- Regardless of age or maturity, there's always more to discover
- The app grows WITH the user

**2. Beautiful Flow**
- Curriculum feels natural, not forced
- Each step leads organically to the next
- Users don't feel like they're checking boxes
- Progress feels like genuine growth

**3. Daily Improvement**
- Users should feel they're getting better each day
- Small wins compound into transformation
- Visible progress without gamification manipulation

**4. Return Motivation**
- Users WANT to come back
- Not addiction, but genuine hunger for growth
- The Mentor relationship deepens over time
- Community of past insights builds richness

**5. Age Adaptability**
- Language and approach may shift based on context
- Core truths remain constant
- Young users and mature users both find depth
- Questions may adapt, not the curriculum itself

**6. God-Centered**
- Every step points to God, Jesus, and the Holy Spirit
- Understanding self leads to understanding Creator
- Christianity is the foundation, not self-help

#### Current Structure:
7 Domains x 3 Pillars = 21 Steps (documented elsewhere)

#### Status:
- **Deep dive session needed** - This is the brain of the app
- Requires dedicated, focused conversation
- Not to be rushed

---

## Simplified Tool Philosophy

**Principle:** The simpler the system, the fewer things can break.

### Essential Tools Only:

| Tool | Purpose | Status |
|------|---------|--------|
| `recordBreakthrough` | Save insights from conversations | Keep |
| `incrementResonance` | Track domain growth | Keep |
| `illuminateDomains` | Visual feedback | Keep (simple) |
| `advanceGenesis` | Onboarding progression | Keep |
| `completeOnboarding` | Finish onboarding | Keep |

### Memory Philosophy:

**DO:** Extract and save insights that matter
**DON'T:** Log every message forever

The Mentor should know the user's journey through distilled wisdom, not transcript archaeology.

---

## Architecture Notes

### Closed-Box Philosophy

```
                    +------------------+
     OUTSIDE        |   Cloudflare     |
     WORLD          |   Tunnel         |
                    +------------------+
                           |
                    (encrypted tunnel)
                           |
                           v
+----------------------------------------------------------------+
|                      Kingdom Mind (Our Box)                     |
|                                                                 |
|  +------------+    +------------+    +-------------------+     |
|  | PostgreSQL |    |    LND     |    |   App Server      |     |
|  | (database) |    | (Lightning)|    |   (Next.js)       |     |
|  +------------+    +------------+    +-------------------+     |
|                           |                                     |
+----------------------------------------------------------------+
                           |
              Outbound connections only:
                           |
         +-----------------+-----------------+
         |                                   |
         v                                   v
+------------------+               +------------------+
|   OpenRouter     |               | Bitcoin Network  |
|   (AI Proxy)     |               | (Lightning +     |
+------------------+               |  On-chain)       |
         |                         +------------------+
         v                                   |
+------------------+                         v
|   AI Providers   |               +------------------+
| (Don't see us)   |               |   Trezor Model 3 |
+------------------+               |   (Cold Storage) |
                                   +------------------+
```

### What's Inside the Box:
- Authentication (TOTP + Seed + Biometric) - no external calls
- Database (PostgreSQL) - internal only, not exposed
- User data encryption - seed-derived keys
- Lightning Network node (LND) - self-hosted
- All business logic - server-side

### What's Outside the Box:
- Cloudflare tunnel (protective layer, inbound)
- OpenRouter (AI proxy, outbound)
- Bitcoin/Lightning Network (payments, outbound)
- Trezor hardware wallet (cold storage, physical)

### What We DON'T Have:
- Email service (not needed)
- Analytics service (not needed, or self-hosted)
- Third-party auth (OAuth, etc.) - not needed
- CDN for assets (Cloudflare handles this)
- Payment processors (Stripe, PayPal) - not needed
- Bank integrations - not needed

---

### Phase 7: Sovereign Provision (Gifts & Bitcoin)

**Goal:** Accept gifts to sustain the app while maintaining complete privacy and self-sovereignty.

#### Core Philosophy:

**The app is 100% FREE.**
- No subscription
- No paywall
- No premium features
- Everyone gets the full experience

**Gifts, not donations:**
- Users can give if they feel led
- Non-taxable personal gifts (not charitable donations)
- A gift between the giver and God
- No receipts, no records visible to anyone

**No public anything:**
- No donation tickers
- No "thank you" wall
- No leaderboards
- No public ledger
- Complete privacy for givers

#### Two-Tier Gift System:

| Gift Size | Method | Why |
|-----------|--------|-----|
| Under $100 | Lightning Network | Fast, instant, cheap fees |
| Over $100 | On-chain Bitcoin | Direct to unique address for privacy |

#### User Flow (Through the Mentor):

```
User: "How much does this cost?"
        |
        v
Mentor: "Kingdom Mind is completely free. If you'd
        like to give a gift to help keep it running,
        you're welcome to, but it's never required."
        |
        v
User: "I'd like to give something"
        |
        v
Mentor: "That's generous of you. How much were
        you thinking?"
        |
        v
User: "$50" ─────────────> Lightning invoice generated
                           QR code displayed
                           User pays
                           Instant confirmation
                           "Thank you for your gift."
        |
User: "$500" ────────────> Unique Bitcoin address generated
                           QR code displayed
                           User sends on-chain
                           Instant acknowledgment
                           "Thank you for your gift."
```

#### Technical Architecture:

**Self-Hosted Lightning Node:**
- Run LND (Lightning Network Daemon) on the server
- Generates Lightning invoices for small gifts
- Initial channel funding: ~$200-300 for liquidity
- Peer with well-connected nodes (ACINQ, River, etc.)

**Trezor Model 3 Integration:**
- Hardware wallet for cold storage
- Export xpub (extended public key) to server
- Server derives unique addresses for on-chain gifts
- Private keys NEVER touch the server
- All funds flow to Trezor

**Address Generation:**
- Server has xpub only (read-only)
- Each on-chain gift gets a unique address
- Privacy preserved - no address reuse
- Use `bitcoinjs-lib` or similar for derivation

**Fund Flow:**
```
Lightning gifts ──> Lightning node wallet ──> Periodic sweep ──> Trezor
On-chain gifts ──────────────────────────────────────────────> Trezor
```

#### Gift Experience Details:

**Lightning Invoice Expiration:**
- Invoices expire (typically 1 hour)
- If expired, user simply requests a new one
- Mentor handles this gracefully

**Confirmation:**
- Instant thank you upon payment detection
- No waiting for confirmations
- It's a gift - trust is assumed

**After Gift Received:**
- Simple, sincere thank you from the Mentor
- No receipt generated
- No record visible to anyone
- Gift is between the giver and God
- Conversation continues normally

#### What Gifts Fund:
- AI API keys (OpenRouter)
- Server hosting costs
- Domain and infrastructure
- Future self-hosted AI hardware
- Nothing else - no profit motive

#### Implementation Tasks:
- [ ] Install and configure LND on server
- [ ] Set up Trezor Model 3 and export xpub
- [ ] Build Lightning invoice generation endpoint
- [ ] Build on-chain address derivation (from xpub)
- [ ] Create gift flow in Mentor system prompt
- [ ] Design QR code display for chat interface
- [ ] Implement Lightning payment detection (webhooks/polling)
- [ ] Implement on-chain payment detection
- [ ] Build periodic Lightning -> Trezor sweep job
- [ ] Open Lightning channels with reliable peers
- [ ] Test full gift flow end-to-end

#### Security Considerations:
- Lightning node wallet has limited funds (hot wallet risk)
- On-chain goes directly to Trezor (cold storage)
- No API keys for exchanges - fully self-custodied
- Server compromise cannot steal Trezor funds (no private keys)

---

### Phase 8: Infrastructure & Deployment

**Goal:** Automated CI/CD pipeline with documented infrastructure.

#### Hosting Architecture

| Component | Technology | Details |
|-----------|------------|---------|
| Server | AWS EC2 | Instance: `i-0d91b959c63682d04`, IP: `3.131.126.239` |
| User | ubuntu | SSH key: `SSP-Key.pem` |
| Container | Docker | Image: `ghcr.io/warster55/kingdom-mind:latest` |
| Database | PostgreSQL 15 | Container: `kingdom-mind-db`, Port: 5433 |
| Protection | Cloudflare Tunnel | Container: `cloudflare-tunnel` |
| App Port | 4000 | Container: `kingdom-mind-web` |
| Network | Docker | `kingdom-mind_default` |
| Registry | ghcr.io | Private, requires `read:packages` PAT |

#### Environment Variables

| Variable | Purpose | Where Set |
|----------|---------|-----------|
| `DATABASE_URL` | PostgreSQL connection string | EC2 + GitHub Secrets |
| `NEXTAUTH_SECRET` | Session signing (32+ bytes) | EC2 + GitHub Secrets |
| `NEXTAUTH_URL` | Auth callback URL | EC2 |
| `XAI_API_KEY` | Primary AI (Grok) | EC2 + GitHub Secrets |
| `ENCRYPTION_KEY` | AES-256-GCM (32 bytes base64) | EC2 + GitHub Secrets |
| `IDENTITY_SALT` | Email hashing HMAC salt | EC2 + GitHub Secrets |
| `CLOUDFLARE_API_KEY` | Tunnel management | EC2 |
| `ARCHITECT_ALLOWED_IP` | Admin IP whitelist | EC2 |

#### CI/CD Pipeline

**On Pull Request (`.github/workflows/ci.yml`):**
- Lint (`npm run lint`)
- Type check (`npx tsc --noEmit`)
- E2E tests (Playwright)

**On Merge to Main (`.github/workflows/deploy.yml`):**
1. Build Docker image
2. Push to GitHub Container Registry (ghcr.io)
3. SSH to EC2
4. Pull new image
5. Restart container

#### Deployment Process

```
Push to main
    │
    ▼
GitHub Actions builds Docker image
    │
    ▼
Image pushed to ghcr.io (private)
    │
    ▼
SSH to EC2, pull image, restart container
```

#### GitHub Secrets (Configured)

All secrets are set in: GitHub → warster55/kingdom-mind → Settings → Secrets → Actions

| Secret | Purpose | Status |
|--------|---------|--------|
| `EC2_HOST` | EC2 public IP (3.131.126.239) | ✅ Set |
| `EC2_USER` | SSH username (ubuntu) | ✅ Set |
| `EC2_SSH_KEY` | Private SSH key (SSP-Key.pem) | ✅ Set |
| `GHCR_TOKEN` | GitHub PAT for pulling images | ✅ Set |
| `DATABASE_URL` | PostgreSQL connection string | ✅ Set |
| `NEXTAUTH_SECRET` | Session signing key | ✅ Set |
| `XAI_API_KEY` | xAI Grok API key | ✅ Set |
| `ENCRYPTION_KEY` | AES-256-GCM encryption key | ✅ Set |
| `IDENTITY_SALT` | Email hashing HMAC salt | ✅ Set |

#### EC2 Server Details

**Current State (Verified):**
- Docker running with 3 containers: `kingdom-mind-web`, `kingdom-mind-db`, `cloudflare-tunnel`
- Env file: `/home/ubuntu/kingdom-mind/.env.local`
- Docker network: `kingdom-mind_default`
- SSH access: `ssh -i ~/.ssh/SSP-Key.pem ubuntu@3.131.126.239`

**Production Environment Variables (on EC2):**
```
DATABASE_URL=postgresql://kingdom_user:***@db:5432/kingdom_mind
NEXTAUTH_URL=https://kingdomind.com
NEXTAUTH_SECRET=***
XAI_API_KEY=***
ENCRYPTION_KEY=***
IDENTITY_SALT=***
NODE_ENV=production
PORT=4000
ARCHITECT_ALLOWED_IP=23.226.169.4
```

#### Testing Infrastructure

| Type | Framework | Status |
|------|-----------|--------|
| E2E | Playwright | 3 tests (login, animations, theme) |
| Unit | - | Not implemented |

#### Files & Scripts

**CI/CD Workflows:**
- `.github/workflows/ci.yml` - CI pipeline (lint, typecheck, tests on PRs)
- `.github/workflows/deploy.yml` - CD pipeline (build, push, deploy on merge)

**Emergency Scripts:**
- `scripts/kill_docker_remote.sh` - Stop Docker on EC2
- `scripts/emergency_reboot_and_rescue.sh` - Reboot EC2 and kill Docker

**Manual Deploy Command:**
```bash
ssh -i ~/.ssh/SSP-Key.pem ubuntu@3.131.126.239 "cd ~/kingdom-mind && docker compose pull && docker compose up -d"
```

---

## Future Features (Backlog)

Ideas for future development:

### Daily Bread
A daily spiritual message/devotional feature for users.
- Personalized daily Scripture or insight
- Delivered when user opens the app
- Could tie into curriculum progress
- Encourages daily engagement
- **Status:** Component exists (`DailyBread.tsx`), needs design and integration

---

## Open Questions

All major questions have been decided:

1. ~~**PDF Export**~~ - DECIDED: No export ever. Data stays in the database.
2. ~~**Chat retention**~~ - DECIDED: 30-day rolling window. Insights are permanent.
3. ~~**Payments**~~ - DECIDED: Bitcoin only (Lightning + On-chain). Trezor cold storage. No public ledger.

---

## Document History

| Date | Change |
|------|--------|
| 2026-01-13 | Initial roadmap created from planning session |
| 2026-01-13 | Major update: Refined auth tiers, security hardening, memory philosophy, curriculum principles |
| 2026-01-13 | Added Phase 7: Sovereign Provision - Bitcoin gifts via Lightning + On-chain, Trezor integration |
| 2026-01-13 | Project cleanup: Consolidated docs, removed legacy folders, reorganized components |
| 2026-01-13 | Added Phase 8: Infrastructure & Deployment - CI/CD with GitHub Actions |
| 2026-01-13 | Updated Phase 8 with actual production values, GitHub secrets configured |
| 2026-01-13 | Added Executive Review section with multi-perspective analysis |

---

## Executive Review Board

> This section contains reviews from different executive perspectives, compiled January 13, 2026.

---

### Project Manager Review

**Reviewer:** Project Manager
**Focus:** Delivery, timeline, risks, blockers

#### Executive Summary

**Project Status:** MVP Complete, Production Running, Major Features Pending

Kingdom Mind is a functioning spiritual formation platform deployed at `kingdomind.com`. The core chat experience works, but the roadmap shows 8 major phases with only 1.5 complete. The project has excellent documentation but significant technical debt and a large backlog.

#### What's Working

| Area | Status | Notes |
|------|--------|-------|
| Production Deployment | ✅ Live | EC2, Docker, Cloudflare Tunnel |
| Core Chat | ✅ Working | Streaming AI responses via xAI Grok |
| Database | ✅ Operational | PostgreSQL with Drizzle ORM, 14 tables |
| Encryption | ✅ Implemented | AES-256-GCM for sensitive data |
| AI Memory (Phase 2B) | ✅ Complete | Privacy-first metadata-only context |
| CI/CD Workflows | ✅ Created | GitHub Actions (not yet tested) |
| Documentation | ✅ Excellent | ROADMAP.md is comprehensive |

#### Technical Debt (Immediate Concerns)

| Issue | Severity | Count |
|-------|----------|-------|
| ESLint errors | High | 100 |
| ESLint warnings | Medium | 56 |
| TypeScript errors | Medium | 1 |
| Uncommitted changes | Low | 8 files |
| Unit tests | High | 0 (only 3 E2E tests) |

#### Roadmap Status

| Phase | Name | Status | Tasks |
|-------|------|--------|-------|
| 1 | Auth Overhaul (TOTP, Seed Phrase) | ❌ Not Started | 15 tasks |
| 2 | AI Infrastructure (OpenRouter) | ❌ Not Started | 7 tasks |
| 2B | AI Memory Architecture | ✅ Complete | - |
| 3 | Data & Memory (30-day purge) | ❌ Not Started | 7 tasks |
| 3B | No Export Policy | ✅ Decided | No code needed |
| 4 | Security Hardening | 🔄 Ongoing | 25+ tasks |
| 5 | Developer Anonymity | ❌ Not Started | 6 tasks |
| 6 | Curriculum Philosophy | ⏸️ Needs Deep Dive | - |
| 7 | Bitcoin Gifts (Lightning) | ❌ Not Started | 11 tasks |
| 8 | Infrastructure & CI/CD | ✅ Just Completed | - |

**Completion:** ~2 of 8 phases complete (~25%)

#### Risk Assessment

**High Risk:**
1. Authentication uses email OTP - AWS SES dependency contradicts "closed-box" principle
2. No unit tests - Breaking changes will go unnoticed
3. Single encryption key - Breach exposes all users

**Medium Risk:**
4. 100 lint errors - CI will fail on first PR
5. xAI direct dependency - Tied to single AI provider
6. No chat purge job - Database will bloat

#### Priority Recommendations

**Immediate:** Fix lint errors, commit changes, test CI pipeline
**Short-Term:** Phase 1 Auth Overhaul, add unit tests
**Medium-Term:** Phase 3 chat purge, Phase 2 OpenRouter
**Deferred:** Phase 7 Bitcoin (needs user base first)

---

### Chief Executive Officer (CEO) Review

**Reviewer:** CEO
**Focus:** Vision, strategy, market positioning, sustainability

#### Vision Alignment Assessment

**Status: HIGHLY ALIGNED on Philosophy, CRITICALLY MISALIGNED on Execution**

Kingdom Mind's stated vision is crystalline: a closed-box, privacy-first spiritual formation platform owned exclusively by users through cryptographic sovereignty. The codebase reflects this vision in principle—with AES-256-GCM encryption, metadata-only AI context, and a deliberate "no export" policy.

However, there is a **critical disconnect between vision and implementation:**

- **Vision states:** "No email-based authentication under any circumstances."
- **Reality:** Email OTP is the current authentication method.
- **Vision states:** "Self-contained, zero external dependencies."
- **Reality:** Direct dependency on xAI Grok API; OpenRouter not yet implemented.

**Gap Assessment:** Roadmap shows 8 phases, ~2 complete (~25%). Vision reflects where you want to be; codebase reflects where you are.

#### Market Differentiation

**Competitive Positioning: STRONG BUT HIDDEN**

What makes Kingdom Mind unique:
1. **Closed-Box Philosophy** - Unlike Calm, Headspace, Insight Timer: no data extraction, no algorithmic targeting
2. **Cryptographic User Sovereignty** - Planned seed phrase system is unmatched in spiritual tech
3. **No Revenue Model** - Gifts only, no subscription. Counter to SaaS playbooks but aligned with Christian stewardship
4. **Developer Anonymity** - App "just exists," pointing to God not founder

**The Differentiation Paradox:** Your greatest strength (closed-box, anti-commercial) is your greatest marketing weakness. You cannot market through case studies, founder brand, or conversion funnels.

#### Strategic Concerns

**Three Midnight Worries:**

1. **Adoption Without Marketing** - How do users find you if visibility contradicts philosophy?
2. **Sustainability Without Revenue** - Zero users = zero gifts. Server costs are running today with zero offset.
3. **Execution Velocity** - 25% complete with apparent single developer. Realistic timeline: 6-9 months to vision.

#### Path to Sustainability

Phase 7 Bitcoin gift model is elegant but untested:
- ✅ Respects user autonomy, true financial sovereignty
- ❌ Unproven willingness to gift crypto, Bitcoin barrier adds friction

**Sustainability requires:** 500+ DAU, 10-20% gift rate, $25-50 average gift. Expected: $2,000-5,000/month at scale.

#### CEO Recommendations

1. **URGENT: Launch Phase 7 (Bitcoin Gifts)** - Even minimal Lightning MVP. Need revenue detection yesterday.
2. **CLARIFY: User Growth Strategy** - How will privacy-focused Christians discover you?
3. **DECIDE: Solo Project or Team?** - Current pace = 9-12 months. Burnout risk is real.

---

### Chief Financial Officer (CFO) Review

**Reviewer:** CFO
**Focus:** Costs, revenue, financial sustainability, ROI

#### Current Cost Structure

**Monthly Infrastructure:**
| Item | Cost |
|------|------|
| AWS EC2 | ~$20-30 |
| PostgreSQL (Docker) | $0 (included) |
| Cloudflare Tunnel | ~$0-200 |
| Domain/DNS | ~$1 |
| **Subtotal Fixed** | **~$50-230/month** |

**Variable AI Costs (xAI Grok 4.1 Fast):**
- $0.20/M prompt tokens, $0.50/M completion tokens
- ~$1.44 per active user/month
- **100 users = ~$144/month; 1,000 users = ~$1,440/month**

**Total Estimated:** ~$200-500/month at current scale

#### Revenue Model Assessment

**Bitcoin-Only Gift Model (Phase 7): NOT IMPLEMENTED**

| Reality Check | Status |
|---------------|--------|
| Current Revenue | $0/month |
| Gift Infrastructure | 0% complete |
| User Willingness | Untested |
| Bitcoin Barrier | High friction |

**Critical Issue:** Spending $300-500/month with zero revenue mechanism in place.

#### Financial Risks

1. **Unsustainable Unit Economics** - AI costs scale with users; gifts don't
2. **AI Cost Explosion** - Self-hosted goal is $2,000+/month (catch-22: need revenue first)
3. **Single Revenue Stream** - Entirely dependent on voluntary crypto gifts
4. **No Budget Controls** - No spending caps, no alerts, no circuit breakers

#### CFO Recommendations

1. **Implement Cost Controls (Immediate)** - Add monthly AI spend caps, alerts at 50% budget
2. **Validate Gift Model ASAP** - Build minimal Phase 7 MVP (2 weeks), measure conversion
3. **Right-Size Infrastructure** - Measure actual user count, calculate true unit economics

**Verdict:** Currently a passion project masquerading as a business. Beautiful architecture, noble mission, but no viable financial model yet.

---

### Chief Technology Officer (CTO) Review

**Reviewer:** CTO
**Focus:** Architecture, scalability, technical debt, technology choices

#### Architecture Assessment

**Verdict: Sound foundation with critical tensions**

Strengths:
- Dual AI brain system (Mentor + Architect) is clever
- Privacy-first context injection (v7.0) shows architectural maturity
- Server-side AES-256-GCM encryption implemented
- Database-driven configuration allows runtime tuning

**Critical Flaw:** Single ENCRYPTION_KEY for all users. Database breach + env exposure = total loss for ALL users. Per-user keys (Phase 1) not implemented.

#### Scalability Analysis

**Breaking Points:**

| Threshold | Component | Issue |
|-----------|-----------|-------|
| 100-200 concurrent | Database | `max: 10` connections exhausted |
| 500 DAU | EC2 Instance | Single container, no horizontal scaling |
| 10K users | Rate Limiting | Database-backed O(n), needs Redis |
| 100K users | Everything | Complete architectural rebuild required |

#### Technical Debt Inventory

| Category | Count | Severity |
|----------|-------|----------|
| ESLint Errors | 100 | HIGH (blocks CI) |
| ESLint Warnings | 56 | Medium |
| TypeScript Errors | 1 | Medium |
| Unit Tests | 0 | HIGH |
| E2E Tests | 3 | Insufficient |

**Critical Issues:**
- Encryption fallback key is dangerous hardcoded string
- Rate limiting "fails open" (allows unlimited on error)
- Multiple `// @ts-ignore` comments
- Widespread `any` types in API routes

#### Technology Stack Evaluation

| Tech | Assessment |
|------|------------|
| Next.js 16 | Excellent |
| React 19 | Good (new, less battle-tested) |
| PostgreSQL 15 | Good (needs connection pooling) |
| Drizzle ORM | Excellent |
| xAI Grok | HIGH RISK (single provider) |
| Redis | MISSING (critical for scale) |

#### CTO Recommendations

**Priority 1 (Ship-Blocking):**
1. Fix ESLint errors (2-3 hours)
2. Implement connection pooling (4-6 hours)
3. Secure encryption - remove fallback key (3-4 hours)

**Priority 2 (Before 100 DAU):**
4. Replace DB rate limiting with Redis (2-3 hours)
5. Add caching for static data (3-4 hours)
6. Fix N+1 query patterns (1-2 hours)

**Priority 3 (Ongoing):**
7. Add unit test scaffolding (4-6 hours)
8. Type safety pass - remove `any` (3-4 hours)
9. Structured logging (2-3 hours)

**Go/No-Go:**
- ✅ Soft launch (100-500 users): Safe if Priority 1 fixed
- ❌ Public launch (1K+ users): Will fail without Priority 2

---

### Chief Information Security Officer (CISO) Review

**Reviewer:** CISO
**Focus:** Security posture, vulnerabilities, data protection, compliance

#### Security Posture Assessment

**Overall Grade: D+ (Critical Issues Present)**

The ROADMAP articulates a compelling "closed-box" privacy-first vision, yet the production codebase exhibits critical vulnerabilities. The project is in a partially-hardened state with significant security debt.

**Strengths:**
- Privacy-first AI context (metadata-only) is well-designed
- AES-256-GCM encryption for sensitive data
- Email hashing with HMAC-SHA256
- Rate limiting infrastructure in place

**Critical Weaknesses:**
- Single shared encryption key for all users
- Hardcoded personal email bypass addresses
- Encryption fallback key hardcoded in source
- Rate limiting fails open on errors

#### Critical Vulnerabilities Found

**CRITICAL SEVERITY:**

| Vulnerability | Location | Risk |
|--------------|----------|------|
| Single encryption key for all users | `encryption.ts:5` | Total data compromise if key leaks |
| Hardcoded email bypasses | `auth-options.ts:42-44` | Admin account takeover |
| Encryption fallback key | `encryption.ts:5` | Silent security degradation |
| Rate limiting fails open | `rate-limit.ts:38` | Unlimited access on DB errors |

**HIGH SEVERITY:**

| Vulnerability | Location | Risk |
|--------------|----------|------|
| Database SSL disabled | `client.ts:20` | Man-in-the-middle attacks |
| SQL injection in Architect | `architect-handlers.ts:16` | Data modification bypass |
| PII in logs | `otp/request/route.ts:35` | Privacy breach |
| IP whitelist bypass | `middleware.ts:18` | Container escape vulnerability |

#### Data Protection Analysis

| Area | Status | Gap |
|------|--------|-----|
| Data-at-Rest | PARTIAL | Single key, not per-user |
| Data-in-Transit | WEAK | `ssl: false` on DB connections |
| Access Control | PARTIAL | Localhost bypass exists |
| Key Management | CRITICAL | No rotation, hardcoded fallback |

#### Compliance Considerations (GDPR)

- **Data Minimization:** 30-day purge NOT implemented (all data retained)
- **Right to Deletion:** No mechanism exists
- **Data Portability:** Explicitly forbidden (design choice, may conflict with Article 20)
- **Breach Notification:** No detection or notification system

#### CISO Recommendations

**Priority 1 (Ship-Blocking):**
1. Implement per-user encryption keys (Phase 1 ROADMAP) - 2-3 weeks
2. Remove hardcoded email bypasses - 1 day
3. Fix rate limiting fail-open - 2 hours
4. Enable database SSL - 4-6 hours

**Priority 2 (Before 100 DAU):**
5. Fix SQL injection in Architect tools - 3-4 hours
6. Remove PII from logs - 2-3 hours
7. Implement 30-day chat purge - 2-3 hours
8. Remove encryption fallback key - 1 hour

**Ship Status:** NOT READY for public launch until Priority 1 resolved.

---

### Chief Product Officer (CPO) Review

**Reviewer:** CPO
**Focus:** User experience, product-market fit, feature completeness

#### User Experience Assessment

**Overall Feel:** Spiritual, minimalist, contemplative. Not a flashy productivity app.

**Strengths:**
- Dark, serif typography (Crimson Pro, Great Vibes) creates sanctuary atmosphere
- Chat-first interface appropriate for mentoring relationship
- Streaming AI responses feel natural and human-like
- Mobile-responsive with MobileTabBar component

**UX Gaps:**
- Email OTP friction contradicts privacy message
- No visible progress feedback (resonance scores hidden)
- Daily Bread component built but disconnected
- Onboarding disabled by default

#### Product-Market Fit Analysis

**Target User:** Christian (Protestant), 25-55, tech-literate, privacy-conscious, reflective

**Strong Fit:**
- Privacy-conscious Christians seeking transformation without data harvesting
- 24/7 accessibility vs waiting for pastoral counseling
- Free with optional gifts removes financial barrier
- Biblically coherent 7-domain framework

**Uncertain Fit:**
- Discovery problem (anonymous developer = invisible product)
- Retention without human community
- Bitcoin-only gifts = high friction assumption

#### Feature Completeness

**MVP Status: ~60% Complete**

| Feature | Status |
|---------|--------|
| Chat Interface | ✅ Complete |
| Curriculum (21 steps) | ✅ Complete |
| AI Mentor | ✅ Working |
| Authentication | ⚠️ Partial (email OTP, not TOTP) |
| User Progress Visual | ❌ Missing |
| Bitcoin Gifts | ❌ Not Started |
| Onboarding | ⚠️ Disabled |

#### Curriculum Evaluation

**Strength: Theologically coherent and psychologically sound**

7 Domains × 3 Pillars = 21 steps, each with Key Truth, Scripture, and Description.

Example: *"You are the thinker, not the thought"* (Mindset: Awareness) - Cognitive Behavioral Theology, accessible and profound.

#### User Journey Gaps

| Gap | Risk Level | Issue |
|-----|------------|-------|
| Signup → First Chat | HIGH | Email OTP friction, no guided onboarding |
| First Message → Value | MEDIUM | New users have empty context |
| Progress → Return | HIGH | Resonance scores tracked but hidden |
| Churn → Gift | HIGH | No re-engagement, no gift prompt |

#### CPO Recommendations

1. **Enable Genesis Onboarding** (1-2 weeks) - Flip config, add visual stage feedback
2. **Build User Dashboard** (2-3 weeks) - Star map, breakthroughs, daily anchor, streak counter
3. **Gift Flow MVP** (2 weeks) - Lightning invoice in chat, payment confirmation

---

### VP of Engineering Review

**Reviewer:** VP Engineering
**Focus:** Code quality, processes, team productivity, engineering culture

#### Code Quality Assessment

**Strengths:**
- Strong TypeScript with strict mode enabled
- Well-organized directory structure
- Security-conscious patterns (email hashing, AES encryption)
- Database schema well-designed with Drizzle ORM

**Areas for Improvement:**
- 100+ ESLint errors/warnings
- Large monolithic files (`chat.ts` at 377 lines)
- Inconsistent error handling patterns
- 45+ console.log statements (needs structured logging)
- Magic strings for domains instead of constants

#### Development Process Evaluation

**CI/CD Strengths:**
- GitHub Actions with lint, typecheck, E2E tests
- Docker builds with GHCR deployment
- Playwright configured with retries

**CI/CD Gaps:**
- No security scanning (npm audit, Snyk)
- No pre-commit hooks
- No staging environment
- Test coverage <20%

#### Documentation & Maintainability

| Aspect | Status |
|--------|--------|
| CLAUDE.md | ✅ Excellent onboarding guide |
| ROADMAP.md | ✅ Comprehensive |
| README.md | ❌ Missing |
| API Docs | ❌ Missing |
| .env.example | ❌ Missing |

**New Developer Onboarding:** 2-3 days to become productive

#### Team Scalability

| Team Size | Status |
|-----------|--------|
| 1-2 devs | Works well |
| 3-5 devs | Will hit friction (no code review guidelines, monolithic files) |
| 5+ devs | High risk (test coverage, observability gaps) |

#### VP Engineering Recommendations

**Immediate (Next 30 Days):**
1. **Fix ESLint & Add Enforcement** (3-5 hours) - Pre-commit hooks, strict config
2. **Extract Chat Logic** (1 sprint) - Split 377-line monolith, add unit tests
3. **Structured Logging** (1 week) - Replace console.log with winston/pino

**Secondary (30-90 Days):**
- Expand test coverage to 50%+
- Add database query monitoring
- Generate API documentation
- Implement feature flags

**Overall Assessment:** Solid foundation showing early technical debt. With immediate recommendations addressed, codebase supports 5-7 developers. Beyond that, needs modular service extraction.

---

## Executive Board Consensus & Unified Recommendations

> Synthesized from all six executive reviews - January 13, 2026

### Unanimous Findings

All executives agree on:

1. **Vision is Strong** - Closed-box, privacy-first, spiritually coherent philosophy is well-articulated and unique
2. **Foundation is Solid** - Architecture, database design, and core chat work well
3. **Execution is Incomplete** - ~25-60% complete depending on metric (2 of 8 phases, 60% features)
4. **Critical Gaps Exist** - Security vulnerabilities, no revenue, hidden user progress

### Cross-Functional Priority Matrix

| Priority | CEO | CFO | CTO | CISO | CPO | VP Eng | Consensus |
|----------|-----|-----|-----|------|-----|--------|-----------|
| Fix Security (Per-user keys, bypasses) | - | - | P1 | P1 | - | - | **CRITICAL** |
| Fix Lint/CI (100 errors) | - | - | P1 | - | - | P1 | **BLOCKING** |
| Revenue (Bitcoin Gifts MVP) | P1 | P1 | - | - | P3 | - | **URGENT** |
| Enable Onboarding | - | - | - | - | P1 | - | **HIGH** |
| User Progress Dashboard | - | - | - | - | P2 | - | **HIGH** |
| Cost Controls | - | P1 | - | - | - | - | **MEDIUM** |
| Rate Limit Fix | - | - | P2 | P1 | - | - | **HIGH** |
| Structured Logging | - | - | - | - | - | P1 | **MEDIUM** |

### Unified Sprint Plan (Next 30 Days)

**Week 1: Security & CI Foundation**
- [ ] Remove hardcoded email bypasses (CISO P1) - 1 day
- [ ] Fix rate limiting fail-open (CISO P1) - 2 hours
- [ ] Remove encryption fallback key (CISO P2) - 1 hour
- [ ] Fix ESLint errors to unblock CI (VP Eng P1) - 3-5 hours
- [ ] Enable database SSL (CISO P1) - 4-6 hours

**Week 2: Revenue & Engagement**
- [ ] Lightning invoice MVP - Phase 7 minimal (CEO P1, CFO P2) - 1 week
- [ ] Add AI cost controls/alerts (CFO P1) - 4 hours
- [ ] Enable Genesis onboarding (CPO P1) - 2-3 days

**Week 3-4: User Experience & Scale Prep**
- [ ] Build user progress dashboard (CPO P2) - 2 weeks
- [ ] Replace DB rate limiting with Redis (CTO P2) - 2-3 hours
- [ ] Add structured logging (VP Eng P1) - 1 week
- [ ] Extract chat.ts into modules (VP Eng P2) - ongoing

### Go/No-Go Decision

| Scenario | Verdict | Required Actions |
|----------|---------|------------------|
| Continue current beta (<10 users) | ✅ GO | None |
| Soft launch (100-500 users) | ⚠️ CONDITIONAL | Fix security P1 items, lint errors |
| Public launch (1K+ users) | ❌ NO-GO | All P1 + P2 items, Redis, tests |
| Seek investment | ❌ NO-GO | Revenue validation, team plan |

### Key Metrics to Track

| Metric | Current | Target (30 days) | Target (90 days) |
|--------|---------|------------------|------------------|
| Roadmap Completion | 25% | 35% | 50% |
| Security Grade | D+ | B | A- |
| Lint Errors | 100 | 0 | 0 |
| Test Coverage | <20% | 30% | 50% |
| Monthly Revenue | $0 | First gift | $500+ |
| Daily Active Users | Unknown | 50 | 200 |

### Strategic Questions Requiring Decision

1. **Solo or Team?** - Current pace = 9-12 months to vision. Is this sustainable?
2. **Growth Strategy?** - How will privacy-focused Christians discover Kingdom Mind?
3. **Bitcoin-Only?** - Gift model untested. What if <1% convert? Pivot plan?
4. **Phase 1 vs Phase 7?** - Auth overhaul (security) vs Bitcoin gifts (revenue) - which first?

### Board Recommendation

**Immediate Focus (Week 1-2):** Security fixes + Revenue MVP

The board recommends a parallel track:
- **Track A:** Fix ship-blocking security issues (per-user keys can wait, but bypasses/fail-open cannot)
- **Track B:** Launch minimal Phase 7 (Lightning invoice only) to validate gift model

**Rationale:** You're spending ~$300-500/month with $0 revenue. Even proving 5 users will gift $20/month changes the trajectory. Security hardening is critical, but total security overhaul (Phase 1 TOTP + seed phrase) takes 4-6 weeks. Do quick security fixes now, revenue validation in parallel, then full Phase 1.

### Document History Update

This Executive Review Board analysis represents input from:
- Project Manager (PM)
- Chief Executive Officer (CEO)
- Chief Financial Officer (CFO)
- Chief Technology Officer (CTO)
- Chief Information Security Officer (CISO)
- Chief Product Officer (CPO)
- VP of Engineering

All perspectives synthesized into unified recommendations above.

