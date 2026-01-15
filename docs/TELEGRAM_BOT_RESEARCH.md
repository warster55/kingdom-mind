# Telegram Bot Technical Research Report

## Table of Contents
1. [Creating a Telegram Bot](#1-creating-a-telegram-bot)
2. [Bot Capabilities and Limitations](#2-bot-capabilities-and-limitations)
3. [Sending and Receiving Text Messages](#3-sending-and-receiving-text-messages)
4. [Voice Message Handling](#4-voice-message-handling)
5. [Speech-to-Text (STT) Integration](#5-speech-to-text-stt-integration)
6. [Text-to-Speech (TTS) Integration](#6-text-to-speech-tts-integration)
7. [Rate Limits and Restrictions](#7-rate-limits-and-restrictions)
8. [Library Comparison](#8-library-comparison)
9. [Implementation Architecture](#9-implementation-architecture)
10. [Code Examples](#10-code-examples)

---

## 1. Creating a Telegram Bot

### Using BotFather

BotFather is Telegram's official bot for creating and managing bots.

**Step-by-Step Process:**

1. **Open BotFather**: Search for `@BotFather` in Telegram and start a conversation
2. **Create New Bot**: Send the `/newbot` command
3. **Choose Display Name**: Enter a human-readable name for your bot
4. **Choose Username**: Enter a unique username (must end with `bot` or `_bot`)
5. **Receive Token**: BotFather provides an API token in the format: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`

**Important Security Notes:**
- Store the token securely (treat it like a password)
- Never commit tokens to version control
- Use `/revoke` command if token is compromised
- Each token grants full control over the bot

**Additional BotFather Commands:**
- `/setname` - Change display name
- `/setdescription` - Set bot description
- `/setuserpic` - Set bot avatar
- `/setcommands` - Define command menu
- `/revoke` - Generate new token

---

## 2. Bot Capabilities and Limitations

### What Bots CAN Do

| Capability | Details |
|------------|---------|
| Send/receive text messages | Full support with formatting (HTML, Markdown) |
| Send/receive media | Photos, videos, audio, voice, documents |
| Inline keyboards | Interactive buttons within messages |
| Reply keyboards | Custom keyboard layouts |
| Commands | Process `/command` messages |
| Group participation | Join groups, channels, supergroups |
| Webhook/polling | Two methods for receiving updates |
| File handling | Download up to 20MB, upload up to 50MB |

### What Bots CANNOT Do

| Limitation | Details |
|------------|---------|
| See other bots' messages | Prevents automated loops |
| Initiate conversations | Users must start first (except via deep links) |
| Access message history | Only see new messages after being added |
| Make phone calls | Voice calls not supported |
| Access user phone numbers | Unless explicitly shared |

### Privacy Mode (Groups)

When privacy mode is enabled (default), bots in groups only receive:
- Commands explicitly directed at them (`/command@botname`)
- Replies to the bot's messages
- Service messages (member joined/left, etc.)
- Messages in channels where they're admin

---

## 3. Sending and Receiving Text Messages

### Receiving Messages

Messages come via `Update` objects containing:
- `message.text` - The text content
- `message.chat.id` - Target chat identifier
- `message.from` - Sender information
- `message.message_id` - Unique message identifier

### Sending Messages

**API Method: `sendMessage`**

```
POST https://api.telegram.org/bot<token>/sendMessage
```

**Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `chat_id` | Yes | Target chat ID or @username |
| `text` | Yes | Message text (1-4096 characters) |
| `parse_mode` | No | `HTML`, `Markdown`, or `MarkdownV2` |
| `disable_notification` | No | Send silently |
| `reply_to_message_id` | No | Reply to specific message |
| `reply_markup` | No | Inline/reply keyboard |

### Message Formatting

**HTML Example:**
```html
<b>bold</b>, <i>italic</i>, <code>monospace</code>
<a href="https://example.com">link</a>
```

**MarkdownV2 Example:**
```
*bold*, _italic_, `monospace`
[link](https://example.com)
```

---

## 4. Voice Message Handling

### Voice Message Format Requirements

For Telegram to display audio as a **playable voice message** (with waveform visualization):

| Format | Codec | Support Level |
|--------|-------|---------------|
| `.ogg` | OPUS | **Primary** (recommended) |
| `.mp3` | MP3 | Supported |
| `.m4a` | AAC | Supported |

**Important:** Other formats will be sent as regular audio files or documents without the voice message UI.

### Receiving Voice Messages

Voice messages arrive as `Voice` objects:

```json
{
  "voice": {
    "file_id": "AwACAgIAAxkBA...",
    "file_unique_id": "AgADAgAT...",
    "duration": 5,
    "mime_type": "audio/ogg",
    "file_size": 23456
  }
}
```

**Download Process:**
1. Use `getFile` with `file_id` to get `file_path`
2. Download from: `https://api.telegram.org/file/bot<token>/<file_path>`

### Sending Voice Messages

**API Method: `sendVoice`**

```
POST https://api.telegram.org/bot<token>/sendVoice
```

**Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `chat_id` | Yes | Target chat ID |
| `voice` | Yes | Audio file (OGG/OPUS, MP3, or M4A) |
| `caption` | No | Caption (0-1024 characters) |
| `duration` | No | Duration in seconds |
| `disable_notification` | No | Send silently |

**Three Ways to Send Files:**

1. **file_id** (reuse): Pass existing file_id - no size limits
2. **HTTP URL**: Telegram downloads - max 20MB
3. **Multipart upload**: Direct upload - max 50MB

### Audio Conversion with FFmpeg

**Converting to OGG/OPUS (Required for Voice Messages):**

```bash
ffmpeg -i input.mp3 -c:a libopus output.ogg
```

**Full Command with Options:**
```bash
ffmpeg -i input.wav -vn -c:a libopus -b:a 64k output.ogg
```

**Node.js with fluent-ffmpeg:**

```javascript
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

ffmpeg.setFfmpegPath(ffmpegPath);

ffmpeg()
  .input('input.wav')
  .inputFormat('wav')
  .outputOptions('-c:a libopus')
  .output('output.ogg')
  .on('end', () => console.log('Conversion complete'))
  .on('error', (err) => console.error('Error:', err))
  .run();
```

### Sending Audio vs Voice

| Method | Use Case | Player Display |
|--------|----------|----------------|
| `sendVoice` | Voice notes, recordings | Waveform, inline player |
| `sendAudio` | Music, podcasts | Music player with metadata |

---

## 5. Speech-to-Text (STT) Integration

### OpenAI Whisper API

**Endpoint:** `POST https://api.openai.com/v1/audio/transcriptions`

**Supported Formats:** mp3, mp4, mpeg, mpga, m4a, wav, webm

**Max File Size:** 25 MB

**Implementation Flow:**

```
User Voice Message
      |
      v
Download from Telegram (OGG/OPUS)
      |
      v
Convert to MP3/WAV (if needed)
      |
      v
Send to Whisper API
      |
      v
Receive Transcription Text
```

**Node.js Example:**

```javascript
const OpenAI = require('openai');
const fs = require('fs');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function transcribeAudio(filePath) {
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: 'whisper-1',
    language: 'en' // optional
  });
  return transcription.text;
}
```

### Alternative STT Options

| Service | Pros | Cons |
|---------|------|------|
| OpenAI Whisper | High accuracy, multilingual | Paid API |
| Google Speech-to-Text | Real-time, streaming | Paid API |
| Azure Speech Services | Enterprise features | Complex setup |
| Local Whisper | Free, private | Requires GPU/CPU power |

---

## 6. Text-to-Speech (TTS) Integration

### OpenAI TTS API

**Endpoint:** `POST https://api.openai.com/v1/audio/speech`

**Models:**
- `tts-1` - Optimized for low latency
- `tts-1-hd` - Higher quality audio

**Voices:** alloy, ash, ballad, coral, echo, fable, nova, onyx, sage, shimmer

**Output Formats:** mp3, opus, aac, flac, wav, pcm

**Implementation Flow:**

```
AI Response Text
      |
      v
OpenAI TTS API
      |
      v
Receive Audio (MP3/OPUS)
      |
      v
Convert to OGG/OPUS (if needed)
      |
      v
Send via sendVoice to Telegram
```

**Node.js Example:**

```javascript
const OpenAI = require('openai');
const fs = require('fs');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function textToSpeech(text, outputPath) {
  const response = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'nova',
    input: text,
    response_format: 'opus' // Native Telegram format
  });

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
  return outputPath;
}
```

### Alternative TTS Options

| Service | Quality | Cost | Notes |
|---------|---------|------|-------|
| OpenAI TTS | Excellent | ~$0.015/1K chars | Multiple voices |
| ElevenLabs | Premium | Higher | Voice cloning |
| Azure TTS | Good | Moderate | Many languages |
| Google TTS | Good | Moderate | SSML support |
| Piper (local) | Good | Free | Offline capable |

---

## 7. Rate Limits and Restrictions

### Message Rate Limits

| Context | Limit | Notes |
|---------|-------|-------|
| Single chat | 1 message/second | Short bursts allowed |
| Group chat | 20 messages/minute | Per group |
| Bulk broadcast | ~30 messages/second | Across all chats |
| Paid broadcast | 1000 messages/second | 0.1 Stars per message |

### File Size Limits

| Operation | Standard API | Local Bot API |
|-----------|--------------|---------------|
| Download | 20 MB | 2 GB |
| Upload | 50 MB | 2 GB |
| Voice message | 50 MB | 2 GB |
| Audio file | 50 MB | 2 GB |

### Upload Method Limits

| Method | Photo Limit | Other Files |
|--------|-------------|-------------|
| file_id reuse | Unlimited | Unlimited |
| HTTP URL | 5 MB | 20 MB |
| Multipart upload | 10 MB | 50 MB |

### Handling Rate Limit Errors (429)

```javascript
async function sendWithRetry(bot, chatId, message, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await bot.sendMessage(chatId, message);
    } catch (error) {
      if (error.response?.statusCode === 429) {
        const retryAfter = error.response.body.parameters?.retry_after || 1;
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      } else {
        throw error;
      }
    }
  }
}
```

---

## 8. Library Comparison

### Node.js Libraries

| Library | Stars | Style | Webhooks | Polling | TypeScript |
|---------|-------|-------|----------|---------|------------|
| `node-telegram-bot-api` | 8k+ | Callback | Yes | Yes | Types available |
| `telegraf` | 7k+ | Middleware | Yes | Yes | Native |
| `grammY` | 2k+ | Middleware | Yes | Yes | Native |

### Python Libraries

| Library | Stars | Style | Async | Notes |
|---------|-------|-------|-------|-------|
| `python-telegram-bot` | 25k+ | OOP | Yes | Most popular |
| `aiogram` | 5k+ | Async | Yes | Modern async |
| `pyTelegramBotAPI` | 8k+ | Decorator | Yes | Simple |

### Recommended for Voice Bot

**Node.js:** `telegraf` or `grammY`
- Modern middleware architecture
- Excellent TypeScript support
- Built-in file handling
- Active development

**Python:** `python-telegram-bot` or `aiogram`
- Mature ecosystem
- Good async support
- Extensive documentation

---

## 9. Implementation Architecture

### Complete Voice Bot Flow

```
                    +-------------------+
                    |   Telegram User   |
                    +--------+----------+
                             |
                    Voice/Text Message
                             |
                             v
+--------------------+       |       +--------------------+
|   Telegram API     |<------+------>|   Your Bot Server  |
+--------------------+               +--------------------+
                                              |
                    +-------------------------+-------------------------+
                    |                         |                         |
                    v                         v                         v
            +---------------+         +---------------+         +---------------+
            | Voice Handler |         | Text Handler  |         | Command Handler|
            +-------+-------+         +-------+-------+         +-------+-------+
                    |                         |                         |
                    v                         |                         |
            +---------------+                 |                         |
            | Download OGG  |                 |                         |
            +-------+-------+                 |                         |
                    |                         |                         |
                    v                         |                         |
            +---------------+                 |                         |
            | Whisper STT   |                 |                         |
            +-------+-------+                 |                         |
                    |                         |                         |
                    v                         v                         v
                    +-----------+-------------+-------------------------+
                                |
                                v
                    +-------------------+
                    |    AI Processing  |
                    |   (GPT/Claude)    |
                    +--------+----------+
                             |
                             v
                    +-------------------+
                    |   Response Text   |
                    +--------+----------+
                             |
              +--------------+--------------+
              |                             |
              v                             v
      +---------------+             +---------------+
      | Text Response |             | TTS Generation|
      +-------+-------+             +-------+-------+
              |                             |
              |                             v
              |                     +---------------+
              |                     | Convert OGG   |
              |                     +-------+-------+
              |                             |
              v                             v
      +-------+-------------+---------------+-------+
                            |
                            v
                    +-------------------+
                    |   Send Response   |
                    +-------------------+
```

### Webhook vs Polling

| Aspect | Webhook | Polling |
|--------|---------|---------|
| **Setup** | Complex (SSL, public URL) | Simple |
| **Latency** | Real-time | Near real-time |
| **Resources** | Efficient | More requests |
| **Scaling** | Better for high traffic | Good for low traffic |
| **Development** | Harder to test locally | Easy local testing |
| **Serverless** | Compatible | Requires persistent server |

**Recommendation:**
- Development: Use polling
- Production (low traffic): Polling is fine
- Production (high traffic): Use webhooks

---

## 10. Code Examples

### Complete Node.js Voice Bot (Telegraf)

```javascript
const { Telegraf } = require('telegraf');
const OpenAI = require('openai');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const fs = require('fs');
const path = require('path');
const axios = require('axios');

ffmpeg.setFfmpegPath(ffmpegPath);

const bot = new Telegraf(process.env.BOT_TOKEN);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Handle text messages
bot.on('text', async (ctx) => {
  const userMessage = ctx.message.text;

  // Process with AI
  const response = await processWithAI(userMessage);

  // Send text response
  await ctx.reply(response);

  // Optionally send voice response
  const audioPath = await textToSpeech(response);
  await ctx.replyWithVoice({ source: audioPath });
  fs.unlinkSync(audioPath);
});

// Handle voice messages
bot.on('voice', async (ctx) => {
  const voice = ctx.message.voice;

  // Download voice file
  const fileLink = await ctx.telegram.getFileLink(voice.file_id);
  const oggPath = `./temp/${ctx.message.message_id}.ogg`;
  const mp3Path = `./temp/${ctx.message.message_id}.mp3`;

  await downloadFile(fileLink.href, oggPath);

  // Convert OGG to MP3 for Whisper
  await convertAudio(oggPath, mp3Path);

  // Transcribe with Whisper
  const transcription = await transcribeAudio(mp3Path);

  // Process with AI
  const response = await processWithAI(transcription);

  // Generate voice response
  const responseAudioPath = await textToSpeech(response);

  // Send both text and voice response
  await ctx.reply(response);
  await ctx.replyWithVoice({ source: responseAudioPath });

  // Cleanup
  [oggPath, mp3Path, responseAudioPath].forEach(f => {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  });
});

// Helper functions
async function downloadFile(url, dest) {
  const response = await axios({ url, responseType: 'stream' });
  const writer = fs.createWriteStream(dest);
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

function convertAudio(input, output) {
  return new Promise((resolve, reject) => {
    ffmpeg(input)
      .output(output)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
}

async function transcribeAudio(filePath) {
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: 'whisper-1'
  });
  return transcription.text;
}

async function textToSpeech(text) {
  const outputPath = `./temp/response_${Date.now()}.ogg`;
  const response = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'nova',
    input: text,
    response_format: 'opus'
  });

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
  return outputPath;
}

async function processWithAI(text) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: text }]
  });
  return completion.choices[0].message.content;
}

// Ensure temp directory exists
if (!fs.existsSync('./temp')) {
  fs.mkdirSync('./temp');
}

bot.launch();
console.log('Bot is running...');
```

### Python Voice Bot Example

```python
import os
import asyncio
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters
from openai import OpenAI
import ffmpeg

client = OpenAI(api_key=os.environ['OPENAI_API_KEY'])

async def handle_voice(update: Update, context):
    # Download voice file
    voice = update.message.voice
    file = await context.bot.get_file(voice.file_id)
    ogg_path = f"temp/{update.message.message_id}.ogg"
    mp3_path = f"temp/{update.message.message_id}.mp3"

    await file.download_to_drive(ogg_path)

    # Convert to MP3
    ffmpeg.input(ogg_path).output(mp3_path).run(overwrite_output=True)

    # Transcribe
    with open(mp3_path, "rb") as audio_file:
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file
        )

    # Process with AI
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": transcript.text}]
    )
    reply_text = response.choices[0].message.content

    # Generate TTS response
    speech = client.audio.speech.create(
        model="tts-1",
        voice="nova",
        input=reply_text,
        response_format="opus"
    )

    response_path = f"temp/response_{update.message.message_id}.ogg"
    speech.stream_to_file(response_path)

    # Send responses
    await update.message.reply_text(reply_text)
    await update.message.reply_voice(voice=open(response_path, "rb"))

    # Cleanup
    for f in [ogg_path, mp3_path, response_path]:
        if os.path.exists(f):
            os.remove(f)

async def handle_text(update: Update, context):
    user_text = update.message.text

    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": user_text}]
    )
    reply_text = response.choices[0].message.content

    await update.message.reply_text(reply_text)

def main():
    os.makedirs("temp", exist_ok=True)

    app = Application.builder().token(os.environ['BOT_TOKEN']).build()

    app.add_handler(MessageHandler(filters.VOICE, handle_voice))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))

    app.run_polling()

if __name__ == '__main__':
    main()
```

---

## Summary

### Key Takeaways

1. **Bot Creation**: Use BotFather to create bots and obtain API tokens
2. **Voice Format**: OGG/OPUS is required for proper voice message display
3. **File Limits**: 20MB download, 50MB upload via standard Bot API
4. **Rate Limits**: 1 msg/sec per chat, 20 msg/min in groups
5. **STT**: OpenAI Whisper (25MB limit) or local alternatives
6. **TTS**: OpenAI TTS with opus output for direct Telegram compatibility
7. **Architecture**: Webhook for production, polling for development

### Recommended Stack for Kingdom Mind

For integrating with the existing Next.js/Node.js stack:

- **Library**: `telegraf` (TypeScript native, middleware architecture)
- **STT**: OpenAI Whisper API (already using OpenRouter)
- **TTS**: OpenAI TTS API with opus format
- **Audio Processing**: `fluent-ffmpeg` with `@ffmpeg-installer/ffmpeg`
- **Deployment**: Webhook mode via existing Cloudflare tunnel

---

## Sources

- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [Telegram Bot Tutorial](https://core.telegram.org/bots/tutorial)
- [Telegram Bots FAQ](https://core.telegram.org/bots/faq)
- [node-telegram-bot-api GitHub](https://github.com/yagop/node-telegram-bot-api)
- [Telegraf.js Documentation](https://telegraf.js.org/)
- [grammY Documentation](https://grammy.dev/)
- [python-telegram-bot Documentation](https://docs.python-telegram-bot.org/)
- [OpenAI Audio API Reference](https://platform.openai.com/docs/api-reference/audio)
- [FFmpeg Audio Conversion Guide](https://shashwatv.com/parse-audio-to-ogg-opus-telegram/)
- [Telegram Voice Chatbot with ChatGPT and Whisper](https://dev.to/ngviethoang/build-a-telegram-voice-chatbot-using-chatgpt-api-and-whisper-53e2)
- [Telegram Limits Reference](https://limits.tginfo.me/en)
- [Webhook vs Polling Guide](https://hostman.com/tutorials/difference-between-polling-and-webhook-in-telegram-bots/)
