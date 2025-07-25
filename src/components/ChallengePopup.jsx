import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatsPopup from './StatsPopup';
import { db, auth } from '../firebase';
import {
  doc,
  updateDoc,
  collection,
  addDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { checkUserHasEnoughBalance } from '../utils/BalanceGuard';

const ChallengePopup = ({
  challengerUsername,
  challengerId,
  game,
  wager,
  solEstimate,
  challengeId,
  currentUserId,
  onDecline,
  onClose,
}) => {
  const [showStats, setShowStats] = useState(false);
  const navigate = useNavigate();

  const handleAccept = async () => {
    try {
      const challengeRef = doc(db, 'challenges', challengeId);
      const challengeSnap = await getDoc(challengeRef);
      const challengeData = challengeSnap.data();

      const solPriceRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
      const solPrice = (await solPriceRes.json())?.solana?.usd || 0;

      const hasEnough = await checkUserHasEnoughBalance(currentUserId, challengeData.wager, solPrice);
      if (!hasEnough) {
        alert("Insufficient balance to accept this challenge.");
        return;
      }

      await updateDoc(challengeRef, {
        status: 'accepted',
        seen: true,
        acceptedPopupShown: false,
        acceptedById: currentUserId,
        acceptedByUsername: challengeData.opponentUsername || 'Opponent',
      });

      const amountSolRaw = challengeData.amountSol;
      const parsedAmountSol = typeof amountSolRaw === 'string' ? parseFloat(amountSolRaw) : amountSolRaw;
      const roomId = Math.floor(10000000 + Math.random() * 90000000).toString();

      const contractRef = await addDoc(collection(db, 'contracts'), {
        createdBy: challengerId,
        acceptedBy: currentUserId,
        photonRoomCreator: auth.currentUser?.uid,
        roomId,
        game,
        wager,
        amountUsd: wager,
        amountSol: parsedAmountSol || 0,
        status: 'accepted',
        challengeRef: challengeId,
        players: [challengerId, currentUserId],
        createdAt: new Date(),
      });

      if (onClose) onClose();
      navigate(`/game/${contractRef.id}?playerType=creator`);
    } catch (err) {
      console.error('❌ Error accepting challenge and creating contract:', err);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-gray-900 p-6 rounded-xl shadow-xl w-full max-w-sm">
        <h2 className="text-xl font-bold text-green-400 mb-2">⚔️ Challenge Received</h2>
        <p className="text-white mb-2">
          <strong>{challengerUsername}</strong> (<code>{challengerId}</code>) challenged you!
        </p>
        <p className="text-white mb-2">
          Game: <strong>{game}</strong>
        </p>
        <p className="text-white mb-4">
          Wager: <strong>${wager}</strong>
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onDecline}
            className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-700 text-white"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white"
          >
            Accept
          </button>
          <button
            onClick={() => setShowStats(true)}
            className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white"
          >
            Stats
          </button>
        </div>
      </div>
      {showStats && (
        <StatsPopup uid={challengerId} onClose={() => setShowStats(false)} />
      )}
    </div>
  );
};

export default ChallengePopup;
