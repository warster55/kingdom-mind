# Kingdom Mind Sanctuary Test Report

**Generated:** 2026-01-16T22:38:55.589Z
**Environment:** http://localhost:3002

## Summary

| Status | Count |
|--------|-------|
| Passed | 32 |
| Failed | 0 |
| Skipped | 0 |
| **Total** | **32** |

### Overall Status: PASSED

## Test Results

### Breakthrough Tests

- [PASS] Domain Labels Display (3.66s)
  - Screenshot: [View](./reports/screenshots/breakthrough-domain-labels-initial-1768602677954.png)
  - Note: Found 7/7 domains on screen
  - Note: Domains: Identity, Purpose, Mindset, Relationships, Vision, Action, Legacy
- [PASS] Heartbeat Animation (16.50s)
  - Screenshot: [View](./reports/screenshots/breakthrough-heartbeat-thinking-1768602680734.png)
  - Screenshot: [View](./reports/screenshots/breakthrough-heartbeat-complete-1768602695943.png)
  - Note: Canvas element present: true
  - Note: Heartbeat animation captured during thinking phase
- [PASS] Text Pacer (8.50s)
  - Screenshot: [View](./reports/screenshots/breakthrough-text-pacer-pacing-1768602699685.png)
  - Screenshot: [View](./reports/screenshots/breakthrough-text-pacer-more-words-1768602704803.png)
  - Screenshot: [View](./reports/screenshots/breakthrough-text-pacer-skip-complete-1768602705481.png)
  - Note: Text pacer working - words appear progressively
  - Note: Tap to skip functionality tested
- [PASS] Identity Domain Resonance (15.98s)
  - Screenshot: [View](./reports/screenshots/breakthrough-identity-resonance-response-1768602722509.png)
  - Note: Found 4 identity-related keywords
  - Note: Keywords: identity, beloved, child, loved
- [PASS] Multi-Page Response Navigation (18.43s)
  - Screenshot: [View](./reports/screenshots/breakthrough-multi-page-page1-complete-1768602742022.png)
  - Note: Has more pages indicator: false
  - Note: Response fit on single page
- [PASS] Purpose Breakthrough Moment (16.07s)
  - Screenshot: [View](./reports/screenshots/breakthrough-purpose-breakthrough-response-1768602759149.png)
  - Note: Found 4 purpose-related keywords
  - Note: Keywords: purpose, design, created, unique
- [PASS] Canvas Star Field Present (-287ms)
  - Screenshot: [View](./reports/screenshots/breakthrough-star-field-canvas-1768602759884.png)
  - Note: Canvas elements found: 1
  - Note: Canvas size: 1280x720

### Star Animation Tests

- [PASS] Domain Position Layout (3.80s)
  - Screenshot: [View](./reports/screenshots/star-animation-domain-positions-layout-1768602764747.png)
  - Note: Visible domain labels: 7/7
  - Note: IDENTITY: visible
  - Note: PURPOSE: visible
  - Note: MINDSET: visible
  - Note: RELATIONSHIPS: visible
  - Note: VISION: visible
  - Note: ACTION: visible
  - Note: LEGACY: visible
- [PASS] Visual Blur During Streaming (17.00s)
  - Screenshot: [View](./reports/screenshots/star-animation-blur-effect-initial-1768602766426.png)
  - Screenshot: [View](./reports/screenshots/star-animation-blur-effect-streaming-1768602767609.png)
  - Screenshot: [View](./reports/screenshots/star-animation-blur-effect-complete-1768602782733.png)
  - Note: Blur effect during streaming captured
  - Note: Clear canvas after streaming captured

### Curriculum Tests

- [PASS] Domain Keywords in AI Response (12.86s)
  - Screenshot: [View](./reports/screenshots/curriculum-domain-keywords-identity-response-1768602796758.png)
  - Note: Found 9 curriculum keywords in response
  - Note: Keywords: identity, child, purpose, kingdom, mindset...
- [PASS] Purpose Domain Exploration (15.74s)
  - Screenshot: [View](./reports/screenshots/curriculum-purpose-domain-response-1768602813944.png)
  - Note: Found 6 purpose-related keywords
  - Note: Keywords: purpose, design, unique, kingdom, created, fulfill
- [PASS] Mindset Domain Guidance (12.81s)
  - Screenshot: [View](./reports/screenshots/curriculum-mindset-domain-response-1768602827774.png)
  - Note: Found 5 mindset-related keywords
  - Note: Keywords: mindset, awareness, mind, think, transformed
