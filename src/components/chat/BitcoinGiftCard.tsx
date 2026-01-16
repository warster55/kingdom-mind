'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Wallet, X } from 'lucide-react';

interface BitcoinGiftCardProps {
  address: string;
  onClose?: () => void;
}

export function BitcoinGiftCard({ address, onClose }: BitcoinGiftCardProps) {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  // Dismiss keyboard when modal opens
  useEffect(() => {
    if (isOpen) {
      // Blur any focused input to dismiss keyboard
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && activeElement.blur) {
        activeElement.blur();
      }
    }
  }, [isOpen]);

  const handleCopy = useCallback(async (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent event from bubbling up to parent elements
    e.preventDefault();
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = address;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [address]);

  const handleOpenWallet = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Use bitcoin URI to open wallet apps (Cash App, Strike, Coinbase, etc.)
    window.location.href = `bitcoin:${address}`;
  }, [address]);

  const handleClose = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  const handleBackdropClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // Only close if clicking the backdrop itself, not the card
    if (e.target === e.currentTarget) {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(false);
      onClose?.();
    }
  }, [onClose]);

  // Check if this is a placeholder address (xpub not configured)
  const isPlaceholder = address.startsWith('NEEDS_XPUB');

  if (isPlaceholder) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-stone-900/80 backdrop-blur-sm rounded-2xl p-6 max-w-xs mx-auto border border-amber-500/20"
      >
        <p className="text-amber-400/80 text-sm text-center">
          Bitcoin receiving is being configured. Please check back soon.
        </p>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
          onTouchEnd={handleBackdropClick}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          style={{ touchAction: 'none' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-stone-900 rounded-3xl p-6 max-w-sm w-full border border-amber-500/30 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              onTouchEnd={handleClose}
              className="absolute top-4 right-4 p-2 text-stone-500 hover:text-stone-300 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center mb-4">
              <h3 className="text-amber-400 font-semibold text-lg">Send a Gift</h3>
              <p className="text-stone-500 text-sm mt-1">Scan or tap to open your wallet</p>
            </div>

            {/* QR Code */}
            <div className="bg-white rounded-2xl p-4 mb-5 mx-auto w-fit">
              <QRCodeSVG
                value={`bitcoin:${address}`}
                size={200}
                level="M"
                includeMargin={false}
              />
            </div>

            {/* Open Wallet Button - Primary Action */}
            <button
              onClick={handleOpenWallet}
              onTouchEnd={handleOpenWallet}
              className="w-full flex items-center justify-center gap-3 py-4 px-4 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-900 font-semibold rounded-2xl transition-colors text-base mb-3"
            >
              <Wallet className="w-5 h-5" />
              <span>Open in Wallet</span>
            </button>

            {/* Address with Copy */}
            <div className="bg-stone-800/50 rounded-xl p-3 mb-3">
              <p className="text-stone-500 text-xs mb-1 text-center">Bitcoin Address</p>
              <p className="text-stone-400 text-xs font-mono break-all text-center leading-relaxed select-all">
                {address}
              </p>
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              onTouchEnd={handleCopy}
              className="w-full flex items-center justify-center gap-2 py-3 px-3 bg-stone-800 hover:bg-stone-700 active:bg-stone-600 text-stone-300 rounded-xl transition-colors text-sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">Copied to Clipboard</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Address</span>
                </>
              )}
            </button>

            {/* Disclaimer */}
            <p className="mt-4 text-stone-600 text-[10px] text-center leading-relaxed">
              Personal gift to support this ministry &middot; Not tax-deductible
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
