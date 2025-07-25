// src/utils/challenges.js
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore';

/**
 * Create a new challenge in Firestore
 * @param {string} challengerId - UID of challenger
 * @param {string} challengerUsername - username of challenger
 * @param {string} opponentId - UID of opponent
 * @param {string} opponentUsername - username of opponent
 * @param {string} game - name of the game
 * @param {number} wager - wager amount
 */
export async function createChallenge({
  challengerId,
  challengerUsername,
  opponentId,
  opponentUsername,
  game,
  wager,
}) {
  try {
    const challengesRef = collection(db, 'challenges');
    await addDoc(challengesRef, {
      challengerId,
      challengerUsername,
      opponentId,
      opponentUsername,
      game,
      wager,
      status: 'pending',
      createdAt: new Date(),
    });
    console.log('✅ Challenge created!');
  } catch (err) {
    console.error('❌ Failed to create challenge:', err);
    throw err;
  }
}

/**
 * Accept a challenge (updates status in Firestore)
 * @param {string} challengeId - Document ID of the challenge
 */
export async function acceptChallenge(challengeId) {
  try {
    const challengeDoc = doc(db, 'challenges', challengeId);
    await updateDoc(challengeDoc, { status: 'accepted' });
    console.log('✅ Challenge accepted!');
  } catch (err) {
    console.error('❌ Failed to accept challenge:', err);
    throw err;
  }
}

/**
 * Decline a challenge (updates status in Firestore)
 * @param {string} challengeId - Document ID of the challenge
 */
export async function declineChallenge(challengeId) {
  try {
    const challengeDoc = doc(db, 'challenges', challengeId);
    await updateDoc(challengeDoc, { status: 'declined' });
    console.log('✅ Challenge declined!');
  } catch (err) {
    console.error('❌ Failed to decline challenge:', err);
    throw err;
  }
}
