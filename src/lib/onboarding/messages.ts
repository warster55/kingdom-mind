/**
 * Scripted onboarding messages from the Mentor
 * These are consistent for all users - not AI generated
 */

export interface OnboardingMessage {
  id: string;
  content: string;
  delay?: number; // ms to wait before showing this message
}

export interface OnboardingChoice {
  id: string;
  label: string;
  action: 'create_account' | 'guest_mode' | 'generate_usernames' | 'confirm_username' | 'next_step';
}

export interface OnboardingStep {
  id: string;
  messages: OnboardingMessage[];
  choices?: OnboardingChoice[];
  requiresAction?: 'show_usernames' | 'show_qr' | 'show_seed_phrase' | 'show_pin_setup';
}

/**
 * The complete onboarding flow
 */
export const onboardingFlow: OnboardingStep[] = [
  // Step 1: Welcome
  {
    id: 'welcome',
    messages: [
      {
        id: 'welcome-1',
        content: "Welcome, traveler. I'm glad you found your way here.",
        delay: 0,
      },
      {
        id: 'welcome-2',
        content: "This is Kingdom Mind — a quiet space for reflection, growth, and discovering who you're meant to become.",
        delay: 1500,
      },
      {
        id: 'welcome-3',
        content: "Everything here is free. No ads, no data harvesting, no strings attached. Just you and me, walking together. Would you like to create your sanctuary and begin your journey, or would you prefer to explore first?",
        delay: 1500,
      },
    ],
    choices: [
      { id: 'create', label: "I'd like to create an account", action: 'create_account' },
      { id: 'explore', label: "Let me explore first", action: 'guest_mode' },
    ],
  },

  // Step 2a: Guest mode intro
  {
    id: 'guest_intro',
    messages: [
      {
        id: 'guest-1',
        content: "Of course. Take your time — there's no rush here.",
        delay: 0,
      },
      {
        id: 'guest-2',
        content: "Just know that without an account, our conversation won't be saved when you leave. But that's okay. Sometimes the journey matters more than the record.",
        delay: 1500,
      },
      {
        id: 'guest-3',
        content: "Whenever you're ready to make this space your own, just let me know. Now — what's on your heart today?",
        delay: 1500,
      },
    ],
  },

  // Step 2b: Account creation - username
  {
    id: 'account_username',
    messages: [
      {
        id: 'username-1',
        content: "Wonderful. Let's create your sanctuary.",
        delay: 0,
      },
      {
        id: 'username-2',
        content: "For your privacy, we use randomly generated usernames — no email, no personal information. Just a name that belongs to you alone.",
        delay: 1500,
      },
      {
        id: 'username-3',
        content: "Here are three to choose from. Pick one that speaks to you, or I can generate more.",
        delay: 1500,
      },
    ],
    requiresAction: 'show_usernames',
  },

  // Step 3: TOTP setup
  {
    id: 'account_totp',
    messages: [
      {
        id: 'totp-1',
        content: "Beautiful choice. Now let's secure your sanctuary.",
        delay: 0,
      },
      {
        id: 'totp-2',
        content: "Scan this code with an authenticator app like Google Authenticator or Authy. This will be how you sign in — no passwords to remember or forget.",
        delay: 1500,
      },
    ],
    requiresAction: 'show_qr',
  },

  // Step 4: Seed phrase
  {
    id: 'account_seed',
    messages: [
      {
        id: 'seed-1',
        content: "Almost there. This next part is important.",
        delay: 0,
      },
      {
        id: 'seed-2',
        content: "These 24 words are your recovery key. If you ever lose access to your authenticator, these words are the only way back in.",
        delay: 1500,
      },
      {
        id: 'seed-3',
        content: "Write them down. Keep them somewhere safe. I won't be able to show them to you again.",
        delay: 1500,
      },
    ],
    requiresAction: 'show_seed_phrase',
  },

  // Step 5: Quick unlock setup
  {
    id: 'account_unlock',
    messages: [
      {
        id: 'unlock-1',
        content: "One last thing — let's make it easy to return.",
        delay: 0,
      },
      {
        id: 'unlock-2',
        content: "Would you like to use your fingerprint or face to quickly unlock, or would you prefer a PIN?",
        delay: 1500,
      },
    ],
    requiresAction: 'show_pin_setup',
  },

  // Step 6: Complete
  {
    id: 'complete',
    messages: [
      {
        id: 'complete-1',
        content: "Your sanctuary is ready.",
        delay: 0,
      },
      {
        id: 'complete-2',
        content: "This is a space for you to grow — in identity, purpose, mindset, relationships, vision, action, and legacy. Seven domains of a life well-lived.",
        delay: 1500,
      },
      {
        id: 'complete-3',
        content: "I'm here whenever you need me. Now — what's on your heart today?",
        delay: 1500,
      },
    ],
  },
];

/**
 * Gentle nudge messages for guest users
 * Shown after X messages, woven naturally into conversation
 */
export const guestNudgeMessages = [
  "I'm enjoying our conversation. Just a gentle reminder — without an account, our talk won't be saved when you leave. Whenever you're ready to continue this journey with me, just say the word.",
  "We've covered some meaningful ground together. If you'd like to keep a record of your reflections, creating an account takes just a moment. No pressure — I'll be here either way.",
  "Your thoughts today have been valuable. It would be a shame to lose them. Want to create an account so we can continue building on this foundation?",
];

/**
 * Get a random nudge message
 */
export function getRandomNudge(): string {
  const index = Math.floor(Math.random() * guestNudgeMessages.length);
  return guestNudgeMessages[index];
}