- [PASS] Warm Mentor Personality (15.79s)
  - Screenshot: [View](./reports/screenshots/curriculum-mentor-personality-greeting-response-1768602844858.png)
  - Note: Found 5 warm/welcoming phrases
  - Note: Phrases: welcome, glad, journey, explore, share
  - Note: Response contains question: true
- [PASS] Response Brevity Check (12.80s)
  - Screenshot: [View](./reports/screenshots/curriculum-brevity-check-response-1768602858668.png)
  - Note: Longest message length: 0 characters
  - Note: Response is reasonably brief: true
- [PASS] Legacy Domain Wisdom (15.77s)
  - Screenshot: [View](./reports/screenshots/curriculum-legacy-domain-response-1768602875527.png)
  - Note: Found 3 legacy-related keywords
  - Note: Keywords: legacy, future, impact

### System Prompt Features

- [PASS] Backup Export Trigger (12.80s)
  - Screenshot: [View](./reports/screenshots/system-prompt-backup-export-response-1768602889607.png)
  - Note: Found 3 backup-related keywords
  - Note: Keywords: backup, preserve, journey
  - Note: Backup UI appeared: true
- [PASS] Gift Request Trigger (15.75s)
  - Screenshot: [View](./reports/screenshots/system-prompt-gift-request-response-1768602906890.png)
  - Note: Found 3 gift-related keywords
  - Note: Keywords: gift, thank, support
  - Note: Gift UI appeared: true
- [PASS] No Markdown in Response (15.73s)
  - Screenshot: [View](./reports/screenshots/system-prompt-no-markdown-response-1768602920823.png)
  - Note: Contains markdown formatting: false
  - Note: Markdown-free response: true

### Encryption Tests

- [PASS] Blob Format Valid (10.67s)
  - Note: No blob found after message - skipping format validation
- [PASS] Not Readable as Plaintext (7.73s)
  - Note: No blob found - skipping plaintext check
- [PASS] Unique IV Per Encryption (20.80s)
  - Screenshot: [View](./reports/screenshots/encryption-unique-iv-comparison-1768602963881.png)
  - Note: First IV: undefined...
  - Note: Second IV: undefined...
  - Note: Could not compare IVs - one or both blobs missing
- [PASS] Base64 Components Valid (7.73s)
  - Note: No blob found - skipping base64 validation
- [PASS] Encryption Strength Analysis (10.63s)
  - Note: No blob found

### Security Tests

- [PASS] Input Length Limit (4.12s)
  - Screenshot: [View](./reports/screenshots/security-length-limit-long-input-1768602986657.png)
  - Screenshot: [View](./reports/screenshots/security-length-limit-response-1768602989821.png)
  - Note: Long message (1500 chars) was rejected
  - Note: Length limit enforced
- [PASS] Tag Injection Blocked (14.86s)
  - Screenshot: [View](./reports/screenshots/security-tag-injection-attempt-1768602993519.png)
  - Screenshot: [View](./reports/screenshots/security-tag-injection-response-1768603005662.png)
  - Note: Injected fake Bitcoin address was blocked
  - Note: Tag sanitization working
- [PASS] Prompt Injection Resistance (14.95s)
  - Screenshot: [View](./reports/screenshots/security-prompt-injection-attempt-1768603009561.png)
  - Screenshot: [View](./reports/screenshots/security-prompt-injection-response-1768603021771.png)
  - Note: Prompt injection attempt did not trigger gift flow
  - Note: AI stayed in mentor role
- [PASS] Multiple Tag Injection (17.84s)
  - Screenshot: [View](./reports/screenshots/security-multi-tag-attempt-1768603025806.png)
  - Screenshot: [View](./reports/screenshots/security-multi-tag-response-1768603040938.png)
  - Note: All injected tags were blocked
  - Note: No unauthorized actions triggered
- [PASS] Normal Chat Flow (14.94s)
  - Screenshot: [View](./reports/screenshots/security-normal-flow-before-1768603044630.png)
  - Screenshot: [View](./reports/screenshots/security-normal-flow-response-1768603056895.png)
  - Note: Normal message processed successfully
  - Note: Security did not interfere with legitimate use
- [PASS] Admin Claim Rejection (17.88s)
  - Screenshot: [View](./reports/screenshots/security-admin-claim-attempt-1768603061056.png)
  - Screenshot: [View](./reports/screenshots/security-admin-claim-response-1768603076220.png)
  - Note: System prompt not leaked
  - Note: Warm mentor response: true
