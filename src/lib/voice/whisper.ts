/**
 * Whisper Speech-to-Text Wrapper
 *
 * Transcribes audio using whisper.cpp CLI when available.
 * Falls back to error if whisper-cpp is not installed.
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFile, mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const execAsync = promisify(exec);

// Whisper configuration from environment or defaults
const WHISPER_BINARY = process.env.WHISPER_BINARY || 'whisper-cpp';
const WHISPER_MODEL = process.env.WHISPER_MODEL || '/home/wmoore/models/ggml-base.en.bin';
const WHISPER_LANGUAGE = process.env.WHISPER_LANGUAGE || 'en';
const WHISPER_THREADS = process.env.WHISPER_THREADS || '4';

export interface TranscriptionResult {
  success: boolean;
  text?: string;
  error?: string;
  duration_ms?: number;
}

/**
 * Check if whisper-cpp is available on the system
 */
export async function isWhisperAvailable(): Promise<boolean> {
  try {
    await execAsync(`which ${WHISPER_BINARY}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert audio buffer to WAV format using ffmpeg
 * whisper.cpp requires 16kHz mono WAV input
 */
async function convertToWav(inputPath: string, outputPath: string): Promise<void> {
  // Convert to 16kHz mono WAV (whisper.cpp requirement)
  const ffmpegCmd = `ffmpeg -y -i "${inputPath}" -ar 16000 -ac 1 -c:a pcm_s16le "${outputPath}" 2>/dev/null`;
  await execAsync(ffmpegCmd, { timeout: 30000 });
}

/**
 * Transcribe audio buffer to text using whisper.cpp
 *
 * @param audioBuffer - Raw audio data (webm, mp3, wav, etc.)
 * @param mimeType - MIME type of the audio (e.g., 'audio/webm')
 * @returns Transcription result with text or error
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string = 'audio/webm'
): Promise<TranscriptionResult> {
  const startTime = Date.now();
  let tempDir: string | null = null;

  try {
    // Create temp directory for processing
    tempDir = await mkdtemp(join(tmpdir(), 'whisper-'));

    // Determine input file extension from MIME type
    const extMap: Record<string, string> = {
      'audio/webm': '.webm',
      'audio/webm;codecs=opus': '.webm',
      'audio/mp4': '.m4a',
      'audio/mpeg': '.mp3',
      'audio/wav': '.wav',
      'audio/x-wav': '.wav',
      'audio/ogg': '.ogg',
    };
    const inputExt = extMap[mimeType] || '.webm';

    const inputPath = join(tempDir, `input${inputExt}`);
    const wavPath = join(tempDir, 'audio.wav');
    const outputPath = join(tempDir, 'output');

    // Write audio buffer to temp file
    await writeFile(inputPath, audioBuffer);

    // Convert to WAV format required by whisper.cpp
    try {
      await convertToWav(inputPath, wavPath);
    } catch (conversionError: unknown) {
      // If ffmpeg not available, try direct if already WAV
      if (mimeType.includes('wav')) {
        // Assume it might work directly
        await writeFile(wavPath, audioBuffer);
      } else {
        const errMsg = conversionError instanceof Error ? conversionError.message : 'Unknown error';
        return {
          success: false,
          error: `Audio conversion failed: ${errMsg}. Ensure ffmpeg is installed.`,
          duration_ms: Date.now() - startTime,
        };
      }
    }

    // Check if whisper is available
    const whisperAvailable = await isWhisperAvailable();
    if (!whisperAvailable) {
      return {
        success: false,
        error: `whisper-cpp not found. Install whisper.cpp and ensure '${WHISPER_BINARY}' is in PATH.`,
        duration_ms: Date.now() - startTime,
      };
    }

    // Run whisper.cpp transcription
    // Output to text file format
    const whisperCmd = [
      WHISPER_BINARY,
      '-m', `"${WHISPER_MODEL}"`,
      '-f', `"${wavPath}"`,
      '-l', WHISPER_LANGUAGE,
      '-t', WHISPER_THREADS,
      '-otxt',  // Output as plain text
      '-of', `"${outputPath}"`,  // Output file prefix
      '--no-timestamps',  // Don't include timestamps in output
    ].join(' ');

    console.log('[Whisper] Running transcription...');
    await execAsync(whisperCmd, { timeout: 60000 });

    // Read transcription result
    const transcriptPath = `${outputPath}.txt`;
    const transcript = await readFile(transcriptPath, 'utf-8');
    const cleanedText = transcript.trim();

    console.log(`[Whisper] Transcription complete: "${cleanedText.substring(0, 50)}..."`);

    return {
      success: true,
      text: cleanedText,
      duration_ms: Date.now() - startTime,
    };

  } catch (error: unknown) {
    console.error('[Whisper] Transcription error:', error);
    const errMsg = error instanceof Error ? error.message : 'Unknown transcription error';
    return {
      success: false,
      error: errMsg,
      duration_ms: Date.now() - startTime,
    };
  } finally {
    // Cleanup temp directory
    if (tempDir) {
      try {
        const { rm } = await import('node:fs/promises');
        await rm(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.warn('[Whisper] Failed to cleanup temp directory:', cleanupError);
      }
    }
  }
}

/**
 * Transcribe from a file path instead of buffer
 */
export async function transcribeFile(filePath: string): Promise<TranscriptionResult> {
  const { readFile } = await import('node:fs/promises');
  const audioBuffer = await readFile(filePath);

  // Guess MIME type from extension
  const ext = filePath.toLowerCase().split('.').pop() || '';
  const mimeMap: Record<string, string> = {
    'webm': 'audio/webm',
    'm4a': 'audio/mp4',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
  };

  return transcribeAudio(audioBuffer, mimeMap[ext] || 'audio/webm');
}
