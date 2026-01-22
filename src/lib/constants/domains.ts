/**
 * Domain Constants - Single Source of Truth
 *
 * All domain name handling across the codebase should use these constants
 * to prevent casing inconsistencies between components.
 */

// Canonical domain names (PascalCase for display)
export const DOMAINS = [
  'Identity',
  'Purpose',
  'Mindset',
  'Relationships',
  'Vision',
  'Action',
  'Legacy',
] as const;

export type Domain = typeof DOMAINS[number];

// Lowercase version for storage keys
export const DOMAIN_KEYS = DOMAINS.map(d => d.toLowerCase()) as unknown as readonly Lowercase<Domain>[];

export type DomainKey = Lowercase<Domain>;

/**
 * Convert any casing to canonical PascalCase (for display/UI)
 */
export function toDisplayDomain(domain: string): Domain | null {
  const lower = domain.toLowerCase();
  const index = DOMAIN_KEYS.indexOf(lower as DomainKey);
  return index >= 0 ? DOMAINS[index] : null;
}

/**
 * Convert any casing to storage key (lowercase)
 */
export function toStorageKey(domain: string): DomainKey | null {
  const lower = domain.toLowerCase() as DomainKey;
  return DOMAIN_KEYS.includes(lower) ? lower : null;
}

/**
 * Validate domain name (accepts any casing)
 */
export function isValidDomain(domain: string): boolean {
  return DOMAIN_KEYS.includes(domain.toLowerCase() as DomainKey);
}
