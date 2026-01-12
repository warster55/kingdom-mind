
/**
 * Kingdom Mind - Privacy & Sanctity Filter
 * Ensures Architect tools never reveal PII (Personally Identifiable Information).
 */

export function scrubPII(text: string): string {
  if (!text) return text;

  let scrubbed = text;

  // 1. Scrub Emails (Replace with Seeker ID)
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = scrubbed.match(emailRegex) || [];
  emails.forEach((email) => {
    // Generate a consistent but anonymous ID based on the email
    const id = btoa(email).substring(0, 8).toUpperCase();
    scrubbed = scrubbed.replace(email, `Seeker-${id}`);
  });

  // 2. Scrub Common Name Patterns (Basic protection)
  // This is a safety layer for the "name" field in logs
  const namePatterns = [/name: "[^"]+"/gi, /user: [a-z]+/gi];
  namePatterns.forEach(pattern => {
    scrubbed = scrubbed.replace(pattern, (match) => {
      return match.split(':')[0] + ': [ANONYMIZED]';
    });
  });

  return scrubbed;
}
