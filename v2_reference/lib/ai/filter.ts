/**
 * THE CENSOR (Output Filter)
 * Scans AI responses for system leaks or broken tags.
 */

const FORBIDDEN_PATTERNS = [
  /{{.+}}/, // Any template tag
  /\[RESONANCE:/i, // Visible tags
  /System Prompt/i,
  /One Stone Rule/i,
  /Kingdom Mind Protocol/i,
  /Sacred Pillars/i,
  /JSONB/i
];

export function sanitizeResponse(text: string): string {
  if (!text) return text;

  // 1. Scan for leaks
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(text)) {
      console.warn(`[Censor] Blocked response leakage: ${pattern}`);
      return "I felt a disturbance in the connection. Let us refocus on the truth of Jesus. What is on your heart?";
    }
  }

  // 2. Formatting cleanup (Double-check)
  // Ensure no bolding remains if the AI slipped up
  return text.replace(/\*\*/g, '').trim();
}
