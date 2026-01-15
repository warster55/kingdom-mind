/**
 * Voice API Endpoint for Architect Dashboard
 *
 * Accepts audio input, transcribes with Whisper, processes with Architect AI,
 * and returns synthesized audio response using Piper TTS.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { transcribeAudio, isWhisperAvailable } from '@/lib/voice/whisper';
import { synthesizeSpeech, isPiperAvailable, preprocessTextForTTS } from '@/lib/voice/piper';
import { processArchitectTurn } from '@/lib/ai/architect';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

export const dynamic = 'force-dynamic';

// Directory for serving generated audio files
const AUDIO_OUTPUT_DIR = process.env.AUDIO_OUTPUT_DIR || '/tmp/km-voice-output';

/**
 * Ensure output directory exists
 */
async function ensureOutputDir(): Promise<void> {
  try {
    await mkdir(AUDIO_OUTPUT_DIR, { recursive: true });
  } catch {
    // Directory likely exists
  }
}

/**
 * Clean up old audio files (older than 1 hour)
 */
async function cleanupOldAudio(): Promise<void> {
  try {
    const { readdir, stat, unlink } = await import('node:fs/promises');
    const files = await readdir(AUDIO_OUTPUT_DIR);
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour

    for (const file of files) {
      try {
        const filePath = join(AUDIO_OUTPUT_DIR, file);
        const stats = await stat(filePath);
        if (now - stats.mtimeMs > maxAge) {
          await unlink(filePath);
        }
      } catch {
        // Ignore individual file errors
      }
    }
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Collect full response from Architect streaming
 */
interface ToolResult {
  action: string;
  timestamp: number;
}

async function collectArchitectResponse(command: string): Promise<{
  response: string;
  toolResults: ToolResult[];
}> {
  return new Promise((resolve, reject) => {
    const chunks: string[] = [];
    const toolResults: ToolResult[] = [];

    const stream = new ReadableStream({
      async start(controller) {
        try {
          await processArchitectTurn(command, controller);
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });

    const reader = stream.getReader();
    const decoder = new TextDecoder();

    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value);
          chunks.push(text);

          // Try to detect tool results in the stream
          // The Architect prefixes tool execution with specific markers
          if (text.includes('Architect is accessing the vault')) {
            toolResults.push({ action: 'tool_execution', timestamp: Date.now() });
          }
        }
        resolve({
          response: chunks.join(''),
          toolResults
        });
      } catch (error) {
        reject(error);
      }
    })();
  });
}

/**
 * Extract clean text from Architect response for TTS
 * Removes markdown, code blocks, and other formatting
 */
function extractSpeakableText(response: string): string {
  return response
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, 'Code block omitted.')
    // Remove inline code
    .replace(/`[^`]+`/g, '')
    // Remove markdown links, keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove bold/italic markers
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove horizontal rules
    .replace(/^[-*_]{3,}\s*$/gm, '')
    // Remove bullet points but keep text
    .replace(/^[-*+]\s+/gm, '')
    // Remove numbered lists markers
    .replace(/^\d+\.\s+/gm, '')
    // Clean up SQL/technical content
    .replace(/SELECT\s+[\s\S]*?;/gi, 'Query executed.')
    // Remove JSON blocks
    .replace(/\{[\s\S]*?\}/g, '')
    // Clean up whitespace
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. SECURITY: Verify Architect Role
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as { role?: string })?.role;

    if (userRole !== 'architect' && userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Sovereign access required.' },
        { status: 401 }
      );
    }

    // 2. PARSE: Extract audio from FormData
    const formData = await request.formData();
    const audioFile = formData.get('audio') as Blob | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided.' },
        { status: 400 }
      );
    }

    // Get audio as buffer
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    const mimeType = audioFile.type || 'audio/webm';

    console.log(`[Voice API] Received audio: ${audioBuffer.length} bytes, type: ${mimeType}`);

    // 3. TRANSCRIBE: Audio to text
    const transcriptionResult = await transcribeAudio(audioBuffer, mimeType);

    if (!transcriptionResult.success || !transcriptionResult.text) {
      // Check if whisper is available for better error message
      const whisperAvailable = await isWhisperAvailable();

      return NextResponse.json({
        error: transcriptionResult.error || 'Transcription failed',
        whisperAvailable,
        suggestion: !whisperAvailable
          ? 'Install whisper.cpp and ensure it is in your PATH.'
          : 'Check audio quality and try again.',
      }, { status: 500 });
    }

    const transcript = transcriptionResult.text;
    console.log(`[Voice API] Transcription: "${transcript.substring(0, 100)}..."`);

    // 4. PROCESS: Send to Architect AI
    let architectResponse: string;
    let toolResults: ToolResult[] = [];

    try {
      const result = await collectArchitectResponse(transcript);
      architectResponse = result.response;
      toolResults = result.toolResults;
    } catch (aiError: unknown) {
      console.error('[Voice API] Architect error:', aiError);
      const errMsg = aiError instanceof Error ? aiError.message : 'Unknown error';
      return NextResponse.json({
        transcript,
        error: `Architect processing failed: ${errMsg}`,
      }, { status: 500 });
    }

    console.log(`[Voice API] Architect response: ${architectResponse.length} chars`);

    // 5. SYNTHESIZE: Text to speech
    let audioUrl: string | undefined;

    const piperStatus = await isPiperAvailable();
    if (piperStatus.available) {
      // Extract speakable text from response
      const speakableText = preprocessTextForTTS(extractSpeakableText(architectResponse));

      if (speakableText.length > 10) {  // Only synthesize if there's meaningful text
        // Ensure output directory exists
        await ensureOutputDir();

        // Clean up old audio files (async, don't wait)
        cleanupOldAudio().catch(() => {});

        // Generate unique filename
        const audioId = randomUUID();
        const audioPath = join(AUDIO_OUTPUT_DIR, `${audioId}.wav`);

        const synthesisResult = await synthesizeSpeech(speakableText, {
          outputPath: audioPath,
        });

        if (synthesisResult.success && synthesisResult.audioPath) {
          // Return a URL that can be served
          // The actual serving would need to be configured in Next.js or via static file serving
          audioUrl = `/api/architect/voice/audio/${audioId}`;

          console.log(`[Voice API] Synthesized audio: ${audioPath}`);
        } else {
          console.warn(`[Voice API] Synthesis failed: ${synthesisResult.error}`);
        }
      }
    } else {
      console.log(`[Voice API] Piper not available: ${piperStatus.error}`);
    }

    // 6. RESPONSE
    const response = {
      transcript,
      response: architectResponse,
      toolResults,
      audioUrl,
      timing: {
        total_ms: Date.now() - startTime,
        transcription_ms: transcriptionResult.duration_ms,
      },
    };

    return NextResponse.json(response);

  } catch (error: unknown) {
    console.error('[Voice API] Unexpected error:', error);
    const errMsg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    );
  }
}

/**
 * GET: Check voice API status and capabilities
 */
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as { role?: string })?.role;

    if (userRole !== 'architect' && userRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const whisperAvailable = await isWhisperAvailable();
    const piperStatus = await isPiperAvailable();

    return NextResponse.json({
      status: 'ok',
      capabilities: {
        stt: {
          available: whisperAvailable,
          engine: 'whisper.cpp',
          model: process.env.WHISPER_MODEL || 'ggml-base.en',
        },
        tts: {
          available: piperStatus.available,
          engine: 'piper',
          model: process.env.PIPER_MODEL || 'en_US-lessac-medium',
          error: piperStatus.error,
        },
      },
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    );
  }
}
