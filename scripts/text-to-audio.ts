#!/usr/bin/env npx tsx
/**
 * Text-to-Audio Script
 *
 * Summarizes text content using Gemini AI and converts to speech.
 *
 * Usage:
 *   npx tsx scripts/text-to-audio.ts <file>           # Summarize file and convert to audio
 *   npx tsx scripts/text-to-audio.ts --raw "text"     # Convert raw text directly
 *   npx tsx scripts/text-to-audio.ts <file> --voice Zephyr  # Use specific voice
 *   npx tsx scripts/text-to-audio.ts <file> --no-summary    # Skip summarization
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';
const SUMMARIZE_MODEL = 'gemini-2.0-flash';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

// Available voices: Puck, Kore, Zephyr, Charon, Fenrir, Enceladus, Algieba, etc.
const DEFAULT_VOICE = 'Kore';

interface Options {
  voice: string;
  output: string;
  noSummary: boolean;
  raw: string | null;
  file: string | null;
  maxDuration: number; // in seconds, for summary length hint
}

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Options = {
    voice: DEFAULT_VOICE,
    output: '',
    noSummary: false,
    raw: null,
    file: null,
    maxDuration: 30,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--voice' && args[i + 1]) {
      options.voice = args[++i];
    } else if (arg === '--output' && args[i + 1]) {
      options.output = args[++i];
    } else if (arg === '--no-summary') {
      options.noSummary = true;
    } else if (arg === '--raw' && args[i + 1]) {
      options.raw = args[++i];
    } else if (arg === '--duration' && args[i + 1]) {
      options.maxDuration = parseInt(args[++i], 10);
    } else if (!arg.startsWith('--')) {
      options.file = arg;
    }
  }

  return options;
}

async function summarizeText(text: string, maxDuration: number): Promise<string> {
  console.log(`Summarizing content for ~${maxDuration} second audio...`);

  // Estimate: ~150 words per minute of speech = ~2.5 words per second
  const targetWords = Math.floor(maxDuration * 2.5);

  const response = await fetch(`${BASE_URL}/models/${SUMMARIZE_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Create a spoken summary of the following content. The summary should be approximately ${targetWords} words (about ${maxDuration} seconds when read aloud).

Requirements:
- Write in a natural, conversational tone suitable for audio narration
- Focus on the most important points and overall vision
- Use complete sentences, no bullet points or lists
- Make it engaging and easy to listen to
- Do not include any markdown formatting

Content to summarize:

${text}`
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Summarization failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const summary = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!summary) {
    throw new Error('No summary generated');
  }

  console.log(`Summary generated (${summary.split(/\s+/).length} words)`);
  return summary;
}

async function textToSpeech(text: string, voice: string): Promise<Buffer> {
  console.log(`Converting to speech with voice: ${voice}...`);

  const response = await fetch(`${BASE_URL}/models/${TTS_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text }]
      }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voice
            }
          }
        }
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`TTS failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  if (!audioData) {
    console.error('Response structure:', JSON.stringify(data, null, 2));
    throw new Error('No audio data in response');
  }

  return Buffer.from(audioData, 'base64');
}

function writeWavFile(pcmBuffer: Buffer, outputPath: string): void {
  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmBuffer.length;
  const fileSize = 36 + dataSize;

  const header = Buffer.alloc(44);

  // RIFF header
  header.write('RIFF', 0);
  header.writeUInt32LE(fileSize, 4);
  header.write('WAVE', 8);

  // fmt chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // chunk size
  header.writeUInt16LE(1, 20);  // PCM format
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);

  // data chunk
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  const wavBuffer = Buffer.concat([header, pcmBuffer]);
  fs.writeFileSync(outputPath, wavBuffer);

  const durationSec = dataSize / byteRate;
  console.log(`Audio saved: ${outputPath}`);
  console.log(`Duration: ${durationSec.toFixed(1)} seconds`);
}

async function main() {
  if (!GEMINI_API_KEY) {
    console.error('Error: GEMINI_API_KEY not found in .env.local');
    process.exit(1);
  }

  const options = parseArgs();

  // Get input text
  let inputText: string;
  let baseName: string;

  if (options.raw) {
    inputText = options.raw;
    baseName = 'audio';
  } else if (options.file) {
    const filePath = path.resolve(options.file);
    if (!fs.existsSync(filePath)) {
      console.error(`Error: File not found: ${filePath}`);
      process.exit(1);
    }
    inputText = fs.readFileSync(filePath, 'utf-8');
    baseName = path.basename(options.file, path.extname(options.file));
    console.log(`Read ${inputText.length} characters from ${options.file}`);
  } else {
    console.log('Usage: npx tsx scripts/text-to-audio.ts <file> [options]');
    console.log('       npx tsx scripts/text-to-audio.ts --raw "text" [options]');
    console.log('\nOptions:');
    console.log('  --voice <name>     Voice to use (default: Kore)');
    console.log('  --output <path>    Output file path');
    console.log('  --duration <sec>   Target duration in seconds (default: 30)');
    console.log('  --no-summary       Skip summarization, use full text');
    console.log('  --raw "text"       Use raw text instead of file');
    process.exit(0);
  }

  // Summarize unless disabled
  let textToSpeak = inputText;
  if (!options.noSummary && !options.raw) {
    textToSpeak = await summarizeText(inputText, options.maxDuration);
    console.log('\n--- Summary ---');
    console.log(textToSpeak);
    console.log('---------------\n');
  }

  // Convert to speech
  const audioBuffer = await textToSpeech(textToSpeak, options.voice);

  // Write output file
  const outputPath = options.output || `${baseName}-audio.wav`;
  writeWavFile(audioBuffer, outputPath);

  console.log('\nDone!');
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
