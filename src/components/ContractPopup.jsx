import React, { useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const ContractPopup = ({
  accepterUsername = 'Opponent',
  accepterId = 'unknown',
  game,
  wager,
  contractId,
  onCancel,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);

  const handlePlay = async () => {
    if (!contractId) {
      alert('Contract ID missing.');
      return;
    }

    setLoading(true);

    try {
      const contractRef = doc(db, 'contracts', contractId);
      const snap = await getDoc(contractRef);

      if (!snap.exists()) {
        alert('Contract not found.');
        return;
      }

      const data = snap.data();
      let roomId = data.roomId;

      if (!roomId) {
        roomId = Math.floor(10000000 + Math.random() * 90000000).toString();
        await updateDoc(contractRef, {
          roomId,
          gameStarted: true,
          photonRoomCreator: auth.currentUser?.uid || null,
        });
      } else {
        await updateDoc(contractRef, {
          gameStarted: true,
        });
      }

      onClose?.();

      setTimeout(() => {
        window.location.href = `/game/${contractId}?roomId=${roomId}&playerType=creator`;
      }, 100);

    } catch (err) {
      console.error('❌ Error starting game:', err);
      alert('Something went wrong while starting the game.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-gray-900 p-6 rounded-xl shadow-xl w-full max-w-sm">
        <h2 className="text-xl font-bold text-green-400 mb-2">✅ Contract Accepted!</h2>
        <p className="text-white mb-2">
          <strong>{accepterUsername}</strong> accepted your contract.
        </p>
        <p className="text-white mb-2">
          Game: <strong>{game}</strong>
        </p>
        <p className="text-white mb-4">
          Wager: <strong>${wager}</strong>
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
          >
            Cancel
          </button>
          <button
            onClick={handlePlay}
            disabled={loading}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            {loading ? 'Starting...' : 'Play'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContractPopup;
