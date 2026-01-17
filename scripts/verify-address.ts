import * as bitcoin from 'bitcoinjs-lib';
import BIP32Factory from 'bip32';
import * as ecc from 'tiny-secp256k1';
import bs58check from 'bs58check';

const bip32 = BIP32Factory(ecc);

const ZPUB = process.env.TREZOR_XPUB || '';
const TARGET = process.argv[2] || '';

function zpubToXpub(zpub: string): string {
  const data = bs58check.decode(zpub);
  const xpubVersion = Buffer.from([0x04, 0x88, 0xb2, 0x1e]);
  const payload = data.slice(4);
  return bs58check.encode(Buffer.concat([xpubVersion, payload]));
}

function deriveAddress(xpub: string, index: number): string {
  const node = bip32.fromBase58(xpub);
  const child = node.derive(0).derive(index);
  const { address } = bitcoin.payments.p2wpkh({
    pubkey: child.publicKey,
    network: bitcoin.networks.bitcoin,
  });
  return address || '';
}

if (!ZPUB) {
  console.error('TREZOR_XPUB not set');
  process.exit(1);
}

const xpub = zpubToXpub(ZPUB);

console.log('Target address:', TARGET);
console.log('Your zpub:', ZPUB.substring(0, 20) + '...');
console.log('');
console.log('First 20 addresses from your zpub:');

let found = false;
for (let i = 0; i < 20; i++) {
  const addr = deriveAddress(xpub, i);
  const match = addr === TARGET ? ' <-- MATCH FOUND!' : '';
  if (match) found = true;
  console.log(`  Index ${i}: ${addr}${match}`);
}

if (!found && TARGET) {
  console.log('');
  console.log('Address NOT found in first 20 indexes.');
  console.log('This address may not belong to this zpub.');
}
