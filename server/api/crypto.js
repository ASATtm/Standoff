// server/api/crypto.js
import express from 'express';
import fs from 'fs';
import path from 'path';
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

const router = express.Router();

let naclKeypair;
let publicKeyBase64 = 'MISSING';

try {
  const secretKeyPath = path.resolve(process.cwd(), 'secrets/nacl-keypair.json');
  const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(secretKeyPath, 'utf8')));
  naclKeypair = nacl.box.keyPair.fromSecretKey(secretKey);
  publicKeyBase64 = naclUtil.encodeBase64(naclKeypair.publicKey);
  console.log('🔐 Loaded NaCl keypair and public key for encryption');
} catch (err) {
  console.error('❌ Failed to load nacl-keypair.json:', err.message);
}

// ✅ Serve public key for frontend encryption
router.get('/public-key', (req, res) => {
  console.log('✅ HIT /api/crypto/public-key');
  return res.json({ publicKey: publicKeyBase64 });
});

router.get('/debug', (req, res) => {
  return res.json({
    ok: true,
    publicKey: publicKeyBase64,
    keyLoaded: !!naclKeypair,
  });
});

export default router;
