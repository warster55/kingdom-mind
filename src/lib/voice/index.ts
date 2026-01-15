/**
 * Voice Module - Speech-to-Text and Text-to-Speech
 *
 * Provides local voice processing capabilities:
 * - Whisper.cpp for speech-to-text transcription
 * - Piper TTS for text-to-speech synthesis
 */

export {
  transcribeAudio,
  transcribeFile,
  isWhisperAvailable,
  type TranscriptionResult,
} from './whisper';

export {
  synthesizeSpeech,
  isPiperAvailable,
  listVoiceModels,
  preprocessTextForTTS,
  estimateAudioDuration,
  type SynthesisResult,
} from './piper';
