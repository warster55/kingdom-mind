# Project Plan: Kingdom Mind - The Conversational OS

## 1. Core Vision

This project reframes Kingdom Mind from a traditional web application into an **AI-First, "Zero-UI" experience**. The entire user journey—from the initial landing, through login, onboarding, mentoring, and even system management—will occur within a single, persistent conversational canvas.

The application becomes a living dialogue, a "Digital Sanctuary" where the interface fades away, leaving only the user and their mentor.

---

## 2. Architectural Principles

We are building an application where the AI is the central processor, not just a feature.

-   **AI as the Brain:** The Large Language Model (LLM) will orchestrate the application's logic. Based on the user's state (guest, new, returning) and their input, the AI will decide which flow to initiate (login, onboarding, mentoring) and which tools to use.
-   **UI as the Mouth & Ears:** The React frontend is a "dumb terminal." Its sole purpose is to render the conversation bubbles provided by the AI and capture user input (text and slash commands).
-   **API as the Hands:** Our backend is a collection of secure, single-purpose "tools" that the AI can call. We avoid complex logic in the API, instead creating simple functions like `getUserStatus`, `saveOnboardingResponse`, or `createCheckoutSession`.
-   **System Prompt as Source Code:** The application's behavior and user flows are defined in the system prompt given to the AI. Modifying the app's logic becomes as simple as updating these natural language instructions.

---

## 3. Implementation Phases

This project will be built in clear, sequential phases.

### ✅ Phase 1: Guest Experience & Conversational Login 
*Status: Complete*

-   [x] **Create `WelcomePage.tsx`:** A structured, welcoming landing page for unauthenticated users, featuring a verse of the day and project overview.
-   [x] **Implement Conditional Root Page:** The main `app/page.tsx` now acts as a state router, showing `WelcomePage` to guests and switching to the chat experience on demand.
-   [x] **Create `RootChat.tsx`:** A component that manages the application's primary state (Guest vs. Authenticated).
-   [x] **Implement Chat-Based Login:** The `RootChat` component initiates a conversational login flow (email with magic link) when a guest chooses to begin.
-   [x] **Fix Scrolling & Layout:** The main layout is now a fixed `h-screen` container with an internal scrollable chat area, ensuring the input bar is always at the bottom and content does not overlap the header.
-   [x] **Implement Slash Commands:** The UI is now "button-free." All actions are initiated via a `/` command in the chat input.

### ✅ Phase 2: Onboarding Through Conversation
*Status: Complete*

-   [x] **Create `OnboardingChat.tsx`:** Build a dedicated chat component to manage the flow of onboarding questions.
-   [x] **Create Onboarding API Endpoints:** Implement `app/api/onboarding/save-step/route.ts` and `.../complete/route.ts` to securely save user responses to the database.
-   [x] **Update `RootChat.tsx` State Machine:** Add logic to detect new users and render the `OnboardingChat` component, transitioning to `ReflectChat` upon completion.
-   [x] **Integrate `hasCompletedOnboarding` into Auth Flow:** Modified the NextAuth session callback to include the onboarding status, enabling the state machine.

### ✅ Phase 3: The AI-Powered Dashboard & Status
*Status: Complete*

-   [x] **Create `getUserStatus` API Tool:** Implement `app/api/journey/status/route.ts` to provide the AI with the user's current progress and domain focus.
-   [x] **Integrate Tool into AI:** Defined `getUserStatus` in `mentor-tools.ts` and updated the main chat API route to handle the tool call by fetching from the new endpoint.
-   [x] **Enhance System Prompt:** Instructed the AI on how to use the `getUserStatus` tool to generate a dynamic, personalized "dashboard" message upon login or after a `/clear` command.
-   [x] **Implement `/status` Command:** Wired the `/status` command to trigger the "dashboard" generation flow.

### ✅ Phase 4: Payments & Subscription Management via Chat
*Status: Complete*

-   [x] **Create Secure Payment API Tools:** Implemented a mock `app/api/billing/create-checkout/route.ts` endpoint to serve as the AI's payment tool.
-   [x] **Integrate Tool into AI:** Defined `createCheckoutSession` in `mentor-tools.ts` and updated the main chat API route to handle the tool call.
-   [x] **Update System Prompt for Billing:** Added instructions for the AI on how to handle billing-related queries and when to use the payment tools.
-   [x] **Design "Payment Widget":** While a full widget component isn't needed with this architecture, the AI is instructed to present the secure checkout URL clearly to the user.