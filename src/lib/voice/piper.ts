/**
 * Piper Text-to-Speech Wrapper
 *
 * Synthesizes text to speech using the locally installed Piper TTS.
 * Piper is a fast, local neural TTS system.
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFile, readFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const execAsync = promisify(exec);

// Piper configuration from environment or defaults
const PIPER_BINARY = process.env.PIPER_BINARY || '/home/wmoore/piper-venv/bin/piper';
const PIPER_MODEL = process.env.PIPER_MODEL || '/home/wmoore/piper-voices/en_US-lessac-medium.onnx';

// Voice tuning parameters
const PIPER_LENGTH_SCALE = process.env.PIPER_LENGTH_SCALE || '1.0';  // Speed (lower = faster)
const PIPER_NOISE_SCALE = process.env.PIPER_NOISE_SCALE || '0.667';  // Variation
const PIPER_NOISE_W = process.env.PIPER_NOISE_W || '0.8';  // Phoneme duration variation

export interface SynthesisResult {
  success: boolean;
  audioBuffer?: Buffer;
  audioPath?: string;
  error?: string;
  duration_ms?: number;
}

/**
 * Check if Piper is available and properly configured
 */
export async function isPiperAvailable(): Promise<{ available: boolean; error?: string }> {
  // Check binary exists
  if (!existsSync(PIPER_BINARY)) {
    return { available: false, error: `Piper binary not found at ${PIPER_BINARY}` };
  }

  // Check model exists
  if (!existsSync(PIPER_MODEL)) {
    return { available: false, error: `Piper model not found at ${PIPER_MODEL}` };
  }

  // Check config file exists (should be alongside .onnx file)
  const configPath = `${PIPER_MODEL}.json`;
  if (!existsSync(configPath)) {
    return { available: false, error: `Piper config not found at ${configPath}` };
  }

  return { available: true };
}

/**
 * List available voice models
 */
export async function listVoiceModels(): Promise<string[]> {
  const voicesDir = '/home/wmoore/piper-voices';
  try {
    const { readdir } = await import('node:fs/promises');
    const files = await readdir(voicesDir);
    return files.filter(f => f.endsWith('.onnx'));
  } catch {
    return [];
  }
}

/**
 * Synthesize text to speech audio
 *
 * @param text - Text to synthesize
 * @param options - Optional synthesis parameters
 * @returns Synthesis result with audio buffer or error
 */
export async function synthesizeSpeech(
  text: string,
  options: {
    model?: string;
    speaker?: number;
    lengthScale?: number;
    noiseScale?: number;
    noiseW?: number;
    outputPath?: string;  // If provided, saves to this path instead of returning buffer
  } = {}
): Promise<SynthesisResult> {
  const startTime = Date.now();
  let tempDir: string | null = null;
  let outputFile: string | null = null;

  try {
    // Validate Piper availability
    const { available, error } = await isPiperAvailable();
    if (!available) {
      return {
        success: false,
        error: error || 'Piper TTS is not available',
        duration_ms: Date.now() - startTime,
      };
    }

    // Sanitize text for shell and Piper
    // Remove characters that could cause issues
    const sanitizedText = text
      .replace(/[`$\\]/g, '')  // Remove shell-problematic chars
      .replace(/"/g, '\\"')    // Escape quotes
      .trim();

    if (!sanitizedText) {
      return {
        success: false,
        error: 'No text provided for synthesis',
        duration_ms: Date.now() - startTime,
      };
    }

    // Create temp directory for processing
    tempDir = await mkdtemp(join(tmpdir(), 'piper-'));

    // Determine output path
    outputFile = options.outputPath || join(tempDir, 'output.wav');
    const inputFile = join(tempDir, 'input.txt');

    // Write text to file (safer than piping for complex text)
    await writeFile(inputFile, sanitizedText, 'utf-8');

    // Build Piper command
    const model = options.model || PIPER_MODEL;
    const piperArgs = [
      PIPER_BINARY,
      '-m', `"${model}"`,
      '-f', `"${outputFile}"`,
      '--length-scale', (options.lengthScale ?? parseFloat(PIPER_LENGTH_SCALE)).toString(),
      '--noise-scale', (options.noiseScale ?? parseFloat(PIPER_NOISE_SCALE)).toString(),
      '--noise-w-scale', (options.noiseW ?? parseFloat(PIPER_NOISE_W)).toString(),
    ];

    // Add speaker ID if multi-speaker model
    if (options.speaker !== undefined) {
      piperArgs.push('-s', options.speaker.toString());
    }

    // Pipe input file to piper
    const piperCmd = `cat "${inputFile}" | ${piperArgs.join(' ')}`;

    console.log(`[Piper] Synthesizing ${sanitizedText.length} chars...`);
    await execAsync(piperCmd, { timeout: 60000 });

    // Read the generated audio
    const audioBuffer = await readFile(outputFile);

    console.log(`[Piper] Synthesis complete: ${audioBuffer.length} bytes`);

    // If custom output path was provided, return the path
    if (options.outputPath) {
      return {
        success: true,
        audioPath: outputFile,
        duration_ms: Date.now() - startTime,
      };
    }

    return {
      success: true,
      audioBuffer,
      duration_ms: Date.now() - startTime,
    };

  } catch (error: unknown) {
    console.error('[Piper] Synthesis error:', error);
    const errMsg = error instanceof Error ? error.message : 'Unknown synthesis error';
    return {
      success: false,
      error: errMsg,
      duration_ms: Date.now() - startTime,
    };
  } finally {
    // Cleanup temp directory (only if we didn't use custom output path)
    if (tempDir && !options.outputPath) {
      try {
        const { rm } = await import('node:fs/promises');
        await rm(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.warn('[Piper] Failed to cleanup temp directory:', cleanupError);
      }
    }
  }
}

/**
 * Get audio duration estimate based on text length
 * Useful for progress indicators
 */
export function estimateAudioDuration(text: string): number {
  // Average speaking rate is ~150 words per minute
  // Average word length is ~5 characters
  const wordCount = text.length / 5;
  const durationSeconds = (wordCount / 150) * 60;
  return Math.max(1, durationSeconds);
}

/**
 * Pre-process text for better TTS output
 */
export function preprocessTextForTTS(text: string): string {
  return text
    // Expand common abbreviations
    .replace(/\bDr\./g, 'Doctor')
    .replace(/\bMr\./g, 'Mister')
    .replace(/\bMrs\./g, 'Misses')
    .replace(/\bMs\./g, 'Miss')
    .replace(/\betc\./g, 'etcetera')
    .replace(/\be\.g\./g, 'for example')
    .replace(/\bi\.e\./g, 'that is')
    // Handle numbers with context
    .replace(/(\d+)%/g, '$1 percent')
    // Add pauses at sentence boundaries
    .replace(/([.!?])\s+/g, '$1 ')
    // Remove markdown/formatting
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/_/g, ' ')
    .replace(/#{1,6}\s*/g, '')
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .trim();
}