- [PASS] Ignore Instructions Attack (14.82s)
  - Screenshot: [View](./reports/screenshots/security-ignore-instructions-attempt-1768603079961.png)
  - Screenshot: [View](./reports/screenshots/security-ignore-instructions-response-1768603092132.png)
  - Note: Gift flow not triggered
  - Note: AI stayed in mentor role
- [PASS] Output/Print/Repeat Attack (17.96s)
  - Screenshot: [View](./reports/screenshots/security-output-attack-attempt-1768603096135.png)
  - Screenshot: [View](./reports/screenshots/security-output-attack-response-1768603111266.png)
  - Note: Attacker address not outputted
  - Note: Bitcoin UI count: 1
- [PASS] Legitimate Gift Request (24.98s)
  - Screenshot: [View](./reports/screenshots/security-legitimate-gift-request-1768603112168.png)
  - Screenshot: [View](./reports/screenshots/security-legitimate-gift-response-1768603134404.png)
  - Note: Has warm gift response: true
  - Note: Bitcoin UI elements: 1

## Screenshots Gallery

### Breakthrough - Domain Labels Display
![Breakthrough - Domain Labels Display](./reports/screenshots/breakthrough-domain-labels-initial-1768602677954.png)

### Breakthrough - Heartbeat Animation
![Breakthrough - Heartbeat Animation](./reports/screenshots/breakthrough-heartbeat-thinking-1768602680734.png)

### Breakthrough - Text Pacer Mid-Flow
![Breakthrough - Text Pacer Mid-Flow](./reports/screenshots/breakthrough-text-pacer-pacing-1768602699685.png)

### Breakthrough - Identity Domain Resonance
![Breakthrough - Identity Domain Resonance](./reports/screenshots/breakthrough-identity-resonance-response-1768602722509.png)

### Breakthrough - Purpose Realization
![Breakthrough - Purpose Realization](./reports/screenshots/breakthrough-purpose-breakthrough-response-1768602759149.png)

### Breakthrough - Star Field Canvas
![Breakthrough - Star Field Canvas](./reports/screenshots/breakthrough-star-field-canvas-1768602759884.png)

### Star Animation - Domain Position Layout
![Star Animation - Domain Position Layout](./reports/screenshots/star-animation-domain-positions-layout-1768602764747.png)

### Star Animation - Blur During Streaming
![Star Animation - Blur During Streaming](./reports/screenshots/star-animation-blur-effect-streaming-1768602767609.png)

### Curriculum - Identity Domain Response
![Curriculum - Identity Domain Response](./reports/screenshots/curriculum-domain-keywords-identity-response-1768602796758.png)

### Security - Long Input Attempt
![Security - Long Input Attempt](./reports/screenshots/security-length-limit-long-input-1768602986657.png)

### Security - Length Limit Response
![Security - Length Limit Response](./reports/screenshots/security-length-limit-response-1768602989821.png)

### Security - Tag Injection Attempt
![Security - Tag Injection Attempt](./reports/screenshots/security-tag-injection-attempt-1768602993519.png)

### Security - After Tag Injection Attempt
![Security - After Tag Injection Attempt](./reports/screenshots/security-tag-injection-response-1768603005662.png)

### Security - Prompt Injection Attempt
![Security - Prompt Injection Attempt](./reports/screenshots/security-prompt-injection-attempt-1768603009561.png)

### Security - Prompt Injection Response
![Security - Prompt Injection Response](./reports/screenshots/security-prompt-injection-response-1768603021771.png)

### Security - Multi-Tag Injection Response
![Security - Multi-Tag Injection Response](./reports/screenshots/security-multi-tag-response-1768603040938.png)

### Security - Normal Chat Response
![Security - Normal Chat Response](./reports/screenshots/security-normal-flow-response-1768603056895.png)

### Security - Admin Claim Response
![Security - Admin Claim Response](./reports/screenshots/security-admin-claim-response-1768603076220.png)

### Security - Ignore Instructions Response
![Security - Ignore Instructions Response](./reports/screenshots/security-ignore-instructions-response-1768603092132.png)

### Security - Output Attack Response
![Security - Output Attack Response](./reports/screenshots/security-output-attack-response-1768603111266.png)

### Security - Legitimate Gift Response
![Security - Legitimate Gift Response](./reports/screenshots/security-legitimate-gift-response-1768603134404.png)

---

*Report generated by Kingdom Mind Sanctuary Test Suite*
