'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface VoiceResult {
  transcript: string;
  response: string;
  audioUrl?: string;
  toolResults?: any[];
}

interface VoiceRecordButtonProps {
  onResult: (result: VoiceResult) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

export function VoiceRecordButton({
  onResult,
  onError,
  disabled = false,
  className,
}: VoiceRecordButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    if (disabled || isProcessing) return;

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        }
      });

      streamRef.current = stream;
      chunksRef.current = [];

      // Determine supported MIME type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;

        // Create blob from chunks
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });

        if (audioBlob.size === 0) {
          onError?.('No audio recorded');
          setIsProcessing(false);
          return;
        }

        // Send to API
        await sendAudioToServer(audioBlob);
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setPermissionDenied(false);
    } catch (error: any) {
      console.error('Failed to start recording:', error);

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
        onError?.('Microphone permission denied');
      } else {
        onError?.('Failed to access microphone');
      }
    }
  }, [disabled, isProcessing, onError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      setIsRecording(false);
      setIsProcessing(true);
      mediaRecorderRef.current.stop();
    }
  }, [isRecording]);

  const sendAudioToServer = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/architect/voice', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();

      onResult({
        transcript: result.transcript || '',
        response: result.response || '',
        audioUrl: result.audioUrl,
        toolResults: result.toolResults,
      });
    } catch (error: any) {
      console.error('Failed to process audio:', error);
      onError?.(error.message || 'Failed to process audio');
    } finally {
      setIsProcessing(false);
    }
  };

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startRecording();
  }, [startRecording]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    stopRecording();
  }, [stopRecording]);

  const handleMouseLeave = useCallback(() => {
    if (isRecording) {
      stopRecording();
    }
  }, [isRecording, stopRecording]);

  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    startRecording();
  }, [startRecording]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    stopRecording();
  }, [stopRecording]);

  const isDisabled = disabled || isProcessing;

  return (
    <motion.button
      type="button"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      disabled={isDisabled}
      className={cn(
        "relative flex items-center justify-center w-12 h-12 rounded-full",
        "transition-all duration-200 select-none touch-none",
        "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
        isDisabled && "opacity-50 cursor-not-allowed",
        !isDisabled && !isRecording && "bg-stone-800 hover:bg-stone-700 border border-stone-700",
        isRecording && "bg-red-600 border-2 border-red-400",
        isProcessing && "bg-stone-800 border border-stone-600",
        className
      )}
      whileTap={!isDisabled ? { scale: 0.95 } : undefined}
    >
      {/* Pulsing ring animation when recording */}
      <AnimatePresence>
        {isRecording && (
          <>
            <motion.div
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeOut" }}
              className="absolute inset-0 rounded-full bg-red-500"
            />
            <motion.div
              initial={{ scale: 1, opacity: 0.4 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.2 }}
              className="absolute inset-0 rounded-full bg-red-500"
            />
          </>
        )}
      </AnimatePresence>

      {/* Icon */}
      <div className="relative z-10">
        {isProcessing ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-5 h-5 border-2 border-stone-400 border-t-transparent rounded-full"
          />
        ) : permissionDenied ? (
          <MicOff className="w-5 h-5 text-red-400" />
        ) : (
          <Mic
            className={cn(
              "w-5 h-5 transition-colors",
              isRecording ? "text-white" : "text-stone-300"
            )}
          />
        )}
      </div>

      {/* Recording indicator dot */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-stone-950"
          >
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="w-full h-full rounded-full bg-red-400"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
