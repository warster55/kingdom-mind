# Kingdom Mind Sanctuary Test Report

**Generated:** 2026-01-15T23:19:40.330Z
**Environment:** http://localhost:3002

## Summary

| Status | Count |
|--------|-------|
| Passed | 62 |
| Failed | 18 |
| Skipped | 0 |
| **Total** | **80** |

### Overall Status: FAILED

## Test Results

### API Tests

- [PASS] GET Creates New Sanctuary (45ms)
  - Note: Response status: 200
  - Note: Has blob: true
  - Note: Has display: true
  - Note: Has isNewUser: true (value: true)
  - Note: Blob format valid: false
  - Note: Blob errors: IV should be 12 bytes, got 16
  - Note: Display totalBreakthroughs: 0
  - Note: Display totalStars: undefined
- [PASS] POST Empty Message (33ms)
  - Note: Got initial blob: 402 chars
  - Note: POST status: 200
  - Note: Response is null: true
  - Note: Has required fields (blob, display)
- [PASS] POST Processes Message (6.03s)
  - Note: Initial blob: 402 chars
  - Note: POST status: 200
  - Note: Has AI response: true
  - Note: Response length: 1051 chars
  - Note: Has updated blob: true
  - Note: Blob changed: true
  - Note: Updated blob format valid: false
- [PASS] Invalid Blob Recovery (3.60s)
  - Note: POST status: 200
  - Note: Response handled: true
  - Note: Server recovered from invalid blob
  - Note: New blob format valid: false
- [PASS] Null Blob Handling (5.30s)
  - Note: POST status: 200
  - Note: Created new blob: true
  - Note: New blob length: 402 chars
  - Note: New blob format valid: false
  - Note: Has AI response: true
- [PASS] API Response Time (4.53s)
  - Note: GET response time: 21ms
  - Note: POST response time: 4505ms
  - Note: GET under 5s: true
  - Note: POST under 60s: true
- [PASS] GET Creates New Sanctuary (40ms)
  - Note: Response status: 200
  - Note: Has blob: true
  - Note: Has display: true
  - Note: Has isNewUser: true (value: true)
  - Note: Blob format valid: false
  - Note: Blob errors: IV should be 12 bytes, got 16
  - Note: Display totalBreakthroughs: 0
  - Note: Display totalStars: undefined
- [PASS] POST Empty Message (29ms)
  - Note: Got initial blob: 402 chars
  - Note: POST status: 200
  - Note: Response is null: true
  - Note: Has required fields (blob, display)
- [PASS] POST Processes Message (4.53s)
  - Note: Initial blob: 402 chars
  - Note: POST status: 200
  - Note: Has AI response: true
  - Note: Response length: 1024 chars
  - Note: Has updated blob: true
  - Note: Blob changed: true
  - Note: Updated blob format valid: false
- [PASS] Invalid Blob Recovery (3.46s)
  - Note: POST status: 200
  - Note: Response handled: true
  - Note: Server recovered from invalid blob
  - Note: New blob format valid: false
- [PASS] Null Blob Handling (8.73s)
  - Note: POST status: 200
  - Note: Created new blob: true
  - Note: New blob length: 402 chars
  - Note: New blob format valid: false
  - Note: Has AI response: true
- [PASS] API Response Time (4.21s)
  - Note: GET response time: 14ms
  - Note: POST response time: 4191ms
  - Note: GET under 5s: true
  - Note: POST under 60s: true

### Biometric Tests

- [FAIL] Biometric Table Exists (3.53s) **FAILED**
  - Error: `[2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected value: [32m"biometric"[39m
Received array: [31m[][39m`
  - Screenshot: [View](./reports/screenshots/biometric-table-exists-check-1768502244027.png)
- [PASS] Lock Screen Shows When Enabled (2.98s)
  - Screenshot: [View](./reports/screenshots/biometric-lock-enabled-before-reload-1768502246245.png)
  - Screenshot: [View](./reports/screenshots/biometric-lock-enabled-lock-screen-1768502248756.png)
  - Note: Lock screen indicator found: false
  - Note: Lock screen UI displayed when biometric is enabled
