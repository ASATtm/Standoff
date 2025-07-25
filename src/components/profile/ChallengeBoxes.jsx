"use strict";
import React, { useState, useRef, useEffect } from 'react';
import OnlineIndicator from '../OnlineIndicator';
import StatsPopup from '../StatsPopup';

const ChallengeBoxes = ({
  activeChallenges,
  pendingContracts,
  handleAccept,
  handleDecline,
  handleCancelContract,
  solPrice
}) => {
  const [selectedStatsUserId, setSelectedStatsUserId] = useState(null);
  const [isChallengesModalOpen, setIsChallengesModalOpen] = useState(false);
  const [isContractsModalOpen, setIsContractsModalOpen] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setIsChallengesModalOpen(false);
        setIsContractsModalOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderChallengeItem = (ch) => (
    <li
      key={ch.id}
      className={`text-white border-b border-gray-700 py-2 ${
        ch.creatorHasFunds === false ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      <div className="flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <OnlineIndicator uid={ch.challengerId} />
          <p>From: {ch.challengerUsername}</p>
        </div>
      </div>
      <p>Game: {ch.game}</p>
      <p>
        Wager: ${typeof ch.wager === 'number' ? ch.wager.toFixed(2) : '—'} (~
        {typeof ch.wager === 'number' && solPrice ? (ch.wager / solPrice).toFixed(4) : '0.0000'} SOL)
      </p>
      <div className="flex space-x-2 mt-2">
        <button
          onClick={() => handleAccept(ch.id)}
          className={`px-3 py-1 rounded text-sm transition duration-150 ease-in-out ${
            ch.canAfford === false
              ? 'bg-gray-700 cursor-not-allowed text-gray-400'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
          disabled={ch.canAfford === false}
        >
          Accept
        </button>
        <button
          onClick={() => handleDecline(ch.id)}
          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
        >
          Decline
        </button>
        <button
          onClick={() => setSelectedStatsUserId(ch.challengerId)}
          className="bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-xs"
        >
          Stats
        </button>
      </div>
      {ch.canAfford === false && (
        <p className="text-yellow-400 text-xs mt-1">
          ⚠️ You don't have enough balance to accept this challenge.
        </p>
      )}
      {ch.creatorHasFunds === false && (
        <p className="text-yellow-500 text-xs mt-1">
          ⚠️ Challenger no longer has enough balance for this challenge.
        </p>
      )}
    </li>
  );

  const renderContractItem = (contract) => (
    <li key={contract.id} className="text-white border-b border-gray-700 py-2 flex justify-between items-center">
      <div>
        <p>Game: {contract.game}</p>
        <p>
          Amount: ${typeof contract.amountUsd === 'number' ? contract.amountUsd.toFixed(2) : '—'} (
          {typeof contract.amountSol === 'number' ? contract.amountSol.toFixed(4) : '—'} SOL)
        </p>
      </div>
      <button
        onClick={() => handleCancelContract(contract.id)}
        className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
      >
        Cancel
      </button>
    </li>
  );

  return (
    <div className="flex gap-4">
      {/* Active Challenges */}
      <div className="bg-gray-900 p-4 rounded w-80 h-64 flex flex-col">
        <h3 className="text-xl font-bold text-green-400 mb-2">Active Challenges</h3>
        <div className="flex-1 overflow-y-auto pr-1">
          {activeChallenges.length > 0 ? (
            activeChallenges.slice(0, 3).map(renderChallengeItem)
          ) : (
            <p className="text-gray-400">No Active Challenges</p>
          )}
        </div>
        <button
          onClick={() => setIsChallengesModalOpen(true)}
          className="mt-2 text-green-400 underline text-sm"
        >
          View All
        </button>
      </div>

      {/* Pending Contracts */}
      <div className="bg-gray-900 p-4 rounded w-80 h-64 flex flex-col">
        <h3 className="text-xl font-bold text-green-400 mb-2">Pending Contracts</h3>
        <div className="flex-1 overflow-y-auto pr-1">
          {pendingContracts.length > 0 ? (
            pendingContracts.slice(0, 3).map(renderContractItem)
          ) : (
            <p className="text-gray-400">No Pending Contracts</p>
          )}
        </div>
        <button
          onClick={() => setIsContractsModalOpen(true)}
          className="mt-2 text-green-400 underline text-sm"
        >
          View All
        </button>
      </div>

      {/* Modal for both Challenges and Contracts */}
      {(isChallengesModalOpen || isContractsModalOpen) && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-gray-900 p-6 rounded-xl w-full max-w-md max-h-[80vh] overflow-auto" ref={modalRef}>
            <h2 className="text-xl font-bold text-green-400 mb-4">
              {isChallengesModalOpen ? 'All Active Challenges' : 'All Pending Contracts'}
            </h2>
            <ul>
              {(isChallengesModalOpen ? activeChallenges : pendingContracts).map(
                isChallengesModalOpen ? renderChallengeItem : renderContractItem
              )}
            </ul>
            <button
              onClick={() => {
                setIsChallengesModalOpen(false);
                setIsContractsModalOpen(false);
              }}
              className="mt-4 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {selectedStatsUserId && (
        <StatsPopup uid={selectedStatsUserId} onClose={() => setSelectedStatsUserId(null)} />
      )}
    </div>
  );
};

export default ChallengeBoxes;
