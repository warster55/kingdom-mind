/**
 * Audio File Serving Endpoint
 *
 * Serves generated TTS audio files from the voice API.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

export const dynamic = 'force-dynamic';

const AUDIO_OUTPUT_DIR = process.env.AUDIO_OUTPUT_DIR || '/tmp/km-voice-output';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. SECURITY: Verify Architect Role
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as { role?: string })?.role;

    if (userRole !== 'architect' && userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. VALIDATE: Check audio ID format (UUID)
    const { id } = await params;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid audio ID' },
        { status: 400 }
      );
    }

    // 3. LOCATE: Find audio file
    const audioPath = join(AUDIO_OUTPUT_DIR, `${id}.wav`);

    try {
      await stat(audioPath);
    } catch {
      return NextResponse.json(
        { error: 'Audio file not found' },
        { status: 404 }
      );
    }

    // 4. SERVE: Stream audio file
    const audioBuffer = await readFile(audioPath);

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'private, max-age=3600',
        'Content-Disposition': `inline; filename="${id}.wav"`,
      },
    });

  } catch (error: unknown) {
    console.error('[Audio API] Error serving audio:', error);
    return NextResponse.json(
      { error: 'Failed to serve audio' },
      { status: 500 }
    );
  }
}