- [PASS] No Lock Screen When Disabled (832ms)
  - Screenshot: [View](./reports/screenshots/biometric-no-lock-loaded-1768502250556.png)
  - Note: Chat input visible: true
  - Note: Lock screen bypassed when biometric disabled
- [FAIL] Biometric State Persists (2.78s) **FAILED**
  - Error: `[2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32mtrue[39m
Received: [31mundefined[39m`
  - Screenshot: [View](./reports/screenshots/biometric-persistence-after-reload-1768502254249.png)
- [PASS] Disable Button Available After Failed Attempts (3.68s)
  - Screenshot: [View](./reports/screenshots/biometric-disable-button-lock-screen-1768502259585.png)
  - Note: Unlock button present: false
  - Note: Note: Disable button appears after 2 failed WebAuthn attempts
  - Note: This provides a safety escape hatch if biometric stops working
  - Note: Expected lock UI elements: true
- [PASS] Biometric Record Structure (477ms)
  - Screenshot: [View](./reports/screenshots/biometric-record-structure-data-1768502258261.png)
  - Note: Biometric record exists
- [FAIL] Biometric Table Exists (3.53s) **FAILED**
  - Error: `[2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected value: [32m"biometric"[39m
Received array: [31m[][39m`
  - Screenshot: [View](./reports/screenshots/biometric-table-exists-check-1768514968231.png)
- [PASS] Lock Screen Shows When Enabled (2.94s)
  - Screenshot: [View](./reports/screenshots/biometric-lock-enabled-before-reload-1768514970383.png)
  - Screenshot: [View](./reports/screenshots/biometric-lock-enabled-lock-screen-1768514972883.png)
  - Note: Lock screen indicator found: false
  - Note: Lock screen UI displayed when biometric is enabled
- [PASS] No Lock Screen When Disabled (900ms)
  - Screenshot: [View](./reports/screenshots/biometric-no-lock-loaded-1768514974700.png)
  - Note: Chat input visible: true
  - Note: Lock screen bypassed when biometric disabled
- [FAIL] Biometric State Persists (2.74s) **FAILED**
  - Error: `[2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32mtrue[39m
Received: [31mundefined[39m`
  - Screenshot: [View](./reports/screenshots/biometric-persistence-after-reload-1768514975393.png)
- [PASS] Disable Button Available After Failed Attempts (3.80s)
  - Screenshot: [View](./reports/screenshots/biometric-disable-button-lock-screen-1768514980865.png)
  - Note: Unlock button present: false
  - Note: Note: Disable button appears after 2 failed WebAuthn attempts
  - Note: This provides a safety escape hatch if biometric stops working
  - Note: Expected lock UI elements: true
- [PASS] Biometric Record Structure (424ms)
  - Screenshot: [View](./reports/screenshots/biometric-record-structure-data-1768514982169.png)
  - Note: Biometric record exists
- [PASS] Lock Screen Shows When Enabled (3.19s)
  - Screenshot: [View](./reports/screenshots/biometric-lock-enabled-before-reload-1768515015498.png)
  - Screenshot: [View](./reports/screenshots/biometric-lock-enabled-lock-screen-1768515018179.png)
  - Note: Lock screen indicator found: false
  - Note: Lock screen UI displayed when biometric is enabled
- [FAIL] Biometric Table Exists (3.50s) **FAILED**
  - Error: `[2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected value: [32m"biometric"[39m
Received array: [31m[][39m`
  - Screenshot: [View](./reports/screenshots/biometric-table-exists-check-1768515061739.png)
- [PASS] Lock Screen Shows When Enabled (2.96s)
  - Screenshot: [View](./reports/screenshots/biometric-lock-enabled-before-reload-1768515060955.png)
  - Screenshot: [View](./reports/screenshots/biometric-lock-enabled-lock-screen-1768515063482.png)
  - Note: Lock screen indicator found: false
  - Note: Lock screen UI displayed when biometric is enabled
