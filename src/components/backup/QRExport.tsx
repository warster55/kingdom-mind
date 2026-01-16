'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Download, QrCode, Check } from 'lucide-react';
import { exportSanctuary, downloadBackupFile, getSanctuarySize } from '@/lib/storage/sanctuary-backup';

interface QRExportProps {
  onClose: () => void;
}

export function QRExport({ onClose }: QRExportProps) {
  const [loading, setLoading] = useState(true);
  const [exportData, setExportData] = useState<{
    type: 'qr' | 'file';
    data: string;
    size: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState(false);
  const [sizeInfo, setSizeInfo] = useState<string>('');

  useEffect(() => {
    async function loadExport() {
      try {
        const size = await getSanctuarySize();
        setSizeInfo(size.sizeFormatted);

        if (!size.exists) {
          setError('No journey data to export');
          setLoading(false);
          return;
        }

        const result = await exportSanctuary();
        setExportData(result);
      } catch (err) {
        console.error('[QRExport] Error:', err);
        setError('Failed to generate backup');
      } finally {
        setLoading(false);
      }
    }

    loadExport();
  }, []);

  const handleDownload = async () => {
    try {
      await downloadBackupFile();
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch (err) {
      setError('Failed to download backup');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-stone-950/98 flex flex-col items-center justify-center p-6"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-200"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="max-w-sm w-full space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-stone-100 mb-2">
            Backup Your Journey
          </h2>
          <p className="text-stone-400 text-sm">
            {exportData?.type === 'qr'
              ? 'Scan this QR code on another device to restore'
              : 'Download your backup file to transfer to another device'}
          </p>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full"
            />
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="p-4 bg-red-950/50 border border-red-900 rounded-xl text-red-300 text-center">
            {error}
          </div>
        )}

        {/* QR Code display */}
        {exportData?.type === 'qr' && !loading && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-stone-50 rounded-2xl p-4 aspect-square flex items-center justify-center"
          >
            <img
              src={exportData.data}
              alt="Backup QR Code"
              className="w-full h-full object-contain"
            />
          </motion.div>
        )}

        {/* File download display */}
        {exportData?.type === 'file' && !loading && (
          <div className="bg-stone-900 rounded-2xl p-8 text-center space-y-4">
            <QrCode className="w-16 h-16 text-stone-600 mx-auto" />
            <p className="text-stone-400 text-sm">
              Your journey data is too large for a QR code ({sizeInfo}).
              <br />
              Please download the backup file instead.
            </p>
          </div>
        )}

        {/* Size info */}
        {!loading && !error && (
          <div className="text-center text-stone-500 text-xs">
            Journey size: {sizeInfo}
          </div>
        )}

        {/* Download button (always available as backup) */}
        {!loading && !error && (
          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-stone-900 font-medium rounded-xl transition-colors"
          >
            {downloaded ? (
              <>
                <Check className="w-5 h-5" />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Download backup file</span>
              </>
            )}
          </button>
        )}

        {/* Instructions */}
        {exportData?.type === 'qr' && !loading && (
          <div className="p-4 bg-stone-900/50 rounded-xl">
            <p className="text-stone-400 text-sm text-center">
              To restore on another device:
            </p>
            <ol className="mt-2 space-y-1 text-stone-500 text-xs">
              <li>1. Open Kingdom Mind on the new device</li>
              <li>2. Ask the mentor to import your journey</li>
              <li>3. Scan this QR code with your camera</li>
            </ol>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full py-3 text-stone-500 hover:text-stone-300 transition-colors"
        >
          Done
        </button>
      </div>
    </motion.div>
  );
}
