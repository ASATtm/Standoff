// server/utils/releaseWager.js

import { db } from '../firebase.js';

const SOL_USD_ESTIMATE = 100; // Placeholder for SOL/USD conversion rate
const MIN_WAGER_USD = 2.5;

function calculateRake(amountSol, rematchType = null) {
  const usd = amountSol * SOL_USD_ESTIMATE;

  if (rematchType === 'leaderboard') return 0.03 * amountSol;
  if (rematchType === 'standard') return 0.04 * amountSol;

  if (usd >= 150) return 0.03 * amountSol;
  if (usd >= 15) return 0.045 * amountSol;
  if (usd >= 5) return 0.1 * amountSol;
  return 0; // Reject wagers under $5 in main flow
}

export async function releaseWager(winnerUid, loserUid, amount, rematchType = null) {
  const usd = amount * SOL_USD_ESTIMATE;
  if (usd < MIN_WAGER_USD) {
    throw new Error('Minimum wager is $2.50 USD');
  }

  const winnerRef = db.collection('users').doc(winnerUid);
  const loserRef = db.collection('users').doc(loserUid);

  await db.runTransaction(async (transaction) => {
    const winnerSnap = await transaction.get(winnerRef);
    const loserSnap = await transaction.get(loserRef);

    if (!winnerSnap.exists || !loserSnap.exists) {
      throw new Error('Winner or loser not found');
    }

    const winnerData = winnerSnap.data();
    const loserData = loserSnap.data();

    const winnerLocked = winnerData.lockedBalance || 0;
    const loserLocked = loserData.lockedBalance || 0;

    if (winnerLocked < amount || loserLocked < amount) {
      throw new Error('One or both users do not have enough locked funds');
    }

    const rake = calculateRake(amount, rematchType);
    const payout = (amount * 2) - rake;

    transaction.update(winnerRef, {
      lockedBalance: winnerLocked - amount,
      balance: (winnerData.balance || 0) + payout,
    });

    transaction.update(loserRef, {
      lockedBalance: loserLocked - amount,
    });
  });

  return true;
}