- [PASS] No Lock Screen When Disabled (865ms)
  - Screenshot: [View](./reports/screenshots/biometric-no-lock-loaded-1768515065273.png)
  - Note: Chat input visible: true
  - Note: Lock screen bypassed when biometric disabled
- [FAIL] Biometric State Persists (2.68s) **FAILED**
  - Error: `[2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32mtrue[39m
Received: [31mundefined[39m`
  - Screenshot: [View](./reports/screenshots/biometric-persistence-after-reload-1768515068759.png)
- [PASS] Disable Button Available After Failed Attempts (3.65s)
  - Screenshot: [View](./reports/screenshots/biometric-disable-button-lock-screen-1768515074091.png)
  - Note: Unlock button present: false
  - Note: Note: Disable button appears after 2 failed WebAuthn attempts
  - Note: This provides a safety escape hatch if biometric stops working
  - Note: Expected lock UI elements: true
- [PASS] Biometric Record Structure (451ms)
  - Screenshot: [View](./reports/screenshots/biometric-record-structure-data-1768515075401.png)
  - Note: Biometric record exists
- [FAIL] Biometric Table Exists (3.51s) **FAILED**
  - Error: `[2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected value: [32m"biometric"[39m
Received array: [31m[][39m`
  - Screenshot: [View](./reports/screenshots/biometric-table-exists-check-1768519126134.png)
- [PASS] Lock Screen Shows When Enabled (2.93s)
  - Screenshot: [View](./reports/screenshots/biometric-lock-enabled-before-reload-1768519128319.png)
  - Screenshot: [View](./reports/screenshots/biometric-lock-enabled-lock-screen-1768519130845.png)
  - Note: Lock screen indicator found: false
  - Note: Lock screen UI displayed when biometric is enabled
- [PASS] No Lock Screen When Disabled (848ms)
  - Screenshot: [View](./reports/screenshots/biometric-no-lock-loaded-1768519132627.png)
  - Note: Chat input visible: true
  - Note: Lock screen bypassed when biometric disabled
- [FAIL] Biometric State Persists (2.70s) **FAILED**
  - Error: `[2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32mtrue[39m
Received: [31mundefined[39m`
  - Screenshot: [View](./reports/screenshots/biometric-persistence-after-reload-1768519136235.png)
- [PASS] Disable Button Available After Failed Attempts (3.77s)
  - Screenshot: [View](./reports/screenshots/biometric-disable-button-lock-screen-1768519141609.png)
  - Note: Unlock button present: false
  - Note: Note: Disable button appears after 2 failed WebAuthn attempts
  - Note: This provides a safety escape hatch if biometric stops working
  - Note: Expected lock UI elements: true
- [PASS] Biometric Record Structure (500ms)
  - Screenshot: [View](./reports/screenshots/biometric-record-structure-data-1768519142955.png)
  - Note: Biometric record exists

### Chat Flow Tests

- [FAIL] New User Complete Flow (743ms) **FAILED**
  - Error: `locator.isVisible: Error: strict mode violation: locator('text=KINGDO') resolved to 2 elements:
    1) <span>KINGDO</span> aka getByText('KINGDO', { exact: true })
    2) <span class="transition-opacity duration-500 opacity-0">Kingdom </span> aka getByText('Kingdom', { exact: true })

Call log:
[2m    - checking visibility of locator('text=KINGDO')[22m
`
  - Screenshot: [View](./reports/screenshots/chat-flow-new-user-initial-1768502259735.png)
  - Screenshot: [View](./reports/screenshots/chat-flow-new-user-loaded-1768502260006.png)
- [PASS] Welcome Message Display (2.53s)
  - Screenshot: [View](./reports/screenshots/chat-flow-welcome-message-display-1768502264490.png)
  - Note: New user greeting displayed with sanctuary keywords
- [PASS] Message Input Functionality (580ms)
  - Screenshot: [View](./reports/screenshots/chat-flow-message-input-typed-1768502265975.png)
  - Note: User can type messages in the chat input
