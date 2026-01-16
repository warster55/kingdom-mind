'use server';

import * as crypto from 'crypto';
import * as bitcoin from 'bitcoinjs-lib';
import BIP32Factory from 'bip32';
import * as ecc from 'tiny-secp256k1';
import bs58check from 'bs58check';

// Initialize bip32 with secp256k1
const bip32 = BIP32Factory(ecc);

// Trezor xpub/zpub from environment
const TREZOR_XPUB = process.env.TREZOR_XPUB || '';

/**
 * Generate a unique address index
 * In production, this should be stored in the database
 */
function getNextAddressIndex(): number {
  const base = Math.floor(Date.now() / 1000) - 1700000000;
  const random = crypto.randomInt(0, 1000);
  return (base * 1000 + random) % 2147483647;
}

/**
 * Convert zpub to xpub (different version bytes)
 * zpub: 0x04b24746, xpub: 0x0488b21e
 */
function zpubToXpub(zpub: string): string {
  const data = bs58check.decode(zpub);
  const xpubVersion = Buffer.from([0x04, 0x88, 0xb2, 0x1e]);
  const payload = data.slice(4);
  const xpubData = Buffer.concat([xpubVersion, payload]);
  return bs58check.encode(xpubData);
}

/**
 * Derive Bitcoin address from xpub/zpub at given index
 */
function deriveAddressAtIndex(extPubKey: string, index: number): string {
  if (!extPubKey) {
    throw new Error('TREZOR_XPUB not configured');
  }

  let xpub = extPubKey;
  let isSegwit = false;

  if (extPubKey.startsWith('zpub')) {
    xpub = zpubToXpub(extPubKey);
    isSegwit = true;
  }

  const node = bip32.fromBase58(xpub);
  const child = node.derive(0).derive(index);

  if (!child.publicKey) {
    throw new Error('Failed to derive public key');
  }

  if (isSegwit) {
    const { address } = bitcoin.payments.p2wpkh({
      pubkey: child.publicKey,
      network: bitcoin.networks.bitcoin,
    });
    if (!address) throw new Error('Failed to generate segwit address');
    return address;
  } else {
    const { address } = bitcoin.payments.p2pkh({
      pubkey: child.publicKey,
      network: bitcoin.networks.bitcoin,
    });
    if (!address) throw new Error('Failed to generate legacy address');
    return address;
  }
}

/**
 * Generate a unique Bitcoin address for a gift
 * Returns null if Bitcoin is not configured
 */
export async function generateGiftAddress(): Promise<{
  address: string;
  addressIndex: number;
} | null> {
  if (!TREZOR_XPUB) {
    console.log('[Bitcoin] TREZOR_XPUB not configured');
    return null;
  }

  try {
    const addressIndex = getNextAddressIndex();
    const address = deriveAddressAtIndex(TREZOR_XPUB, addressIndex);

    console.log(`[Bitcoin] Generated address at index ${addressIndex}: ${address}`);

    return { address, addressIndex };
  } catch (error) {
    console.error('[Bitcoin] Error generating address:', error);
    return null;
  }
}

/**
 * Check if Bitcoin is configured and working
 */
export async function isBitcoinConfigured(): Promise<boolean> {
  if (!TREZOR_XPUB) return false;

  try {
    deriveAddressAtIndex(TREZOR_XPUB, 0);
    return true;
  } catch {
    return false;
  }
}
