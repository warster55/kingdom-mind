'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, ExternalLink } from 'lucide-react';

interface BitcoinGiftCardProps {
  address: string;
}

export function BitcoinGiftCard({ address }: BitcoinGiftCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = address;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [address]);

  const bitcoinUri = `bitcoin:${address}`;

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
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-stone-900/80 backdrop-blur-sm rounded-2xl p-6 max-w-xs mx-auto border border-amber-500/20"
    >
      {/* QR Code */}
      <div className="bg-white rounded-xl p-3 mb-4">
        <QRCodeSVG
          value={bitcoinUri}
          size={180}
          level="M"
          includeMargin={false}
          className="w-full h-auto"
        />
      </div>

      {/* Address */}
      <div className="mb-4">
        <p className="text-stone-500 text-xs mb-1 text-center">Bitcoin Address</p>
        <p className="text-stone-300 text-xs font-mono break-all text-center leading-relaxed">
          {address}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl transition-colors text-sm"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-400" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy</span>
            </>
          )}
        </button>

        <a
          href={bitcoinUri}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-stone-900 font-medium rounded-xl transition-colors text-sm"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Open</span>
        </a>
      </div>

      {/* Disclaimer */}
      <p className="mt-4 text-stone-600 text-[10px] text-center leading-relaxed">
        Personal gift &middot; Not tax-deductible
      </p>
    </motion.div>
  );
}