- [PASS] Message Round-Trip (11.85s)
  - Screenshot: [View](./reports/screenshots/chat-flow-round-trip-before-send-1768502267413.png)
  - Screenshot: [View](./reports/screenshots/chat-flow-round-trip-sending-1768502268560.png)
  - Screenshot: [View](./reports/screenshots/chat-flow-round-trip-response-1768502278713.png)
  - Note: Message sent successfully
  - Note: Response received from AI
- [PASS] UI Elements Present (701ms)
  - Screenshot: [View](./reports/screenshots/chat-flow-ui-elements-overview-1768502280390.png)
  - Note: Header visible: true
  - Note: Chat area visible: true
  - Note: Input area visible: true
- [FAIL] New User Complete Flow (701ms) **FAILED**
  - Error: `locator.isVisible: Error: strict mode violation: locator('text=KINGDO') resolved to 2 elements:
    1) <span>KINGDO</span> aka getByText('KINGDO', { exact: true })
    2) <span class="transition-opacity duration-500 opacity-0">Kingdom </span> aka getByText('Kingdom', { exact: true })

Call log:
[2m    - checking visibility of locator('text=KINGDO')[22m
`
  - Screenshot: [View](./reports/screenshots/chat-flow-new-user-initial-1768515076801.png)
  - Screenshot: [View](./reports/screenshots/chat-flow-new-user-loaded-1768515077077.png)
- [PASS] Welcome Message Display (2.56s)
  - Screenshot: [View](./reports/screenshots/chat-flow-welcome-message-display-1768515081423.png)
  - Note: New user greeting displayed with sanctuary keywords
- [PASS] Message Input Functionality (587ms)
  - Screenshot: [View](./reports/screenshots/chat-flow-message-input-typed-1768515082835.png)
  - Note: User can type messages in the chat input
- [PASS] Message Round-Trip (9.02s)
  - Screenshot: [View](./reports/screenshots/chat-flow-round-trip-before-send-1768515084266.png)
  - Screenshot: [View](./reports/screenshots/chat-flow-round-trip-sending-1768515085462.png)
  - Screenshot: [View](./reports/screenshots/chat-flow-round-trip-response-1768515092697.png)
  - Note: Message sent successfully
  - Note: Response received from AI
- [PASS] UI Elements Present (554ms)
  - Screenshot: [View](./reports/screenshots/chat-flow-ui-elements-overview-1768515094079.png)
  - Note: Header visible: true
  - Note: Chat area visible: true
  - Note: Input area visible: true

### Encryption Tests

- [PASS] Blob Format Valid (7.75s)
  - Note: No blob found after message - skipping format validation
- [PASS] Not Readable as Plaintext (10.53s)
  - Note: No blob found - skipping plaintext check
- [PASS] Unique IV Per Encryption (18.08s)
  - Screenshot: [View](./reports/screenshots/encryption-unique-iv-comparison-1768502319571.png)
  - Note: First IV: undefined...
  - Note: Second IV: undefined...
  - Note: Could not compare IVs - one or both blobs missing
- [PASS] Base64 Components Valid (10.57s)
  - Note: No blob found - skipping base64 validation
- [PASS] Encryption Strength Analysis (10.57s)
  - Note: No blob found
- [PASS] Blob Format Valid (10.54s)
  - Note: No blob found after message - skipping format validation
- [PASS] Not Readable as Plaintext (10.58s)
  - Note: No blob found - skipping plaintext check
- [PASS] Unique IV Per Encryption (17.74s)
  - Screenshot: [View](./reports/screenshots/encryption-unique-iv-comparison-1768515135692.png)
  - Note: First IV: undefined...
  - Note: Second IV: undefined...
  - Note: Could not compare IVs - one or both blobs missing
- [PASS] Base64 Components Valid (10.51s)
  - Note: No blob found - skipping base64 validation
- [PASS] Encryption Strength Analysis (7.63s)
  - Note: No blob found

### IndexedDB Tests

