# Kingdom Mind - Product Roadmap

> Last Updated: January 13, 2026
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

#### Implementation Tasks:
- [ ] Remove ALL AWS SES integration
- [ ] Implement TOTP setup flow with QR code generation
- [ ] Build BIP39 seed phrase generation at signup
- [ ] Derive AES-256 encryption keys from seed phrase
- [ ] Migrate encryption to use seed-derived keys
- [ ] Implement WebAuthn/Passkey as secondary auth
- [ ] Implement hardware key (FIDO2) support as optional
- [ ] Create seed phrase reveal screen (post-onboarding)
- [ ] Design clear warning messaging for seed reveal
- [ ] Implement seed phrase recovery flow
- [ ] Update database schema for new auth methods
- [ ] Migration path for existing users (must generate seeds)

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

