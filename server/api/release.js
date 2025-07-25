// server/api/release.js

import express from 'express';
import { releaseWager } from '../utils/releaseWager.js';
import { db } from '../firebase.js';
import { Timestamp } from 'firebase-admin/firestore';

const router = express.Router();

router.post('/release', async (req, res) => {
  const { winnerUid, loserUid, amount, rematchType } = req.body;

  if (!winnerUid || !loserUid || !amount || isNaN(amount)) {
    return res.status(400).json({ error: 'Invalid request payload' });
  }

  try {
    await releaseWager(winnerUid, loserUid, parseFloat(amount), rematchType);

    await db.collection('users').doc(winnerUid).collection('transactions').add({
      type: 'release',
      amount: parseFloat(amount),
      currency: 'SOL',
      timestamp: Timestamp.now(),
      opponent: loserUid,
      matchType: rematchType || 'standard'
    });

    await db.collection('users').doc(loserUid).collection('transactions').add({
      type: 'release',
      amount: -parseFloat(amount),
      currency: 'SOL',
      timestamp: Timestamp.now(),
      opponent: winnerUid,
      matchType: rematchType || 'standard'
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('releaseWager error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