- [FAIL] Blob Stored on First Visit (3.60s) **FAILED**
  - Error: `[2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31mfalse[39m`
  - Screenshot: [View](./reports/screenshots/indexeddb-first-visit-snapshot-1768502347432.png)
- [PASS] Blob Updated After Message (12.81s)
  - Screenshot: [View](./reports/screenshots/indexeddb-blob-updated-after-message-1768502359630.png)
  - Note: Initial blob length: 0
  - Note: Updated blob length: 0
- [FAIL] Database Structure (10.70s) **FAILED**
  - Error: `[2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31mfalse[39m`
  - Screenshot: [View](./reports/screenshots/indexeddb-db-structure-tables-1768502371364.png)
- [PASS] Blob Contains Required Fields (7.88s)
  - Screenshot: [View](./reports/screenshots/indexeddb-required-fields-record-1768502381094.png)
  - Note: No sanctuary record found after message
- [PASS] IndexedDB Console Inspection (10.62s)
  - Screenshot: [View](./reports/screenshots/indexeddb-console-inspection-full-1768502392642.png)
  - Note: Full IndexedDB inspection logged to console
  - Note: Database: MISSING
  - Note: Tables: 
- [FAIL] Blob Stored on First Visit (3.53s) **FAILED**
  - Error: `[2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31mfalse[39m`
  - Screenshot: [View](./reports/screenshots/indexeddb-first-visit-snapshot-1768515159910.png)
- [PASS] Blob Updated After Message (12.65s)
  - Screenshot: [View](./reports/screenshots/indexeddb-blob-updated-after-message-1768515174305.png)
  - Note: Initial blob length: 0
  - Note: Updated blob length: 0
- [FAIL] Database Structure (7.86s) **FAILED**
  - Error: `[2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31mfalse[39m`
  - Screenshot: [View](./reports/screenshots/indexeddb-db-structure-tables-1768515183037.png)
- [PASS] Blob Contains Required Fields (10.62s)
  - Screenshot: [View](./reports/screenshots/indexeddb-required-fields-record-1768515195471.png)
  - Note: No sanctuary record found after message
- [PASS] IndexedDB Console Inspection (10.67s)
  - Screenshot: [View](./reports/screenshots/indexeddb-console-inspection-full-1768515207009.png)
  - Note: Full IndexedDB inspection logged to console
  - Note: Database: MISSING
  - Note: Tables: 

### Persistence Tests

- [PASS] Blob Survives Reload (11.19s)
  - Screenshot: [View](./reports/screenshots/persistence-blob-survives-before-reload-1768502404262.png)
  - Screenshot: [View](./reports/screenshots/persistence-blob-survives-after-reload-1768502404760.png)
  - Note: Blob before reload: none
  - Note: Blob after reload: none
  - Note: No blob was created before reload
- [FAIL] Database Survives Navigation (9.56s) **FAILED**
  - Error: `[2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31mfalse[39m`
  - Screenshot: [View](./reports/screenshots/persistence-navigation-after-1768502415168.png)
- [PASS] UpdatedAt Timestamp Changes (19.97s)
  - Screenshot: [View](./reports/screenshots/persistence-timestamp-updated-1768502437009.png)
  - Note: First timestamp: none
  - Note: Second timestamp: none
- [FAIL] Multiple Sessions (14.23s) **FAILED**
  - Error: `[2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31mfalse[39m`
  - Screenshot: [View](./reports/screenshots/persistence-multi-session-session1-1768502448669.png)
  - Screenshot: [View](./reports/screenshots/persistence-multi-session-session2-1768502452230.png)
- [PASS] Returning User Detection (12.59s)
  - Screenshot: [View](./reports/screenshots/persistence-returning-user-first-visit-1768502466808.png)
  - Screenshot: [View](./reports/screenshots/persistence-returning-user-second-visit-1768502466706.png)
  - Note: First visit - new user greeting: true
  - Note: Second visit - returning greeting: true
  - Note: Sanctuary loaded successfully on return visit
