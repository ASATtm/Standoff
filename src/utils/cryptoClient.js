// src/utils/cryptoClient.js
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

/**
 * Encrypts a message with a given public key using NaCl box (anonymous box).
 * @param {Object} message - Plain JS object to encrypt.
 * @param {string} base64PublicKey - The recipient's public key in base64.
 * @returns {string} base64 ciphertext.
 */
export function encryptData(message, base64PublicKey) {
  const recipientPublicKeyBytes = naclUtil.decodeBase64(base64PublicKey); // ✅ USE base64 decoder
  const messageBytes = naclUtil.decodeUTF8(JSON.stringify(message));
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const ephemeralKeypair = nacl.box.keyPair();

  const box = nacl.box(
    messageBytes,
    nonce,
    recipientPublicKeyBytes,
    ephemeralKeypair.secretKey
  );

  const fullMessage = new Uint8Array(
    ephemeralKeypair.publicKey.length + nonce.length + box.length
  );
  fullMessage.set(ephemeralKeypair.publicKey);
  fullMessage.set(nonce, ephemeralKeypair.publicKey.length);
  fullMessage.set(box, ephemeralKeypair.publicKey.length + nonce.length);

  return naclUtil.encodeBase64(fullMessage);
}
