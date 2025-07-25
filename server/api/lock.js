// server/api/lock.js

import express from 'express';
import { lockWager } from '../utils/lockWager.js';
import { db } from '../firebase.js';
import { Timestamp } from 'firebase-admin/firestore';

const router = express.Router();

router.post('/lock', async (req, res) => {
  const { uid, amount } = req.body;

  if (!uid || !amount || isNaN(amount)) {
    return res.status(400).json({ error: 'Invalid uid or amount' });
  }

  try {
    await lockWager(uid, parseFloat(amount));

    await db.collection('users').doc(uid).collection('transactions').add({
      type: 'lock',
      amount: parseFloat(amount),
      currency: 'SOL',
      timestamp: Timestamp.now(),
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('lockWager error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