- [PASS] Blob Survives Reload (8.41s)
  - Screenshot: [View](./reports/screenshots/persistence-blob-survives-before-reload-1768515215741.png)
  - Screenshot: [View](./reports/screenshots/persistence-blob-survives-after-reload-1768515216380.png)
  - Note: Blob before reload: none
  - Note: Blob after reload: none
  - Note: No blob was created before reload
- [FAIL] Database Survives Navigation (12.06s) **FAILED**
  - Error: `[2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31mfalse[39m`
  - Screenshot: [View](./reports/screenshots/persistence-navigation-after-1768515229356.png)
- [FAIL] UpdatedAt Timestamp Changes (4.01s) **FAILED**
  - Error: `page.waitForTimeout: Target page, context or browser has been closed`

### Privacy Tests

- [PASS] No PII in IndexedDB (10.67s)
  - Screenshot: [View](./reports/screenshots/privacy-no-pii-indexeddb-check-1768502478263.png)
  - Note: "john smith" in blob: NO (GOOD)
  - Note: "john.smith@example.com" in blob: NO (GOOD)
  - Note: "555-123-4567" in blob: NO (GOOD)
  - Note: "5551234567" in blob: NO (GOOD)
  - Note: Contains plaintext patterns: false
- [PASS] No PII in Network URLs (10.57s)
  - Screenshot: [View](./reports/screenshots/privacy-no-pii-urls-network-1768502489894.png)
  - Note: Total requests captured: 1
  - Note: PII found in URLs: NO (GOOD)
  - Note: Sanctuary API calls: 1
- [PASS] No Decrypted Data in HTML (7.96s)
  - Screenshot: [View](./reports/screenshots/privacy-no-html-leak-source-1768502498751.png)
  - Note: "breakthroughs array" in HTML: NO (GOOD)
  - Note: "insights array" in HTML: NO (GOOD)
  - Note: "resonance object" in HTML: NO (GOOD)
  - Note: "sanctuary data" in HTML: NO (GOOD)
  - Note: "raw encrypted blob" in HTML: NO (GOOD)
  - Note: Expected UI content present: false
  - Note: Potential data leaks found: NO
- [PASS] LocalStorage Privacy (10.60s)
  - Screenshot: [View](./reports/screenshots/privacy-localstorage-check-1768502510296.png)
  - Note: LocalStorage keys: 1
  - Note: WARNING: Sensitive patterns in key "nextauth.message"
  - Note: Sensitive data in localStorage: YES (INVESTIGATE)
- [PASS] Session Storage Privacy (10.59s)
  - Screenshot: [View](./reports/screenshots/privacy-sessionstorage-check-1768502521824.png)
  - Note: SessionStorage keys: 0
  - Note: Sensitive data in sessionStorage: NO (GOOD)

## IndexedDB Inspection

### Inspection #1
**Timestamp:** 2026-01-15T18:39:07.510Z

#### Database Status
- Database Exists: NO
- Tables: None

#### Sanctuary Table
| Field | Value |
|-------|-------|
| Record Exists | NO |

#### Biometric Table
| Field | Value |
|-------|-------|
| Record Exists | NO |

### Inspection #2
**Timestamp:** 2026-01-15T18:39:19.729Z

#### Database Status
- Database Exists: NO
- Tables: None

#### Sanctuary Table
| Field | Value |
|-------|-------|
| Record Exists | NO |

#### Biometric Table
| Field | Value |
|-------|-------|
| Record Exists | NO |

### Inspection #3
**Timestamp:** 2026-01-15T22:12:39.998Z

#### Database Status
- Database Exists: NO
- Tables: None

#### Sanctuary Table
| Field | Value |
|-------|-------|
| Record Exists | NO |

#### Biometric Table
| Field | Value |
|-------|-------|
| Record Exists | NO |

### Inspection #4
**Timestamp:** 2026-01-15T22:12:54.408Z

#### Database Status
- Database Exists: NO
- Tables: None

#### Sanctuary Table
| Field | Value |
|-------|-------|
| Record Exists | NO |

