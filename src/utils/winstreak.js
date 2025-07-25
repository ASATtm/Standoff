// src/utils/winstreak.js
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Increment a user's win streak for a specific game.
 * @param {string} userId - Firestore user document ID
 * @param {string} game - Name of the game (e.g., "Stand Off")
 */
export async function incrementWinStreak(userId, game) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      [`winstreaks.${game}`]: increment(1),
    });
    console.log(`✅ Incremented win streak for ${game} by 1`);
  } catch (err) {
    console.error('⚠️ Failed to increment win streak:', err);
  }
}

/**
 * Reset a user's win streak for a specific game.
 * @param {string} userId - Firestore user document ID
 * @param {string} game - Name of the game (e.g., "Stand Off")
 */
export async function resetWinStreak(userId, game) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      [`winstreaks.${game}`]: 0,
    });
    console.log(`✅ Reset win streak for ${game}`);
  } catch (err) {
    console.error('⚠️ Failed to reset win streak:', err);
  }
}
