# AI Mentoring Chat System

## Overview

The AI Mentoring Chat System is the core feature of Kingdom Mind, providing users with a compassionate, Scripture-grounded AI mentor powered by Claude Sonnet 4. The system replicates the CLI mentoring experience in a modern web UI.

## Architecture

### Core Components

#### 1. AI System (`/lib/ai/`)

**system-prompts.ts**
- Generates dynamic system prompts for Claude based on user context
- Implements the 5 E's methodology (Excavate, Examine, Encounter, Embrace, Embody)
- Provides instructions for formatting responses with multiple choice options and document actions

**context-builder.ts**
- Fetches user journey data, active beliefs, recent insights
- Builds comprehensive context about the user for personalized conversations
- Includes reference data (cognitive distortions, maladaptive schemas)

**response-parser.ts**
- Parses AI responses to extract structured data
- Identifies multiple choice options in `mindset-choices` code blocks
- Detects document creation requests in `mindset-action` blocks
- Extracts Scripture references and psychological tool mentions
- Identifies insights from conversation for automatic saving

#### 2. API Routes (`/app/api/mentoring/`)

**sessions/route.ts**
- `GET` - List all sessions for user (filterable by status)
- `POST` - Create new mentoring session

**sessions/[id]/route.ts**
- `GET` - Get session with full message history
- `PUT` - Update session (end session, add summary)
- `DELETE` - Delete session

**chat/route.ts** (MOST IMPORTANT)
- `POST` - Send message and receive AI response
- Builds context from user journey and conversation history
- Calls Claude Sonnet 4 via Anthropic SDK
- Parses response and saves structured data
- Handles document creation (belief examinations, thought logs)
- Automatically extracts and saves insights

#### 3. UI Components (`/components/chat/`)

**ChatContainer.tsx**
- Scrollable container for messages
- Auto-scroll to bottom on new messages
- Loading states

**ChatMessage.tsx**
- Renders user or assistant messages
- Markdown support with custom styling
- Highlights Scripture references
- Shows referenced scriptures as tags

**MultipleChoiceSelector.tsx**
- Displays choice options as cards
- Supports custom text input ("Other" option)
- Visual selection feedback
- Disabled state after selection

**ChatInput.tsx**
- Text input with auto-resize
- Send button
- Enter to send, Shift+Enter for new line
- Disabled during AI response

**TypingIndicator.tsx**
- Animated dots showing AI is processing

**SessionHeader.tsx**
- Session number, topic, domain
- End session button

#### 4. Pages (`/app/(auth)/mentoring/`)

**page.tsx** - Main mentoring hub
- List active sessions (continue where left off)
- Create new session with topic and domain selection
- View recent completed sessions
- Link to full history

**[sessionId]/page.tsx** - Chat interface
- Full conversation view
- Real-time message sending
- Multiple choice selection
- Custom text responses
- End session functionality

**history/page.tsx** - Session history
- List all completed sessions
- Show summaries and key insights
- Read-only session review

## The 5 E's Process

The AI mentor guides users through a structured transformation process:

1. **EXCAVATE** - Unearth the origins of beliefs
   - Family, church, cultural influences
   - Formative experiences

2. **EXAMINE** - Analyze beliefs critically
   - Evidence for/against
   - Cognitive distortions
   - Harm caused

3. **ENCOUNTER** - Meet God's truth in Scripture
   - Relevant biblical passages
   - Core lies vs. core truths

4. **EMBRACE** - Accept and internalize truth
   - Process fears
   - Craft new belief statements

5. **EMBODY** - Live out the new belief
   - Action steps
   - Accountability
   - Practice

## Response Formats

### Multiple Choice Options

The AI can offer structured choices using this format:

```
\`\`\`mindset-choices
[
  {
    "id": "a",
    "label": "Yes, let's explore this further",
    "value": "explore_further",
    "description": "Deep dive into this belief"
  },
  {
    "id": "b",
    "label": "I need time to think",
    "value": "pause_reflect"
  }
]
\`\`\`
```

The UI automatically renders these as clickable cards with an "Other" option for custom text.

### Document Creation

When the conversation warrants deeper work, the AI can suggest creating documents:

```
\`\`\`mindset-action
{
  "action": "create_belief_examination",
  "title": "I'm not worthy of love",
  "beliefStatement": "I am fundamentally unlovable",
  "domainId": 1
}
\`\`\`
```

Supported actions:
- `create_belief_examination` - Creates a new 5 E's document
- `create_thought_log` - Creates a CBT thought log

### Scripture References

Scripture formatted as `**John 3:16**` is automatically:
- Highlighted in purple
- Added to `referencedScriptures` array
- Displayed as tags below message

## Database Schema

### mentoringSessions
- User's mentoring sessions
- Fields: sessionNumber, topic, domainId, status, summary, keyInsights, actionItems
- Status: 'active' or 'completed'

### chatMessages
- Individual messages in conversations
- Fields: role, content, multipleChoiceOptions, selectedOption, referencedScriptures
- Links to createdDocumentId if document was created

### insightsDiscovered
- Automatically extracted insights
- Linked to sessions and domains
- Can be promoted to key insights

## Environment Variables

```bash
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://...
```

## Usage Flow

1. User visits `/mentoring`
2. Creates new session or resumes active session
3. Chat interface loads at `/mentoring/[sessionId]`
4. AI sends initial greeting
5. Conversation flows with text or multiple choice responses
6. AI may suggest document creation
7. Insights automatically extracted and saved
8. User ends session when ready
9. Session marked complete and visible in history

## Key Features

- **Context-Aware**: AI knows user's journey, active beliefs, recent insights
- **Structured Choices**: Multiple choice options guide conversation flow
- **Document Creation**: Seamlessly create belief examinations and thought logs
- **Scripture Integration**: Biblical grounding with highlighted references
- **Insight Extraction**: Automatic identification and saving of breakthroughs
- **Psychological Tools**: References CBT concepts, schemas, attachments
- **Responsive Design**: Works on desktop and mobile
- **Real-Time Updates**: Messages appear instantly with smooth animations

## Future Enhancements

- [ ] Streaming responses for better UX
- [ ] Voice input/output
- [ ] Session summaries with AI-generated takeaways
- [ ] Export session transcripts
- [ ] Share insights with others
- [ ] Group mentoring sessions
- [ ] Integration with daily reflections
- [ ] Proactive check-ins based on user patterns

## Testing

To test the mentoring system:

1. Create a new session from `/mentoring`
2. Try various conversation paths
3. Test multiple choice selection
4. Test custom text responses
5. Verify Scripture references are highlighted
6. Check that insights are saved
7. End session and verify it appears in history

## Troubleshooting

**AI not responding:**
- Check ANTHROPIC_API_KEY is set
- Check API rate limits
- Check network connectivity

**Messages not saving:**
- Verify database connection
- Check session exists and is active
- Check user permissions

**Multiple choice not working:**
- Verify AI is using correct format
- Check parser is extracting options
- Verify UI is rendering options

**Context too large:**
- Reduce number of recent insights
- Limit belief examinations included
- Use selective context based on message count