#### Biometric Table
| Field | Value |
|-------|-------|
| Record Exists | NO |

## Network Analysis

| Metric | Value |
|--------|-------|
| Total Requests | 1 |
| Sanctuary API Calls | 1 |
| PII in URLs | NO (GOOD) |

## Screenshots Gallery

### Biometric - Lock Screen
![Biometric - Lock Screen](./reports/screenshots/biometric-lock-enabled-lock-screen-1768502248756.png)

### Biometric - No Lock Screen
![Biometric - No Lock Screen](./reports/screenshots/biometric-no-lock-loaded-1768502250556.png)

### New User - Initial Load
![New User - Initial Load](./reports/screenshots/chat-flow-new-user-initial-1768502259735.png)

### New User - Sanctuary Loaded
![New User - Sanctuary Loaded](./reports/screenshots/chat-flow-new-user-loaded-1768502260006.png)

### Welcome Message Display
![Welcome Message Display](./reports/screenshots/chat-flow-welcome-message-display-1768502264490.png)

### Message Input - After Typing
![Message Input - After Typing](./reports/screenshots/chat-flow-message-input-typed-1768502265975.png)

### Message Round-Trip - Sending
![Message Round-Trip - Sending](./reports/screenshots/chat-flow-round-trip-sending-1768502268560.png)

### Message Round-Trip - Response Received
![Message Round-Trip - Response Received](./reports/screenshots/chat-flow-round-trip-response-1768502278713.png)

### UI Elements Overview
![UI Elements Overview](./reports/screenshots/chat-flow-ui-elements-overview-1768502280390.png)

### IndexedDB - First Visit State
![IndexedDB - First Visit State](./reports/screenshots/indexeddb-first-visit-snapshot-1768502347432.png)

### IndexedDB - After Message
![IndexedDB - After Message](./reports/screenshots/indexeddb-blob-updated-after-message-1768502359630.png)

### IndexedDB - Console Inspection
![IndexedDB - Console Inspection](./reports/screenshots/indexeddb-console-inspection-full-1768502392642.png)

### Persistence - After Reload
![Persistence - After Reload](./reports/screenshots/persistence-blob-survives-after-reload-1768502404760.png)

### Persistence - Second Session
![Persistence - Second Session](./reports/screenshots/persistence-multi-session-session2-1768502452230.png)

### Persistence - Returning User
![Persistence - Returning User](./reports/screenshots/persistence-returning-user-second-visit-1768502466706.png)

### Privacy - IndexedDB PII Check
![Privacy - IndexedDB PII Check](./reports/screenshots/privacy-no-pii-indexeddb-check-1768502478263.png)

### Biometric - Lock Screen
![Biometric - Lock Screen](./reports/screenshots/biometric-lock-enabled-lock-screen-1768514972883.png)

### Biometric - No Lock Screen
![Biometric - No Lock Screen](./reports/screenshots/biometric-no-lock-loaded-1768514974700.png)

### Biometric - Lock Screen
![Biometric - Lock Screen](./reports/screenshots/biometric-lock-enabled-lock-screen-1768515018179.png)

### Biometric - Lock Screen
![Biometric - Lock Screen](./reports/screenshots/biometric-lock-enabled-lock-screen-1768515063482.png)

### Biometric - No Lock Screen
![Biometric - No Lock Screen](./reports/screenshots/biometric-no-lock-loaded-1768515065273.png)

### New User - Initial Load
![New User - Initial Load](./reports/screenshots/chat-flow-new-user-initial-1768515076801.png)

### New User - Sanctuary Loaded
![New User - Sanctuary Loaded](./reports/screenshots/chat-flow-new-user-loaded-1768515077077.png)

### Welcome Message Display
![Welcome Message Display](./reports/screenshots/chat-flow-welcome-message-display-1768515081423.png)

### Message Input - After Typing
![Message Input - After Typing](./reports/screenshots/chat-flow-message-input-typed-1768515082835.png)

### Message Round-Trip - Sending
![Message Round-Trip - Sending](./reports/screenshots/chat-flow-round-trip-sending-1768515085462.png)

