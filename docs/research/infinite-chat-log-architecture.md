# Infinite Persistent Chat Log System: Research & Architecture

## Executive Summary

This document presents a comprehensive analysis of approaches for implementing an infinite, persistent chat log system with smart context retrieval for an AI coding assistant. The recommended architecture uses **SQLite with FTS5** as the primary storage format, combined with a **hybrid retrieval strategy** that blends recent context with keyword and (optionally) semantic search.

---

## Part 1: Log File Format Comparison

### Option A: JSONL (JSON Lines)

**Structure:**
```jsonl
{"id":"msg_001","ts":"2025-01-14T10:30:00Z","role":"user","content":"...","tags":["file:app.ts","command:edit"]}
{"id":"msg_002","ts":"2025-01-14T10:30:05Z","role":"assistant","content":"...","tags":["file:app.ts"]}
```

**Pros:**
- Human-readable and easy to debug
- Append-only writes are atomic (no read-modify-write)
- Simple to implement with any language
- Works with standard Unix tools (grep, tail, head)
- Git-friendly for version control if desired
- No external dependencies

**Cons:**
- No built-in indexing; full file scan for search
- Linear O(n) search performance degrades with size
- No transactional guarantees beyond single appends
- Storage inefficient (JSON overhead ~30-40% vs binary)
- Must parse entire file to get statistics

**Best For:** Simple logging, append-only scenarios, files under 100MB

### Option B: SQLite with FTS5

**Structure:**
```sql
CREATE TABLE messages (
    id INTEGER PRIMARY KEY,
    session_id TEXT,
    timestamp TEXT,
    role TEXT CHECK(role IN ('user', 'assistant', 'system')),
    content TEXT,
    model TEXT,
    tokens_used INTEGER,
    metadata JSON
);

CREATE VIRTUAL TABLE messages_fts USING fts5(
    content,
    content='messages',
    content_rowid='id'
);

CREATE TABLE tags (
    id INTEGER PRIMARY KEY,
    message_id INTEGER REFERENCES messages(id),
    tag_type TEXT,  -- 'file', 'command', 'topic', 'error'
    tag_value TEXT
);
CREATE INDEX idx_tags ON tags(tag_type, tag_value);
```

**Pros:**
- Built-in FTS5 for fast full-text search
- ACID transactions protect data integrity
- Excellent compression (4-5x smaller than JSON in real cases)
- Concurrent read access; WAL mode for better concurrency
- Complex queries (date ranges, tag filtering, aggregations)
- Portable single-file database
- Indexing happens automatically on insert

**Cons:**
- Binary format (not human-readable without tooling)
- Slightly more complex implementation
- Write locking (one writer at a time, but fast)

**Best For:** Production systems, search-heavy use cases, files over 100MB

### Option C: Hybrid (JSONL primary + SQLite index)

**Structure:**
- `architect.log` - JSONL append-only source of truth
- `architect.db` - SQLite with FTS5 index pointing back to JSONL offsets

**Pros:**
- Human-readable primary log
- Fast search via SQLite index
- Can rebuild index from JSONL if needed

**Cons:**
- Double storage overhead
- Must keep both in sync
- More complex implementation

### Recommendation: **SQLite with FTS5**

For this use case, SQLite provides the best balance of simplicity, durability, and search performance. The storage efficiency advantage (4-5x compression over JSON) becomes significant over months/years of use.

---

## Part 2: Schema Design for Chat Entries

### Recommended Schema

