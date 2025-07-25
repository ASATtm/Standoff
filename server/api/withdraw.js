// server/api/withdraw.js
import express from 'express';
import { db } from '../firebase.js';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import fs from 'fs';
import path from 'path';
import { Timestamp } from 'firebase-admin/firestore';
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
import bs58 from 'bs58';

console.log('🟢 withdraw.js loaded ✅');

const router = express.Router();
router.use(express.json());

const connection = new Connection('https://api.devnet.solana.com');

let bankKeypair;
let naclKeypair;

try {
  const raw = fs.readFileSync('./secrets/bank-keypair.json', 'utf8');
  const secretKey = Uint8Array.from(JSON.parse(raw));
  bankKeypair = Keypair.fromSecretKey(secretKey);
  console.log('🔑 bankKeypair loaded ✅');
} catch (err) {
  console.error('❌ Failed to load bank-keypair.json:', err.message);
}

try {
  const secretKeyPath = path.resolve(process.cwd(), 'secrets/nacl-keypair.json');
  const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(secretKeyPath, 'utf8')));
  naclKeypair = nacl.box.keyPair.fromSecretKey(secretKey);
  console.log('🔐 NaCl keypair loaded for decryption ✅');
} catch (err) {
  console.error('❌ Failed to load NaCl decryption key:', err.message);
}

const MAX_AMOUNT = 3;
const COOLDOWN_HOURS = 7;

const decryptPayload = (base64) => {
  const payload = naclUtil.decodeBase64(base64);
  const senderPub = payload.slice(0, 32);
  const nonce = payload.slice(32, 56);
  const box = payload.slice(56);

  if (!naclKeypair) throw new Error('NaCl keypair not loaded');

  const decrypted = nacl.box.open(box, nonce, senderPub, naclKeypair.secretKey);
  if (!decrypted) throw new Error('Decryption failed');

  const json = naclUtil.encodeUTF8(decrypted);
  return JSON.parse(json);
};

const processWithdraw = async (uid, amount, toWallet) => {
  const userRef = db.collection('users').doc(uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) throw new Error('User not found');

  const user = userSnap.data();
  await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(userRef);
    const currentBalance = snap.data().balance || 0;
    if (parseFloat(amount) > currentBalance) throw new Error('Insufficient balance');
    transaction.update(userRef, { balance: currentBalance - parseFloat(amount) });
  });

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: bankKeypair.publicKey,
      toPubkey: new PublicKey(toWallet),
      lamports: parseFloat(amount) * LAMPORTS_PER_SOL,
    })
  );

  const signature = await connection.sendTransaction(tx, [bankKeypair]);
  await connection.confirmTransaction(signature, 'confirmed');

  await db.collection('users').doc(uid).collection('transactions').add({
    type: 'withdraw',
    amount: parseFloat(amount),
    currency: 'SOL',
    timestamp: Timestamp.now(),
    txSignature: signature,
  });

  return signature;
};

router.post('/', async (req, res) => {
  try {
    if (!bankKeypair) return res.status(500).json({ error: 'Bank keypair not loaded.' });

    const { payload } = req.body;
    if (!payload) return res.status(400).json({ error: 'Missing encrypted payload.' });

    const { uid, amount, toWallet } = decryptPayload(payload);
    if (!uid || !amount || !toWallet || isNaN(amount)) {
      return res.status(400).json({ error: 'Invalid decrypted fields.' });
    }

    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) return res.status(404).json({ error: 'User not found.' });

    const user = userSnap.data();
    const now = Timestamp.now();
    const since = Timestamp.fromMillis(Date.now() - COOLDOWN_HOURS * 60 * 60 * 1000);

    const userBalance = user.balance || 0;
    if (parseFloat(amount) > userBalance) {
      return res.status(400).json({ error: 'Insufficient balance. Your balance is ' + userBalance });
    }

    const withdrawsSnap = await db.collection('withdraws')
      .where('userId', '==', user.userId)
      .where('createdAt', '>=', since)
      .get();

    const totalWithdrawn = withdrawsSnap.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
    const willExceed = (amount + totalWithdrawn) > MAX_AMOUNT;

    const status = willExceed ? 'pending' : 'approved';

    const newDoc = await db.collection('withdraws').add({
      userId: user.userId,
      uid,
      username: user.username || 'Anonymous',
      toWallet,
      amount: parseFloat(amount),
      status,
      createdAt: now
    });

    if (status === 'pending') {
      return res.status(200).json({
        id: newDoc.id,
        status,
        message: '🕓 Withdraw exceeds limit, waiting for admin approval.'
      });
    }

    const signature = await processWithdraw(uid, amount, toWallet);

    return res.status(200).json({
      status: 'approved',
      signature,
      explorer: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
      message: '✅ Auto-approved and processed.'
    });

  } catch (err) {
    console.error('❌ Withdraw error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ✅ ADMIN APPROVAL ROUTE
router.post('/admin/approve', async (req, res) => {
  try {
    const { docId } = req.body;
    if (!docId) return res.status(400).json({ error: 'Missing withdrawal doc ID' });

    const docRef = db.collection('withdraws').doc(docId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return res.status(404).json({ error: 'Withdrawal not found' });

    const { uid, amount, toWallet, status } = docSnap.data();

    if (status !== 'approved') {
      return res.status(400).json({ error: 'Withdrawal status is not approved yet.' });
    }

    const signature = await processWithdraw(uid, amount, toWallet);

    await docRef.update({
      processedAt: Timestamp.now(),
      txSignature: signature,
    });

    return res.status(200).json({
      status: 'completed',
      signature,
      explorer: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
    });
  } catch (err) {
    console.error('❌ Admin withdrawal error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