### Message Round-Trip - Response Received
![Message Round-Trip - Response Received](./reports/screenshots/chat-flow-round-trip-response-1768515092697.png)

### UI Elements Overview
![UI Elements Overview](./reports/screenshots/chat-flow-ui-elements-overview-1768515094079.png)

### IndexedDB - First Visit State
![IndexedDB - First Visit State](./reports/screenshots/indexeddb-first-visit-snapshot-1768515159910.png)

### IndexedDB - After Message
![IndexedDB - After Message](./reports/screenshots/indexeddb-blob-updated-after-message-1768515174305.png)

### IndexedDB - Console Inspection
![IndexedDB - Console Inspection](./reports/screenshots/indexeddb-console-inspection-full-1768515207009.png)

### Persistence - After Reload
![Persistence - After Reload](./reports/screenshots/persistence-blob-survives-after-reload-1768515216380.png)

### Biometric - Lock Screen
![Biometric - Lock Screen](./reports/screenshots/biometric-lock-enabled-lock-screen-1768519130845.png)

### Biometric - No Lock Screen
![Biometric - No Lock Screen](./reports/screenshots/biometric-no-lock-loaded-1768519132627.png)

## Errors Encountered

### Biometric Tests > Biometric Table Exists
```
[2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected value: [32m"biometric"[39m
Received array: [31m[][39m
```

### Biometric Tests > Biometric State Persists
```
[2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32mtrue[39m
Received: [31mundefined[39m
```

### Chat Flow Tests > New User Complete Flow
```
locator.isVisible: Error: strict mode violation: locator('text=KINGDO') resolved to 2 elements:
    1) <span>KINGDO</span> aka getByText('KINGDO', { exact: true })
    2) <span class="transition-opacity duration-500 opacity-0">Kingdom </span> aka getByText('Kingdom', { exact: true })

Call log:
[2m    - checking visibility of locator('text=KINGDO')[22m

```

### IndexedDB Tests > Blob Stored on First Visit
```
[2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31mfalse[39m
```

### IndexedDB Tests > Database Structure
```
[2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31mfalse[39m
```

### Persistence Tests > Database Survives Navigation
```
[2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31mfalse[39m
```

### Persistence Tests > Multiple Sessions
```
[2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31mfalse[39m
```

### Biometric Tests > Biometric Table Exists
```
[2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected value: [32m"biometric"[39m
Received array: [31m[][39m
```

### Biometric Tests > Biometric State Persists
```
[2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32mtrue[39m
Received: [31mundefined[39m
```

### Biometric Tests > Biometric Table Exists
```
[2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected value: [32m"biometric"[39m
Received array: [31m[][39m
```

### Biometric Tests > Biometric State Persists
```
[2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32mtrue[39m
Received: [31mundefined[39m
```

### Chat Flow Tests > New User Complete Flow
```
locator.isVisible: Error: strict mode violation: locator('text=KINGDO') resolved to 2 elements:
    1) <span>KINGDO</span> aka getByText('KINGDO', { exact: true })
    2) <span class="transition-opacity duration-500 opacity-0">Kingdom </span> aka getByText('Kingdom', { exact: true })

Call log:
[2m    - checking visibility of locator('text=KINGDO')[22m

```

### IndexedDB Tests > Blob Stored on First Visit
```
[2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31mfalse[39m
```

### IndexedDB Tests > Database Structure
```
[2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31mfalse[39m
```

### Persistence Tests > Database Survives Navigation
```
[2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31mfalse[39m
```

### Persistence Tests > UpdatedAt Timestamp Changes
```
page.waitForTimeout: Target page, context or browser has been closed
```

### Biometric Tests > Biometric Table Exists
```
[2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected value: [32m"biometric"[39m
Received array: [31m[][39m
```

### Biometric Tests > Biometric State Persists
```
[2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32mtrue[39m
Received: [31mundefined[39m
```

---

*Report generated by Kingdom Mind Sanctuary Test Suite*
