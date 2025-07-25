import React from 'react';
import { useNavigate } from 'react-router-dom';

const OpponentReadyPopup = ({
  opponentUsername = 'Opponent',
  game,
  wager,
  contractId,
  onClose,
}) => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-gray-900 p-6 rounded-xl shadow-xl w-full max-w-sm">
        <h2 className="text-xl font-bold text-blue-400 mb-2">🎮 Game is Ready!</h2>

        <p className="text-white mb-2">
          <strong>{opponentUsername}</strong> is ready to start the match.
        </p>

        <p className="text-white mb-2">
          Game: <strong>{game}</strong>
        </p>
        <p className="text-white mb-4">
          Wager: <strong>${wager}</strong>
        </p>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-800 text-white"
          >
            Close
          </button>
          <button
            onClick={() => {
              navigate(`/game/${contractId}?playerType=joiner`); // Explicitly mark user A as room joiner
              onClose();
            }}
            className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white"
          >
            Play
          </button>
        </div>
      </div>
    </div>
  );
};

export default OpponentReadyPopup;
