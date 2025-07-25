"use strict";
import React, { useState } from 'react';
import OnlineIndicator from '../OnlineIndicator';
import StatsPopup from '../StatsPopup';

const PastOpponentsBox = ({
  pastOpponents,
  setChallengeOpponent,
  setShowChallengeModal,
  onlineUsers
}) => {
  const [selectedStatsUserId, setSelectedStatsUserId] = useState(null);

  return (
    <div className="bg-gray-900 p-4 rounded w-80 mt-4 shadow-lg">
      <h3 className="text-xl font-bold text-green-400 mb-3">Past Opponents</h3>
      <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
        {Array.isArray(pastOpponents) && pastOpponents.length > 0 ? (
          pastOpponents.map((op) => {
            const hasValidId = typeof op.id === 'string' && op.id.trim().length > 0;
            const displayName =
              typeof op.username === 'string' && op.username.trim().length > 0
                ? op.username
                : hasValidId
                ? op.id
                : "Unknown";

            return (
              <div key={op.id || displayName} className="bg-gray-800 rounded p-2">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <OnlineIndicator uid={op.id} onlineUsers={onlineUsers} />
                      <span className="text-white text-sm font-semibold">
                        {displayName}
                      </span>
                    </div>
                    <span className="text-gray-400 text-xs">ID: {op.id || "???"}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <button
                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 rounded"
                      onClick={() => {
                        if (typeof setChallengeOpponent === 'function') {
                          setChallengeOpponent(op.id);
                          setShowChallengeModal(true);
                        } else {
                          alert('⚠ setChallengeOpponent not provided');
                        }
                      }}
                    >
                      Challenge
                    </button>
                    <button
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-2 py-1 rounded"
                      onClick={() => setSelectedStatsUserId(op.id)}
                    >
                      Stats
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-red-400">No past opponents yet</p>
        )}
      </div>

      {selectedStatsUserId && (
        <StatsPopup uid={selectedStatsUserId} onClose={() => setSelectedStatsUserId(null)} />
      )}
    </div>
  );
};

export default PastOpponentsBox;
