// server/api/user.js
import express from 'express';
import { db } from '../firebase.js';

const router = express.Router();

// ✅ GET user balance securely
router.get('/:uid/balance', async (req, res) => {
  const { uid } = req.params;

  if (!uid || typeof uid !== 'string') {
    return res.status(400).json({ error: 'Invalid or missing uid' });
  }

  try {
    const snap = await db.collection('users').doc(uid).get();
    if (!snap.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    const data = snap.data();
    return res.status(200).json({ balance: data.balance || 0 });
  } catch (err) {
    console.error('❌ GET /user/:uid/balance failed:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
