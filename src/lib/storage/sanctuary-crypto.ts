import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

// Get the encryption key from environment
function getKey(): Buffer {
  const keyBase64 = process.env.SANCTUARY_ENCRYPTION_KEY;
  if (!keyBase64) {
    throw new Error('SANCTUARY_ENCRYPTION_KEY environment variable is not set');
  }
  return Buffer.from(keyBase64, 'base64');
}

// Sanctuary data structure (decrypted)
export interface SanctuaryData {
  // User's insights (PII-free breakthrough summaries)
  insights: Array<{
    id: string;
    domain: string;
    summary: string;
    createdAt: number; // timestamp
  }>;

  // User's progression
  progression: {
    resonance: {
      identity: number;
      purpose: number;
      mindset: number;
      relationships: number;
      vision: number;
      action: number;
      legacy: number;
    };
    curriculumStage: number;
    totalBreakthroughs: number;
    journeyStarted: number; // timestamp
  };

  // Optional preferences (read-only context for AI)
  preferences?: {
    prefersStories?: boolean;
    responseLength?: 'short' | 'medium' | 'long';
  };

  // Metadata
  version: number;
  lastUpdated: number;
}

// Create an empty sanctuary for new users
export function createEmptySanctuary(): SanctuaryData {
  return {
    insights: [],
    progression: {
      resonance: {
        identity: 0,
        purpose: 0,
        mindset: 0,
        relationships: 0,
        vision: 0,
        action: 0,
        legacy: 0,
      },
      curriculumStage: 0,
      totalBreakthroughs: 0,
      journeyStarted: Date.now(),
    },
    preferences: {},
    version: 1,
    lastUpdated: Date.now(),
  };
}

// Encrypt sanctuary data to a blob
export function encryptSanctuary(data: SanctuaryData): string {
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const jsonStr = JSON.stringify(data);
  let encrypted = cipher.update(jsonStr, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
}

// Decrypt sanctuary blob to data
export function decryptSanctuary(blob: string): SanctuaryData {
  const key = getKey();
  const parts = blob.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid sanctuary blob format');
  }

  const [ivBase64, authTagBase64, encrypted] = parts;
  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return JSON.parse(decrypted) as SanctuaryData;
}

// Validate and sanitize sanctuary data from client
export function validateSanctuary(data: unknown): SanctuaryData | null {
  try {
    const sanctuary = data as SanctuaryData;

    // Basic structure validation
    if (!sanctuary || typeof sanctuary !== 'object') return null;
    if (!Array.isArray(sanctuary.insights)) return null;
    if (!sanctuary.progression || typeof sanctuary.progression !== 'object') return null;

    // Validate progression values are within bounds
    const { resonance } = sanctuary.progression;
    if (!resonance) return null;

    const domains = ['identity', 'purpose', 'mindset', 'relationships', 'vision', 'action', 'legacy'];
    for (const domain of domains) {
      const value = resonance[domain as keyof typeof resonance];
      if (typeof value !== 'number' || value < 0 || value > 1000) {
        // Cap at reasonable value
        resonance[domain as keyof typeof resonance] = Math.max(0, Math.min(1000, value || 0));
      }
    }

    // Validate curriculum stage
    if (typeof sanctuary.progression.curriculumStage !== 'number') {
      sanctuary.progression.curriculumStage = 0;
    }
    sanctuary.progression.curriculumStage = Math.max(0, Math.min(21, sanctuary.progression.curriculumStage));

    // Sanitize insights - remove any potential prompt injection
    sanctuary.insights = sanctuary.insights.map(insight => ({
      id: String(insight.id || crypto.randomUUID()),
      domain: sanitizeString(insight.domain, 50),
      summary: sanitizeString(insight.summary, 500),
      createdAt: typeof insight.createdAt === 'number' ? insight.createdAt : Date.now(),
    }));

    // Limit number of insights to prevent abuse
    if (sanctuary.insights.length > 1000) {
      sanctuary.insights = sanctuary.insights.slice(-1000);
    }

    return sanctuary;
  } catch {
    return null;
  }
}

// Sanitize string to prevent prompt injection
function sanitizeString(str: unknown, maxLength: number): string {
  if (typeof str !== 'string') return '';

  // Remove potential prompt injection patterns
  let sanitized = str
    .replace(/\{\{.*?\}\}/g, '') // Remove template tags
    .replace(/\[\[.*?\]\]/g, '') // Remove wiki-style links
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .trim();

  // Truncate to max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  return sanitized;
}

// Calculate display data from sanctuary (for client rendering)
export function calculateDisplayData(sanctuary: SanctuaryData): {
  stars: Record<string, number>;
  stage: number;
  totalBreakthroughs: number;
} {
  const { progression } = sanctuary;

  // Calculate stars per domain (1 star per 3 resonance points)
  const stars: Record<string, number> = {};
  for (const [domain, value] of Object.entries(progression.resonance)) {
    stars[domain] = Math.floor(value / 3);
  }

  return {
    stars,
    stage: progression.curriculumStage,
    totalBreakthroughs: progression.totalBreakthroughs,
  };
}