```sql
-- Core message storage
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,           -- Groups related messages
    timestamp TEXT NOT NULL,            -- ISO 8601 format
    role TEXT NOT NULL,                 -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,              -- Full message content
    content_hash TEXT,                  -- SHA-256 for deduplication

    -- AI-specific metadata
    model TEXT,                         -- Model that generated response
    tokens_input INTEGER,
    tokens_output INTEGER,
    latency_ms INTEGER,

    -- Flexible metadata
    metadata JSON                       -- Extensible JSON blob
);

-- Full-text search index
CREATE VIRTUAL TABLE messages_fts USING fts5(
    content,
    content='messages',
    content_rowid='id',
    tokenize='porter unicode61'         -- Stemming + unicode support
);

-- Structured tags for fast filtering
CREATE TABLE tags (
    id INTEGER PRIMARY KEY,
    message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    tag_type TEXT NOT NULL,
    tag_value TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_tags_type_value ON tags(tag_type, tag_value);
CREATE INDEX idx_tags_message ON tags(message_id);

-- Summaries of conversation segments (for context compression)
CREATE TABLE summaries (
    id INTEGER PRIMARY KEY,
    start_message_id INTEGER NOT NULL,
    end_message_id INTEGER NOT NULL,
    summary_text TEXT NOT NULL,
    token_count INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Optional: Vector embeddings for semantic search
CREATE TABLE embeddings (
    message_id INTEGER PRIMARY KEY REFERENCES messages(id),
    embedding BLOB,                     -- Float array as binary
    model TEXT                          -- Embedding model used
);
```

### Tag Types to Capture

| Tag Type | Examples | Extraction Method |
|----------|----------|-------------------|
| `file` | `src/app.ts`, `README.md` | Regex: paths with extensions |
| `command` | `git commit`, `npm install` | Regex: shell commands |
| `function` | `createUser()`, `handleClick` | Regex: function patterns |
| `error` | `TypeError`, `ENOENT` | Regex: error patterns |
| `topic` | `authentication`, `database` | Keyword extraction or LLM |
| `language` | `typescript`, `python` | File extension inference |
| `action` | `create`, `modify`, `delete` | Verb detection |

---

## Part 3: Tagging and Indexing Strategies

### Automatic Tag Extraction

```typescript
interface TagExtractor {
  type: string;
  pattern: RegExp;
  extract: (match: RegExpMatchArray) => string;
}

const extractors: TagExtractor[] = [
  // File paths
  {
    type: 'file',
    pattern: /(?:^|\s)((?:\.{0,2}\/)?[\w\-./]+\.\w{1,10})(?:\s|$|:|\))/gm,
    extract: (m) => m[1]
  },

  // Shell commands
  {
    type: 'command',
    pattern: /(?:run|execute|`)(npm|git|docker|yarn|pnpm|npx)\s+\w+/gi,
    extract: (m) => m[0].replace(/`/g, '').trim()
  },

  // Function/method names
  {
    type: 'function',
    pattern: /\b([a-z][a-zA-Z0-9_]*)\s*\(/g,
    extract: (m) => m[1]
  },

  // Error types
  {
    type: 'error',
    pattern: /\b([A-Z][a-zA-Z]*Error|E[A-Z]{2,})\b/g,
    extract: (m) => m[1]
  },

  // Programming languages
  {
    type: 'language',
    pattern: /```(\w+)/g,
    extract: (m) => m[1]
  }
];

function extractTags(content: string): Array<{type: string, value: string}> {
  const tags: Array<{type: string, value: string}> = [];

  for (const extractor of extractors) {
    let match;
    while ((match = extractor.pattern.exec(content)) !== null) {
      tags.push({
        type: extractor.type,
        value: extractor.extract(match)
      });
    }
  }

  return deduplicateTags(tags);
}
```

### Topic Extraction Options

**Option 1: Keyword-Based (No Dependencies)**
- Extract nouns and noun phrases using simple heuristics
- Build a domain-specific vocabulary list over time
- Fast, predictable, zero API cost

**Option 2: Local LLM Classification**
- Use a small local model (e.g., Phi-3, TinyLlama) for topic extraction
- Run async/batch to avoid latency impact
- More accurate but requires local compute

**Option 3: On-Demand LLM Tagging**
- Request topic extraction from the main LLM when inserting
- Most accurate but adds latency and cost
- Can be done asynchronously after initial insert

### Full-Text Search with FTS5

```sql
-- Keep FTS index synchronized with triggers
CREATE TRIGGER messages_ai AFTER INSERT ON messages BEGIN
    INSERT INTO messages_fts(rowid, content) VALUES (new.id, new.content);
