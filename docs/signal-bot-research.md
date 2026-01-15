# Signal Bot Development Research Report

## Executive Summary

Unlike Telegram, **Signal does not provide an official Bot API**. This is an intentional design decision to maintain Signal's privacy-first principles. However, several unofficial tools and libraries enable programmatic interaction with Signal, though they come with significant limitations and considerations.

---

## Table of Contents

1. [Available Tools and Libraries](#available-tools-and-libraries)
2. [Registering a Signal Account for a Bot](#registering-a-signal-account-for-a-bot)
3. [Sending and Receiving Messages](#sending-and-receiving-messages)
4. [Audio File and Voice Message Support](#audio-file-and-voice-message-support)
5. [API Limitations](#api-limitations)
6. [Security Considerations](#security-considerations)
7. [Signal vs Telegram for Bots](#signal-vs-telegram-for-bots)
8. [Recommended Architecture](#recommended-architecture)
9. [Sources](#sources)

---

## Available Tools and Libraries

### 1. signal-cli (Recommended)

**The most mature and widely-used tool** for programmatic Signal access.

- **Repository**: [AsamK/signal-cli](https://github.com/AsamK/signal-cli)
- **Language**: Java (uses patched libsignal-service-java from Signal-Android)
- **Modes**: Command-line, Daemon (JSON-RPC), D-Bus interface
- **Requirements**: Java 21+, native libsignal-client library

**Key Features**:
- Register/verify accounts
- Send/receive messages
- Attachment support (including audio files)
- Group chat support
- Daemon mode for continuous operation

**Installation**:
```bash
# Download latest release from GitHub
# Requires Java 21+
signal-cli -u +1234567890 register
signal-cli -u +1234567890 verify 123456
```

### 2. signal-cli-rest-api

**Docker-based REST API wrapper** around signal-cli.

- **Repository**: [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api)
- **Interface**: RESTful HTTP API
- **Best for**: Web services, microservices architecture

**Installation**:
```bash
mkdir -p $HOME/.local/share/signal-api
docker run -d --name signal-api --restart=always -p 8080:8080 \
  -v $HOME/.local/share/signal-api:/home/.local/share/signal-cli \
  -e 'MODE=native' bbernhard/signal-cli-rest-api
```

**Execution Modes**:
| Mode | Speed | Memory | Description |
|------|-------|--------|-------------|
| normal | 1x | Normal | JVM started per request |
| native | ~2x | Normal | GraalVM native image |
| json-rpc | ~3x | Higher | Persistent JVM daemon |

### 3. signald

**Unix socket-based daemon** for Signal communication.

- **Repository**: [thefinn93/signald](https://github.com/thefinn93/signald)
- **Interface**: JSON over Unix socket
- **Best for**: Building custom Signal clients, bridges

**Key Differences from signal-cli**:
- Designed specifically as a daemon
- Unix socket communication (vs JSON-RPC/D-Bus)
- Compatible data format (can migrate from signal-cli)

### 4. Python Libraries

#### signalbot (Recommended for Python)
```bash
pip install signalbot
```
- Latest version: 0.21.0 (December 2025)
- Asyncio-based with consumer/producer pattern
- Requires signal-cli or signal-cli-rest-api backend

#### signal-bot-framework
```bash
pip install signal_bot_framework
```
- Python 3.11+ with asyncio
- Works with signal-cli daemon

### 5. Node.js Libraries

#### signal-bot (npm)
```bash
npm install signal-bot
```
- Linux only, Node.js 14+
- Requires signal-cli in daemon mode

#### signal-bot-node
- Node.js 18+
- Under heavy development
- Multi-account support

### 6. libsignal Bindings

**Official**: `@signalapp/libsignal-client` (npm) - For Windows, macOS, Linux

**Unofficial**:
- libsignal-node (npm) - 7 years old, not recommended
- libsignal-protocol-python - Academic use only, not for production

---

## Registering a Signal Account for a Bot

### Requirements

1. **Dedicated phone number** that can receive SMS or voice calls
2. **Captcha token** from Signal's verification system
3. **Stable server** to maintain the account

### Registration Process

#### Step 1: Obtain Captcha Token

1. Visit: https://signalcaptchas.org/registration/generate
2. Complete the captcha challenge
3. Right-click "Open Signal" link and copy the URL
4. Extract the token (format: `signalcaptcha://signal-recaptcha-v2...`)

#### Step 2: Register with signal-cli

```bash
# Register with captcha (using voice call for verification)
signal-cli -u +1234567890 register --voice --captcha "signalcaptcha://..."

# Verify with received code
signal-cli -u +1234567890 verify 123456
```

#### Step 3: Maintain Account Health

```bash
# CRITICAL: Regularly receive messages to prevent account flagging
signal-cli -u +1234567890 receive

# Or run in daemon mode for continuous operation
signal-cli -u +1234567890 daemon --json-rpc
```

### Phone Number Options

- **Google Voice**: Free option (voice.google.com)
- **Virtual numbers**: Services like sms-man.com
- **Dedicated SIM**: Most reliable for long-term use

### Important Notes

- **Rate limiting**: Too many registration attempts trigger 429 errors
- **Account inactivity**: Signal may delete inactive accounts
- **Captcha expiry**: Tokens expire quickly, use immediately

---

## Sending and Receiving Messages

### Using signal-cli (Command Line)

```bash
# Send text message
signal-cli -u +1234567890 send -m "Hello World" +0987654321

# Send to multiple recipients
signal-cli -u +1234567890 send -m "Hello" +111111111 +222222222

# Receive messages (outputs to stdout)
signal-cli -u +1234567890 receive
```

### Using signal-cli-rest-api

```bash
# Send message via REST API
curl -X POST -H "Content-Type: application/json" \
  -d '{"message": "Hello World", "number": "+1234567890", "recipients": ["+0987654321"]}' \
  'http://localhost:8080/v2/send'

# Receive messages
curl 'http://localhost:8080/v1/receive/+1234567890'
```

### Using Python (signalbot)

```python
from signalbot import SignalBot, Command

class PingCommand(Command):
    async def handle(self, message):
        await message.reply("pong")

bot = SignalBot({
    "signal_service": "localhost:8080",
    "phone_number": "+1234567890"
})
bot.register(PingCommand())
bot.start()
```

---

## Audio File and Voice Message Support

### Sending Audio Files

#### Using signal-cli (Direct)

```bash
# Send audio file as attachment
signal-cli -u +1234567890 send -m "" +0987654321 -a /path/to/audio.mp3

# Supported formats: mp3, wav, ogg, m4a, aac
```

#### Using signal-cli-rest-api

```bash
# Encode audio to base64
AUDIOFILE="$(base64 -w 0 voice_message.mp3)"

# Send via REST API
echo '{"message": "", "base64_attachments": ["'"$AUDIOFILE"'"], "number": "+1234567890", "recipients": ["+0987654321"]}' \
  | curl -X POST -H "Content-Type: application/json" -d @- 'http://localhost:8080/v2/send'
```

### Receiving Audio Files

When receiving messages with signal-cli:
- Attachments are downloaded to the config directory
- Path: `$HOME/.local/share/signal-cli/attachments/`
- Received message JSON includes attachment metadata

```bash
# Receive and process attachments
signal-cli -u +1234567890 receive --json
# Attachments saved to ~/.local/share/signal-cli/attachments/
```

### Voice Message Considerations

- Signal treats voice messages as audio attachments
- No special "voice message" flag in unofficial APIs
- Audio files sent will appear as attachments, not inline voice notes
- Recipient experience may differ from native voice messages

### Attachment Limits

- Maximum attachment size: **50 MB**
- Base64 encoding increases payload size by ~33%
- For large files, use filesystem volume mounting with Docker

---

## API Limitations

### No Official Bot API

Signal intentionally does not provide a bot API to:
- Maintain privacy-first principles
- Prevent automated spam/abuse
- Ensure end-to-end encryption integrity

### Technical Limitations

| Limitation | Description |
|------------|-------------|
| **Phone Number Required** | Must dedicate a phone number to the bot |
| **No Cloud Sync** | Messages are device-dependent |
| **In-Memory State** | Many libraries store keys in memory (lost on restart) |
| **Rate Limiting** | Aggressive rate limits on registration and messaging |
| **Account Inactivity** | Must regularly call `receive` or account may be flagged |
| **Group Limitations** | First message in group may be lost after restart |
| **Attachment Size** | 50 MB limit for attachments |
| **Text-Only Focus** | Most bot libraries only support text (attachments require custom handling) |
| **Protocol Changes** | Libraries may break when Signal updates their protocol |

### Operational Challenges

1. **Key Persistence**: Identity keys regenerate on restart without proper storage
2. **Group State**: Group membership must be maintained in persistent storage
3. **Message Delivery**: No delivery receipts in some implementations
4. **Multi-Device**: Linking to multiple devices not fully supported

---

## Security Considerations

### Official Signal Position

- Signal does not have official bots or customer service bots
- Signal will never contact users in-app
- Terms of Service do not explicitly prohibit unofficial clients

### Development Security

1. **Key Storage**: Store encryption keys securely (not in memory only)
2. **Credential Rotation**: Implement key rotation policies
3. **Consent**: Require explicit consent before adding users to groups
4. **Data Minimization**: Avoid storing message content unless essential
5. **Privacy Policy**: Publish clear privacy policy and developer contact

### Risks

| Risk | Mitigation |
|------|------------|
| Account ban | Follow rate limits, avoid spam-like behavior |
| Data exposure | Encrypt stored messages, use secure infrastructure |
| Protocol changes | Monitor signal-cli updates, test frequently |
| Key compromise | Implement proper secret management |

### End-to-End Encryption

- All messages remain E2E encrypted
- Bot sees decrypted content (has keys)
- Users may not realize they're talking to a bot
- Be transparent about bot nature in conversations

---

## Signal vs Telegram for Bots

### Comparison Table

| Feature | Signal | Telegram |
|---------|--------|----------|
| **Official Bot API** | No | Yes (comprehensive) |
| **Documentation** | Community-maintained | Official, extensive |
| **Ease of Setup** | Complex | Simple (5 minutes) |
| **Phone Number Required** | Yes (dedicated) | No (uses bot tokens) |
| **End-to-End Encryption** | Always (by default) | Only in "Secret Chats" |
| **Open Source** | Yes (full stack) | Client only |
| **Group Size** | ~1000 members | 200,000 members |
| **Channels** | No | Yes |
| **Inline Bots** | No | Yes |
| **Webhooks** | No (polling only) | Yes |
| **Attachment Handling** | Basic | Rich |
| **User Base** | Smaller, privacy-focused | Larger, general purpose |
| **Rate Limits** | Strict | More lenient |
| **Account Bans** | Possible | Rare for bots |

### Telegram Bot Advantages

1. **Official API**: Well-documented, stable, supported
2. **No phone number needed**: Bot tokens are free and unlimited
3. **Rich features**: Inline keyboards, payments, games, stickers
4. **Webhooks**: Real-time message delivery without polling
5. **Large groups/channels**: Broadcast to 200,000+ users
6. **Easy development**: Libraries for every language

### Signal Bot Advantages

1. **True privacy**: E2E encryption by default
2. **Open source**: Full transparency
3. **No metadata collection**: Minimal server-side data
4. **Security-focused users**: Privacy-conscious audience
5. **No tracking**: No advertising ID or analytics

### When to Choose Signal

- Privacy is a core requirement
- Users specifically request Signal
- Sensitive data transmission
- Compliance requirements for encrypted messaging
- Small-scale, personal use

### When to Choose Telegram

- Need rich bot features
- Large audience reach
- Quick development cycle
- Customer support bots
- Community management
- Public channels/broadcasts

---

## Recommended Architecture

### For Production Signal Bots

```
+-------------------+     +----------------------+     +------------------+
|   Your Bot App    | --> | signal-cli-rest-api  | --> | Signal Servers   |
|   (Node.js/Python)|     | (Docker Container)   |     |                  |
+-------------------+     +----------------------+     +------------------+
         |                          |
         v                          v
+-------------------+     +----------------------+
|   Database        |     | Persistent Volume    |
| (Message Queue,   |     | (Keys, Attachments)  |
|  User State)      |     |                      |
+-------------------+     +----------------------+
```

### Docker Compose Example

```yaml
version: '3'
services:
  signal-api:
    image: bbernhard/signal-cli-rest-api
    environment:
      - MODE=json-rpc
    ports:
      - "8080:8080"
    volumes:
      - signal-data:/home/.local/share/signal-cli
    restart: unless-stopped

  bot:
    build: ./bot
    depends_on:
      - signal-api
    environment:
      - SIGNAL_SERVICE=signal-api:8080
      - PHONE_NUMBER=+1234567890
    volumes:
      - ./attachments:/app/attachments

volumes:
  signal-data:
```

### Key Recommendations

1. **Use json-rpc mode** for best performance
2. **Persist signal-cli data volume** to avoid re-registration
3. **Implement message queue** for reliable processing
4. **Monitor account health** with regular receives
5. **Handle attachments** via shared volume, not base64 for large files
6. **Log but don't store** message content unless required

---

## Sources

### Official Resources
- [Signal Terms of Service](https://signal.org/legal/)
- [Signal Registration Troubleshooting](https://support.signal.org/hc/en-us/articles/360007318751-Registration-troubleshooting)
- [Signal View and Save Media](https://support.signal.org/hc/en-us/articles/360007317471-View-and-save-media-or-files)

### Core Tools
- [AsamK/signal-cli](https://github.com/AsamK/signal-cli) - Command-line Signal interface
- [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) - Dockerized REST API
- [thefinn93/signald](https://github.com/thefinn93/signald) - Signal daemon
- [signalapp/libsignal](https://github.com/signalapp/libsignal) - Official Signal protocol library

### Python Libraries
- [signalbot on PyPI](https://pypi.org/project/signalbot/) - Python bot framework
- [Signal-Bot Documentation](https://signal-bot.readthedocs.io/) - Python framework docs

### Node.js Libraries
- [signal-bot on npm](https://www.npmjs.com/package/signal-bot) - Node.js library
- [TapuCosmo/signal-bot](https://github.com/TapuCosmo/signal-bot) - Node.js Signal bot library

### Tutorials and Guides
- [signal-cli Registration with Captcha](https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha)
- [signald Captcha Documentation](https://signald.org/articles/captcha/)
- [signal-cli-rest-api Examples](https://github.com/bbernhard/signal-cli-rest-api/blob/master/doc/EXAMPLES.md)
- [Fabio Barbero - How to make a Signal bot in Python](https://fabiobarbero.eu/posts/signalbot/)
- [Signal API on Tailnet with Docker Compose](https://parkerhiggins.net/2025/04/signal-messenger-api-tailnet-docker-compose/)

### Comparison Articles
- [Telegram vs Signal Comparison (Mighty Networks)](https://www.mightynetworks.com/resources/telegram-vs-signal)
- [Signal vs Telegram (Slant)](https://www.slant.co/versus/1989/4568/~signal_vs_telegram)
- [Signal vs Telegram 2025 Comparison](https://nicegram.app/blog/telegram-vs-signal-what-to-choose)

---

## Conclusion

Building a Signal bot is possible but significantly more complex than Telegram:

**Feasibility**: YES, with caveats
- Use `signal-cli-rest-api` for the most stable experience
- Plan for phone number acquisition and verification
- Implement proper key/state persistence
- Monitor for protocol changes

**Audio Support**: YES
- Send audio as attachments via base64 encoding
- Receive audio via attachment download
- Voice message appearance may differ from native

**Recommendation**:
For most bot use cases, **Telegram is the better choice** due to its official API, documentation, and features. Choose Signal only when privacy is the primary requirement and users specifically need Signal integration.

---

*Report generated: January 2026*
*Based on research of signal-cli v0.13.x and signal-cli-rest-api*
