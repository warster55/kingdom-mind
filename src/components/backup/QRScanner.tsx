'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { motion } from 'framer-motion';
import { Camera, X, Upload } from 'lucide-react';
import { importSanctuary, importFromFile } from '@/lib/storage/sanctuary-backup';

interface QRScannerProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function QRScanner({ onSuccess, onCancel }: QRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        // Ignore errors when stopping
      }
      scannerRef.current = null;
    }
  }, []);

  const handleScanSuccess = useCallback(async (decodedText: string) => {
    setImporting(true);
    await stopScanner();
    setScanning(false);

    const result = await importSanctuary(decodedText);

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || 'Import failed');
      setImporting(false);
    }
  }, [stopScanner, onSuccess]);

  const startScanner = useCallback(async () => {
    setError(null);
    setScanning(true);

    try {
      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        handleScanSuccess,
        () => {} // Ignore scan failures
      );
    } catch (err) {
      console.error('[QRScanner] Error:', err);
      setError('Could not access camera. Please use file upload instead.');
      setScanning(false);
    }
  }, [handleScanSuccess]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError(null);

    const result = await importFromFile(file);

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || 'Import failed');
      setImporting(false);
    }
  }, [onSuccess]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-stone-950/98 flex flex-col items-center justify-center p-6"
    >
      {/* Close button */}
      <button
        onClick={() => {
          stopScanner();
          onCancel();
        }}
        className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-200"
        disabled={importing}
      >
        <X className="w-6 h-6" />
      </button>

      <div className="max-w-sm w-full space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-stone-100 mb-2">
            Import Your Journey
          </h2>
          <p className="text-stone-400 text-sm">
            Scan a backup QR code or upload a backup file
          </p>
        </div>

        {/* QR Scanner area */}
        <div className="relative bg-stone-900 rounded-2xl overflow-hidden aspect-square">
          <div id="qr-reader" className="w-full h-full" />

          {!scanning && !importing && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={startScanner}
                className="flex flex-col items-center gap-3 p-6 text-stone-400 hover:text-amber-400 transition-colors"
              >
                <Camera className="w-12 h-12" />
                <span className="text-sm">Tap to scan QR code</span>
              </button>
            </div>
          )}

          {importing && (
            <div className="absolute inset-0 flex items-center justify-center bg-stone-900/80">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full"
              />
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-950/50 border border-red-900 rounded-xl text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-stone-800" />
          <span className="text-stone-500 text-xs uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-stone-800" />
        </div>

        {/* File upload */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-stone-200 rounded-xl transition-colors"
        >
          <Upload className="w-5 h-5" />
          <span>Upload backup file</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Cancel button */}
        <button
          onClick={() => {
            stopScanner();
            onCancel();
          }}
          disabled={importing}
          className="w-full py-3 text-stone-500 hover:text-stone-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
}
