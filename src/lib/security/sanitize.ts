/**
 * Security Sanitization Utilities
 * Phase 18: Deep Security Hardening
 *
 * Defense-in-depth protection for chat input/output
 */

// Input length limits
export const INPUT_LIMITS = {
  MAX_MESSAGE_LENGTH: 1000,      // ~200 words max - enough for chatting
  MAX_HISTORY_MESSAGES: 10,      // Keep context limited
  MIN_MESSAGE_LENGTH: 1,
} as const;

// Rate limiting constants
export const RATE_LIMITS = {
  MAX_REQUESTS_PER_MINUTE: 20,
  WINDOW_MS: 60000,
} as const;

// Patterns that look like our special tags - NEVER allow in user input
const DANGEROUS_PATTERNS = [
  /\[GIFT_ADDRESS:[^\]]*\]/gi,
  /\[GIFT_REQUEST\]/gi,
  /\[GIFT_WALLET\]/gi,
  /\[GIFT_QR\]/gi,
  /\[OPEN_WALLET:[^\]]*\]/gi,
  /\[SHOW_QR:[^\]]*\]/gi,
  /\[BACKUP_EXPORT\]/gi,
  /\[BACKUP_IMPORT\]/gi,
  /\[BREAKTHROUGH:[^\]]*\]/gi,
  /\[RESONANCE:[^\]]*\]/gi,
];

/**
 * Sanitize user input before sending to AI
 * Removes any attempt to inject our special tags
 */
export function sanitizeUserInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Remove any tag-like patterns that match our special tags
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[removed]');
  }

  // Limit length
  if (sanitized.length > INPUT_LIMITS.MAX_MESSAGE_LENGTH) {
    sanitized = sanitized.slice(0, INPUT_LIMITS.MAX_MESSAGE_LENGTH);
  }

  return sanitized.trim();
}

/**
 * CRITICAL: Sanitize AI output before client receives it
 * Strip ALL special tags - only server can add them back legitimately
 *
 * This prevents prompt injection attacks where attacker tricks AI
 * into outputting fake Bitcoin addresses or other action tags
 */
export function sanitizeAIOutput(output: string): string {
  if (!output || typeof output !== 'string') {
    return '';
  }

  let sanitized = output;

  // Remove ALL special tags from AI output
  // The server will add legitimate ones back after this
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  return sanitized.trim();
}

/**
 * Check if AI output contains a specific action request
 * Used to detect legitimate AI-requested actions BEFORE sanitization
 *
 * Detects both explicit tags AND natural language patterns
 * (because some models don't reliably output tags)
 */
export function detectActionRequest(rawOutput: string, action: string): boolean {
  if (!rawOutput || typeof rawOutput !== 'string') {
    return false;
  }

  const lowerOutput = rawOutput.toLowerCase();

  // Primary: Check for explicit tags
  const tagPatterns: Record<string, RegExp> = {
    'gift': /\[GIFT_REQUEST\]/i,
    'gift_wallet': /\[GIFT_WALLET\]/i,
    'gift_qr': /\[GIFT_QR\]/i,
    'backup': /\[BACKUP_EXPORT\]/i,
    'restore': /\[BACKUP_IMPORT\]/i,
  };

  const tagPattern = tagPatterns[action];
  if (tagPattern && tagPattern.test(rawOutput)) {
    return true;
  }

  // Fallback: Check for natural language patterns (AI didn't use tags)
  const naturalPatterns: Record<string, string[]> = {
    'gift_wallet': [
      'opening your wallet',
      'open your wallet',
      'opening the wallet',
      'launching your wallet',
    ],
    'gift_qr': [
      "here's the qr",
      'here is the qr',
      'showing you the qr',
      'showing the qr',
      'qr code for you',
      'scan this qr',
    ],
    'backup': [
      'backing up your journey',
      'saving your journey',
      'exporting your data',
      'here is your backup',
    ],
    'restore': [
      'restoring your journey',
      'importing your data',
      'welcome back',
    ],
  };

  const phrases = naturalPatterns[action];
  if (phrases) {
    for (const phrase of phrases) {
      if (lowerOutput.includes(phrase)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Extract breakthrough data from AI output BEFORE sanitization
 */
export function extractBreakthroughs(rawOutput: string): Array<{ domain: string; summary: string }> {
  const breakthroughs: Array<{ domain: string; summary: string }> = [];
  const regex = /\[BREAKTHROUGH:\s*(\w+)\s*\|\s*([^\]]+)\]/gi;

  let match;
  while ((match = regex.exec(rawOutput)) !== null) {
    const domain = match[1].toLowerCase();
    const summary = match[2].trim();

    const validDomains = ['identity', 'purpose', 'mindset', 'relationships', 'vision', 'action', 'legacy'];
    if (validDomains.includes(domain)) {
      breakthroughs.push({ domain, summary });
    }
  }

  return breakthroughs;
}

/**
 * Validate that a Bitcoin address looks legitimate
 * Basic format check - not cryptographic validation
 */
export function isValidBitcoinAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  // bc1q addresses (native segwit) are 42-62 chars, lowercase
  // bc1p addresses (taproot) are 62 chars, lowercase
  // Legacy addresses start with 1 or 3
  const patterns = [
    /^bc1q[a-z0-9]{38,58}$/,  // Native SegWit (P2WPKH)
    /^bc1p[a-z0-9]{58}$/,     // Taproot (P2TR)
    /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/, // Legacy (P2PKH/P2SH)
  ];

  return patterns.some(p => p.test(address));
}

/**
 * Validate input before processing
 * Returns error message if invalid, null if valid
 */
export function validateInput(input: string): string | null {
  if (!input || typeof input !== 'string') {
    return 'Invalid input';
  }

  const trimmed = input.trim();

  if (trimmed.length < INPUT_LIMITS.MIN_MESSAGE_LENGTH) {
    return 'Message too short';
  }

  if (trimmed.length > INPUT_LIMITS.MAX_MESSAGE_LENGTH) {
    return `Message too long (max ${INPUT_LIMITS.MAX_MESSAGE_LENGTH} characters)`;
  }

  return null;
}
