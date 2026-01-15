import crypto from 'node:crypto';

// Word lists - mix of nature and spiritual/kingdom themed
const adjectives = [
  // Nature
  'calm', 'swift', 'gentle', 'bold', 'quiet', 'still', 'bright', 'deep',
  'wild', 'soft', 'warm', 'cool', 'clear', 'pure', 'fresh', 'free',
  // Spiritual
  'faithful', 'humble', 'steadfast', 'graceful', 'patient', 'hopeful',
  'joyful', 'peaceful', 'trusting', 'devoted', 'blessed', 'grateful',
  'sincere', 'honest', 'noble', 'valiant', 'wise', 'true', 'kind', 'brave',
];

const nouns = [
  // Nature
  'river', 'mountain', 'forest', 'dawn', 'stone', 'ember', 'cedar', 'hawk',
  'meadow', 'storm', 'valley', 'ocean', 'brook', 'pine', 'oak', 'eagle',
  'wolf', 'bear', 'deer', 'falcon', 'rain', 'snow', 'wind', 'fire',
  'star', 'moon', 'sun', 'cloud', 'leaf', 'root', 'seed', 'bloom',
  // Spiritual
  'pilgrim', 'shepherd', 'servant', 'covenant', 'refuge', 'anchor', 'beacon',
  'haven', 'path', 'light', 'truth', 'grace', 'faith', 'hope', 'peace',
  'spirit', 'heart', 'soul', 'wisdom', 'journey', 'vessel', 'temple',
];

const verbs = [
  // Action words that work as third word
  'flows', 'rises', 'shines', 'grows', 'stands', 'soars', 'rests', 'seeks',
  'guides', 'leads', 'calls', 'waits', 'hopes', 'trusts', 'walks', 'runs',
  'climbs', 'dances', 'sings', 'speaks', 'listens', 'watches', 'guards', 'holds',
];

type Pattern = 'adj-noun-noun' | 'adj-noun-verb' | 'noun-noun-noun' | 'adj-adj-noun';

const patterns: Pattern[] = ['adj-noun-noun', 'adj-noun-verb', 'noun-noun-noun', 'adj-adj-noun'];

/**
 * Get a cryptographically random element from an array
 */
function randomElement<T>(arr: T[]): T {
  const index = crypto.randomInt(0, arr.length);
  return arr[index];
}

/**
 * Generate a single username based on a pattern
 */
function generateByPattern(pattern: Pattern): string {
  switch (pattern) {
    case 'adj-noun-noun':
      return `${randomElement(adjectives)}-${randomElement(nouns)}-${randomElement(nouns)}`;
    case 'adj-noun-verb':
      return `${randomElement(adjectives)}-${randomElement(nouns)}-${randomElement(verbs)}`;
    case 'noun-noun-noun':
      return `${randomElement(nouns)}-${randomElement(nouns)}-${randomElement(nouns)}`;
    case 'adj-adj-noun':
      return `${randomElement(adjectives)}-${randomElement(adjectives)}-${randomElement(nouns)}`;
  }
}

/**
 * Generate a single random username
 */
export function generateUsername(): string {
  const pattern = randomElement(patterns);
  return generateByPattern(pattern);
}

/**
 * Generate multiple unique usernames
 * @param count - Number of usernames to generate (default 3)
 */
export function generateUsernames(count: number = 3): string[] {
  const usernames = new Set<string>();

  // Generate until we have enough unique ones
  while (usernames.size < count) {
    usernames.add(generateUsername());
  }

  return Array.from(usernames);
}

/**
 * Validate username format (three words separated by hyphens)
 */
export function validateUsernameFormat(username: string): boolean {
  const parts = username.toLowerCase().split('-');
  if (parts.length !== 3) return false;

  // Each part should be alphabetic only
  return parts.every(part => /^[a-z]+$/.test(part));
}

/**
 * Hash a username for storage (same approach as email hashing)
 */
export function hashUsername(username: string): string {
  const salt = process.env.IDENTITY_SALT || 'sanctuary-salt-v1';
  return crypto.createHmac('sha256', salt).update(username.toLowerCase()).digest('hex');
}
