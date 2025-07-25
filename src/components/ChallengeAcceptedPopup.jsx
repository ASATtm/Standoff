import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const ChallengeAcceptedPopup = ({
  accepterUsername = 'Opponent',
  accepterId = 'unknown',
  game,
  wager,
  challengeId,
  onClose,
}) => {
  const [contractId, setContractId] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!challengeId) return;

    let attempts = 0;
    const interval = setInterval(async () => {
      try {
        const contractsQuery = query(
          collection(db, 'contracts'),
          where('challengeRef', '==', challengeId),
          where('status', '==', 'accepted')
        );

        const snapshot = await getDocs(contractsQuery);

        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const data = doc.data();

          if (data.roomId) {
            setContractId(doc.id);
            setRoomId(data.roomId);
            setLoading(false);
            clearInterval(interval);
          }
        }

        if (++attempts >= 10) {
          clearInterval(interval);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error polling contract:', err);
        clearInterval(interval);
        setLoading(false);
      }
    }, 1000); // poll every 1s

    return () => clearInterval(interval);
  }, [challengeId]);

  const handlePlay = () => {
    if (contractId && roomId) {
      onClose?.();
      setTimeout(() => {
        window.location.href = `/game/${contractId}?roomId=${roomId}`;
      }, 100);
    } else {
      alert('Contract or Room ID not ready.');
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-gray-900 p-6 rounded-xl shadow-xl w-full max-w-sm">
        <h2 className="text-xl font-bold text-green-400 mb-2">✅ Challenge Accepted!</h2>
        <p className="text-white mb-2">
          <strong>{accepterUsername}</strong> accepted your challenge.
        </p>
        <p className="text-white mb-2">Game: <strong>{game}</strong></p>
        <p className="text-white mb-4">Wager: <strong>${wager}</strong></p>
        <div className="flex justify-end gap-2">
          <button
            onClick={handlePlay}
            disabled={loading || !contractId || !roomId}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Play'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChallengeAcceptedPopup;
