// server/utils/lockWager.js

import { db } from '../firebase.js';

export async function lockWager(uid, amount) {
  const userRef = db.collection('users').doc(uid);

  await db.runTransaction(async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists) throw new Error('User not found');

    const data = userSnap.data();
    const balance = data.balance || 0;
    const locked = data.lockedBalance || 0;

    if (balance < amount) {
      throw new Error(`Insufficient balance. Have ${balance}, need ${amount}`);
    }

    transaction.update(userRef, {
      balance: balance - amount,
      lockedBalance: locked + amount,
    });
  });

  return true;
}