END;

CREATE TRIGGER messages_ad AFTER DELETE ON messages BEGIN
    INSERT INTO messages_fts(messages_fts, rowid, content)
    VALUES('delete', old.id, old.content);
END;

CREATE TRIGGER messages_au AFTER UPDATE ON messages BEGIN
    INSERT INTO messages_fts(messages_fts, rowid, content)
    VALUES('delete', old.id, old.content);
    INSERT INTO messages_fts(rowid, content) VALUES (new.id, new.content);
END;

-- Search query with BM25 ranking
SELECT m.*, bm25(messages_fts) as rank
FROM messages m
JOIN messages_fts ON m.id = messages_fts.rowid
WHERE messages_fts MATCH 'authentication AND user'
ORDER BY rank
LIMIT 20;
```

---

## Part 4: Context Retrieval Methods

### Strategy 1: Recent Window (Baseline)

```typescript
async function getRecentContext(db: Database, count: number = 30): Promise<Message[]> {
  return db.all(`
    SELECT * FROM messages
    ORDER BY timestamp DESC
    LIMIT ?
  `, [count]);
}
```

**Pros:** Simple, fast, always relevant for immediate context
**Cons:** Misses important earlier context

### Strategy 2: Keyword Search

```typescript
async function searchByKeywords(db: Database, query: string, limit: number = 10): Promise<Message[]> {
  // Escape FTS5 special characters
  const sanitized = query.replace(/['"]/g, '');

  return db.all(`
    SELECT m.*, bm25(messages_fts) as relevance
    FROM messages m
    JOIN messages_fts ON m.id = messages_fts.rowid
    WHERE messages_fts MATCH ?
    ORDER BY relevance
    LIMIT ?
  `, [sanitized, limit]);
}
```

**Pros:** Fast, no API calls, good for exact matches
**Cons:** Misses semantic similarity

### Strategy 3: Semantic Search (Optional Enhancement)

```typescript
// Using sqlite-vec for local vector search
async function semanticSearch(
  db: Database,
  queryEmbedding: Float32Array,
  limit: number = 10
): Promise<Message[]> {
  return db.all(`
    SELECT m.*, vec_distance_cosine(e.embedding, ?) as distance
    FROM messages m
    JOIN embeddings e ON m.id = e.message_id
    ORDER BY distance ASC
    LIMIT ?
  `, [queryEmbedding, limit]);
}
```

**Embedding Options:**
- **sqlite-lembed**: Local .gguf model embeddings (e.g., all-MiniLM-L6-v2)
- **Ollama**: Local embedding API
- **API-based**: OpenAI/Anthropic embeddings (adds latency/cost)

### Strategy 4: Hybrid Retrieval (Recommended)

```typescript
interface RetrievalResult {
  recentMessages: Message[];
  keywordMatches: Message[];
  semanticMatches?: Message[];
  summaries: Summary[];
}

async function hybridRetrieval(
  db: Database,
  currentQuery: string,
  options: {
    recentCount: number;      // e.g., 30
    keywordLimit: number;     // e.g., 10
    includeSemantic: boolean;
    includeSummaries: boolean;
  }
): Promise<RetrievalResult> {
  const recent = await getRecentContext(db, options.recentCount);
  const recentIds = new Set(recent.map(m => m.id));

  // Extract keywords from current query
  const keywords = extractSearchTerms(currentQuery);

  // Search for older relevant messages (excluding recent)
  const keywordMatches = await db.all(`
    SELECT m.*, bm25(messages_fts) as relevance
    FROM messages m
    JOIN messages_fts ON m.id = messages_fts.rowid
    WHERE messages_fts MATCH ?
      AND m.id NOT IN (${[...recentIds].join(',')})
    ORDER BY relevance
    LIMIT ?
  `, [keywords.join(' OR '), options.keywordLimit]);

  // Optional: Get relevant summaries of older conversation segments
  const summaries = options.includeSummaries
    ? await getRelevantSummaries(db, keywords)
    : [];

  return {
    recentMessages: recent,
    keywordMatches,
    summaries
  };
}

function formatContextForPrompt(result: RetrievalResult): string {
  let context = '';

  // Summaries of older context
  if (result.summaries.length > 0) {
    context += '## Earlier Context (Summarized)\n';
    for (const s of result.summaries) {
      context += `${s.summary_text}\n\n`;
    }
  }

  // Retrieved relevant messages
  if (result.keywordMatches.length > 0) {
    context += '## Relevant Earlier Messages\n';
    for (const m of result.keywordMatches) {
      context += `[${m.timestamp}] ${m.role}: ${truncate(m.content, 500)}\n`;
    }
    context += '\n';
  }

  // Recent conversation
  context += '## Recent Conversation\n';
  for (const m of result.recentMessages) {
    context += `${m.role}: ${m.content}\n\n`;
  }

  return context;
}
```

### Strategy 5: Reciprocal Rank Fusion (Advanced Hybrid)

When combining multiple retrieval methods:

```typescript
function reciprocalRankFusion(
  results: Array<{source: string, messages: Message[]}>,
  k: number = 60
): Message[] {
  const scores = new Map<number, number>();

  for (const {messages} of results) {
    messages.forEach((msg, rank) => {
      const current = scores.get(msg.id) || 0;
      scores.set(msg.id, current + 1 / (k + rank + 1));
    });
  }

  // Sort by combined score
  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => results.flatMap(r => r.messages).find(m => m.id === id)!);
}
```

---

## Part 5: Lessons from Existing Solutions

### MemGPT / Letta Architecture

**Key Insight:** Three-tier memory system with agent-directed retrieval

| Tier | Description | Implementation |
|------|-------------|----------------|
| **In-Context** | Always in prompt, editable by AI | ~2000 chars, core facts |
| **Recall Memory** | Searchable conversation history | SQLite/PostgreSQL |
| **Archival Memory** | Long-term vector storage | Embedding database |

**Applicable Pattern:** Let the AI request specific context retrieval through tool calls rather than trying to automatically include everything.

### Claude Code's Memory System

**Key Insight:** Hierarchical CLAUDE.md files merged into context

| Location | Scope | Use Case |
|----------|-------|----------|
| `~/.claude/CLAUDE.md` | Global | Personal preferences |
| `./CLAUDE.md` | Project | Team conventions |
| `./CLAUDE.local.md` | Local (gitignored) | Private notes |
| `.claude/rules/*.md` | Modular | Topic-specific rules |

**Applicable Pattern:** Persistent instruction files loaded on session start, separate from conversation history.

### LangChain Memory Evolution

**Key Insight:** Moved from in-memory to persistent checkpointing (LangGraph)

- `SqliteSaver` for persistent conversation state
- Supports resuming sessions across restarts
- Auto-compaction for long conversations

**Applicable Pattern:** Store checkpoints at key moments, not just raw messages.

### Continue.dev Storage

**Key Insight:** Session-based storage in `.continue` folder

- Per-workspace chat history
- `lastAccessed` timestamp for session loading
- Known issues with real-time history updates

**Applicable Pattern:** Workspace-scoped storage locations.

---

## Part 6: Performance Considerations

### Log Size Projections

| Timeframe | Messages/Day | Avg Size/Msg | Total Size | Notes |
|-----------|--------------|--------------|------------|-------|
| 1 month | 100 | 2 KB | ~6 MB | Light use |
| 1 month | 500 | 3 KB | ~45 MB | Heavy use |
| 1 year | 200 | 2.5 KB | ~180 MB | Moderate use |
| 1 year | 500 | 3 KB | ~540 MB | Heavy use |
| 5 years | 300 | 2.5 KB | ~1.4 GB | Long-term |

**SQLite Handles This Well:**
- Tested to 281 TB maximum database size
- FTS5 queries remain fast (<50ms) up to millions of records
- WAL mode enables concurrent reads during writes

### Search Performance Benchmarks

| Records | FTS5 Search | Tag Index | Full Scan |
|---------|-------------|-----------|-----------|
| 10,000 | <10ms | <5ms | ~100ms |
| 100,000 | <50ms | <10ms | ~1s |
| 1,000,000 | <200ms | <50ms | ~10s |

### Incremental Indexing

FTS5 indexes update automatically on INSERT/UPDATE/DELETE via triggers. For bulk imports:

```sql
-- Disable triggers during bulk insert
DROP TRIGGER messages_ai;

-- Bulk insert
INSERT INTO messages (...) VALUES (...), (...), ...;

-- Rebuild FTS index
INSERT INTO messages_fts(messages_fts) VALUES('rebuild');

-- Re-enable triggers
CREATE TRIGGER messages_ai AFTER INSERT ON messages ...;
```

---

## Part 7: Implementation Patterns

### File Locking Strategy

For SQLite with WAL mode:

```typescript
import Database from 'better-sqlite3';

const db = new Database('architect.db', {
  // WAL mode for concurrent reads
  // Busy timeout to wait for locks
});

db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');  // Wait up to 5s for locks
db.pragma('synchronous = NORMAL'); // Good balance of safety/speed
```

For JSONL append-only (if using that format):

```typescript
import { open, constants } from 'fs/promises';

async function appendToLog(logPath: string, entry: object): Promise<void> {
  const handle = await open(logPath, constants.O_WRONLY | constants.O_APPEND | constants.O_CREAT);
  try {
    const line = JSON.stringify(entry) + '\n';
    await handle.write(line);
  } finally {
    await handle.close();
  }
}
```

### Single File vs Rotation

**Recommendation: Single file for Architect mode**

Reasons:
- Simpler retrieval (no cross-file searching)
- SQLite handles large files well
- Single source of truth
- Easier backup/restore

If rotation is ever needed:
```sql
-- Archive old messages to separate file
ATTACH 'architect-archive-2025.db' AS archive;
INSERT INTO archive.messages SELECT * FROM messages WHERE timestamp < '2025-01-01';
DELETE FROM messages WHERE timestamp < '2025-01-01';
VACUUM;  -- Reclaim space
DETACH archive;
```

### Backup Strategy

```bash
# SQLite online backup (safe during writes with WAL mode)
sqlite3 architect.db ".backup architect-backup-$(date +%Y%m%d).db"

# Or use the backup API programmatically
```

```typescript
const backup = db.backup('architect-backup.db');
backup.step(-1);  // Copy all pages
backup.close();
```

### Recovery from Corruption

```bash
# Check integrity
sqlite3 architect.db "PRAGMA integrity_check;"

# Recover if needed
sqlite3 architect.db ".recover" | sqlite3 architect-recovered.db
```

---

## Part 8: Recommended Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Architect Mode                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Message    │───▶│   Tagger     │───▶│   SQLite     │  │
│  │   Input      │    │  (Regex +    │    │   Writer     │  │
│  │              │    │   Keywords)  │    │              │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                    │         │
│                                                    ▼         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  architect.db                         │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐  │  │
│  │  │ messages │ │messages_ │ │   tags   │ │summaries│  │  │
│  │  │          │ │   fts    │ │          │ │         │  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └─────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                             │                                │
│                             ▼                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Context Retriever                        │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────┐  │  │
│  │  │ Recent 30  │  │  Keyword   │  │   Summaries    │  │  │
│  │  │  Messages  │  │   Search   │  │  (Compressed)  │  │  │
│  │  └────────────┘  └────────────┘  └────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                             │                                │
│                             ▼                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                 Context Formatter                     │  │
│  │  Combines: Summaries + Relevant + Recent → Prompt    │  │
│  └──────────────────────────────────────────────────────┘  │
│                             │                                │
│                             ▼                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    AI Model                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### File Structure

```
.architect/
├── architect.db           # SQLite database (messages, FTS, tags)
├── config.json            # Retrieval settings
└── backups/
    └── architect-YYYYMMDD.db
```

### Complete Entry Schema

```typescript
interface ChatMessage {
  id: number;
  session_id: string;         // UUID for session grouping
  timestamp: string;          // ISO 8601
  role: 'user' | 'assistant' | 'system';
  content: string;
  content_hash: string;       // SHA-256 for dedup

  // AI metadata
  model?: string;
  tokens_input?: number;
  tokens_output?: number;
  latency_ms?: number;

  // Extensible
  metadata?: {
    files_mentioned?: string[];
    commands_run?: string[];
    tools_used?: string[];
    [key: string]: unknown;
  };
}

interface Tag {
  id: number;
  message_id: number;
  tag_type: 'file' | 'command' | 'function' | 'error' | 'topic' | 'language';
  tag_value: string;
}

interface Summary {
  id: number;
  start_message_id: number;
  end_message_id: number;
  summary_text: string;       // Compressed representation
  token_count: number;
  created_at: string;
}
```

---

## Part 9: Retrieval Function Pseudocode

```typescript
/**
 * Main retrieval function for Architect mode context
 */
async function retrieveContext(
  db: Database,
  currentMessage: string,
  config: {
    recentCount: number;        // Default: 30
    keywordResultLimit: number; // Default: 10
    maxContextTokens: number;   // Default: 8000
    includeSummaries: boolean;  // Default: true
  }
): Promise<string> {

  // 1. Always get recent messages (immediate context)
  const recentMessages = await db.all(`
    SELECT * FROM messages
    ORDER BY timestamp DESC
    LIMIT ?
  `, [config.recentCount]);

  const recentIds = new Set(recentMessages.map(m => m.id));

  // 2. Extract search terms from current message
  const searchTerms = extractSearchTerms(currentMessage);
  // - File paths mentioned
  // - Function names
  // - Error types
  // - Key nouns/concepts

  // 3. Search for relevant older messages
  let keywordMatches: Message[] = [];
  if (searchTerms.length > 0) {
    const ftsQuery = searchTerms.map(t => `"${t}"`).join(' OR ');
    keywordMatches = await db.all(`
      SELECT m.*, bm25(messages_fts) as relevance
      FROM messages m
      JOIN messages_fts ON m.id = messages_fts.rowid
      WHERE messages_fts MATCH ?
        AND m.id NOT IN (${[...recentIds].join(',') || '-1'})
      ORDER BY relevance
      LIMIT ?
    `, [ftsQuery, config.keywordResultLimit]);
  }

  // 4. Get summaries of older conversation segments
  let summaries: Summary[] = [];
  if (config.includeSummaries) {
    const oldestRecentId = Math.min(...recentIds);
    summaries = await db.all(`
      SELECT * FROM summaries
      WHERE end_message_id < ?
      ORDER BY end_message_id DESC
      LIMIT 5
    `, [oldestRecentId]);
  }

  // 5. Format into prompt context
  let context = '';
  let tokenCount = 0;

  // Add summaries first (oldest context, compressed)
  if (summaries.length > 0) {
    context += '## Historical Context (Summarized)\n';
    for (const s of summaries.reverse()) {
      if (tokenCount + s.token_count > config.maxContextTokens * 0.2) break;
      context += s.summary_text + '\n\n';
      tokenCount += s.token_count;
    }
  }

  // Add retrieved relevant messages
  if (keywordMatches.length > 0) {
    context += '## Relevant Earlier Discussion\n';
    for (const m of keywordMatches) {
      const msgTokens = estimateTokens(m.content);
      if (tokenCount + msgTokens > config.maxContextTokens * 0.4) break;
      context += formatMessage(m) + '\n';
      tokenCount += msgTokens;
    }
  }

  // Add recent conversation (most important, highest fidelity)
  context += '## Current Conversation\n';
  for (const m of recentMessages.reverse()) {
    const msgTokens = estimateTokens(m.content);
    if (tokenCount + msgTokens > config.maxContextTokens) break;
    context += formatMessage(m) + '\n';
    tokenCount += msgTokens;
  }

  return context;
}

function extractSearchTerms(text: string): string[] {
  const terms: string[] = [];

  // File paths
  const files = text.match(/[\w\-./]+\.\w{1,10}/g) || [];
  terms.push(...files);

  // Function names
  const funcs = text.match(/\b[a-z][a-zA-Z0-9_]*(?=\s*\()/g) || [];
  terms.push(...funcs);

  // Error types
  const errors = text.match(/\b[A-Z][a-zA-Z]*Error\b/g) || [];
  terms.push(...errors);

  // Key words (nouns, removing common stop words)
  const words = text.toLowerCase().split(/\W+/)
    .filter(w => w.length > 3)
    .filter(w => !STOP_WORDS.has(w));
  terms.push(...words.slice(0, 5));

  return [...new Set(terms)];
}

function formatMessage(m: Message): string {
  const timestamp = new Date(m.timestamp).toLocaleString();
  const role = m.role.charAt(0).toUpperCase() + m.role.slice(1);
  return `[${timestamp}] ${role}: ${m.content}`;
}
```

---

## Part 10: Tool and Library Recommendations

### Primary Stack (Node.js/TypeScript)

| Component | Library | Notes |
|-----------|---------|-------|
| SQLite | `better-sqlite3` | Synchronous, fast, well-maintained |
| FTS5 | Built into SQLite | No additional dependency |
| Migrations | `drizzle-kit` or raw SQL | Matches existing project |
| Token estimation | `gpt-tokenizer` | Client-side token counting |

### Optional Enhancements

| Component | Library | Notes |
|-----------|---------|-------|
| Vector search | `sqlite-vec` | Local semantic search |
| Embeddings | `@xenova/transformers` | Local embedding generation |
| Summarization | `ollama` | Local LLM for summaries |

### Alternative Stack (Python)

| Component | Library | Notes |
|-----------|---------|-------|
| SQLite | Built-in `sqlite3` | Standard library |
| ORM | `SQLAlchemy` | If needed |
| Embeddings | `sentence-transformers` | Local models |
| Vector search | `chromadb` | Full-featured alternative |

---

## Implementation Roadmap

### Phase 1: Core Storage (MVP)
1. Create SQLite schema with messages + FTS5
2. Implement append function with auto-tagging
3. Basic recent-context retrieval (last 30 messages)
4. Integration with Architect mode

### Phase 2: Smart Retrieval
1. Keyword extraction from current query
2. FTS5 search for relevant older messages
3. Hybrid context formatting
4. Token budget management

### Phase 3: Context Compression
1. Periodic summarization of old segments
2. Summary storage and retrieval
3. Multi-tier context assembly

### Phase 4: Optional Semantic Search
1. Add embedding generation
2. Vector storage with sqlite-vec
3. Hybrid ranking (RRF)

---

## References

### Research Papers and Documentation
- [MemGPT: Towards LLMs as Operating Systems](https://arxiv.org/abs/2310.08560)
- [SQLite FTS5 Documentation](https://sqlite.org/fts5.html)
- [Letta Memory Management Docs](https://docs.letta.com/advanced/memory-management/)

### Implementation Resources
- [Hybrid Search with sqlite-vec](https://alexgarcia.xyz/blog/2024/sqlite-vec-hybrid-search/index.html)
- [Claude Code Memory Docs](https://code.claude.com/docs/en/memory)
- [LangChain Long-term Memory](https://docs.langchain.com/oss/python/deepagents/long-term-memory)

### Tools
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [sqlite-vec](https://github.com/asg017/sqlite-vec)
- [sqlite-lembed](https://github.com/asg017/sqlite-lembed)
