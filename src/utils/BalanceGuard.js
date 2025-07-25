import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Fetch current SOL price in USD from CoinGecko
 * @returns {Promise<number>} - SOL price in USD
 */
export async function fetchSolPrice() {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
    const json = await res.json();
    const price = json?.solana?.usd;
    if (!price || price === 0) {
      console.error('❌ Invalid SOL price:', price);
      return 0;
    }
    return price;
  } catch (err) {
    console.error('❌ Error fetching SOL price:', err);
    return 0;
  }
}

/**
 * Checks if a user has enough SOL to cover a USD-based wager.
 *
 * @param {string} userId - Firestore userId field value (e.g., 'USER-ETO5RI')
 * @param {number|string} requiredUsd - Amount in USD to check
 * @param {number} [cachedPrice] - Optional cached SOL price in USD
 * @returns {Promise<boolean>} - True if user has enough SOL to cover the USD
 */
export async function checkUserHasEnoughBalance(userId, requiredUsd, cachedPrice = null) {
  console.log(`🔍 checkUserHasEnoughBalance called for ${userId}, USD: ${requiredUsd}, Price: ${cachedPrice}`);
  try {
    const q = query(collection(db, 'users'), where('userId', '==', userId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.error(`❌ No user data found for ${userId}`);
      return false;
    }

    const data = snapshot.docs[0].data();
    const balanceSol = parseFloat(data?.balance ?? 0);

    if (isNaN(balanceSol)) {
      console.error(`❌ Invalid balance for ${userId}:`, data.balance);
      return false;
    }

    const solPrice = cachedPrice ?? await fetchSolPrice();

    if (!solPrice || solPrice === 0) {
      console.error('❌ Failed to fetch SOL price');
      return false;
    }

    const requiredSol = parseFloat(requiredUsd) / solPrice;

    console.log(`💰 User ${userId} Balance: ${balanceSol} SOL | Required: ${requiredSol.toFixed(4)} SOL`);

    return balanceSol >= requiredSol;
  } catch (err) {
    console.error(`❌ Failed to check balance for ${userId}:`, err);
    return false;
  }
}

/**
 * Fetches the user's raw SOL balance from Firestore by userId field.
 *
 * @param {string} userId
 * @returns {Promise<number>} - Balance in SOL
 */
export async function getUserBalance(userId) {
  try {
    const q = query(collection(db, 'users'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return 0;
    const data = snapshot.docs[0].data();
    return parseFloat(data?.balance ?? 0);
  } catch (err) {
    console.error(`❌ Failed to fetch balance for ${userId}:`, err);
    return 0;
  }
}
