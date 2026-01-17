'use client';

import { useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

interface BitcoinGiftCardProps {
  address: string;
  onClose: () => void;
}

/**
 * Dedicated QR Code Screen
 * Full-screen overlay that captures all touch events
 * Text pacer cannot advance while this is shown
 */
export function BitcoinGiftCard({ address, onClose }: BitcoinGiftCardProps) {
  // Prevent any touch events from bubbling to the chat/text pacer
  const handleInteraction = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDone = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  }, [onClose]);

  // Dismiss keyboard when screen opens
  useEffect(() => {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement?.blur) {
      activeElement.blur();
    }
  }, []);

  // Prevent scroll on body while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const bitcoinUri = `bitcoin:${address}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
      onTouchMove={handleInteraction}
      onTouchEnd={handleInteraction}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-stone-950 p-6"
      style={{ touchAction: 'none' }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center mb-6"
      >
        <h2 className="text-amber-400 text-xl font-semibold mb-1">Scan to Give</h2>
        <p className="text-stone-500 text-sm">Use any Bitcoin wallet app</p>
      </motion.div>

      {/* QR Code */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-3xl p-6 mb-6"
      >
        <QRCodeSVG
          value={bitcoinUri}
          size={220}
          level="M"
          includeMargin={false}
        />
      </motion.div>

      {/* Address */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-stone-900 rounded-2xl p-4 mb-8 max-w-xs w-full"
      >
        <p className="text-stone-500 text-xs mb-2 text-center">Bitcoin Address</p>
        <p className="text-stone-400 text-xs font-mono break-all text-center leading-relaxed">
          {address}
        </p>
      </motion.div>

      {/* Done Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        onClick={handleDone}
        onTouchEnd={handleDone}
        className="w-full max-w-xs py-4 px-6 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-900 font-semibold rounded-2xl transition-colors text-lg"
      >
        Done
      </motion.button>

      {/* Disclaimer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-stone-600 text-xs text-center"
      >
        Personal gift to support this ministry
      </motion.p>
    </motion.div>
  );
}
