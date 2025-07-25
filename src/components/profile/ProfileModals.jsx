"use strict";
import React from 'react';

const ProfileModals = ({
  showChallengesModal,
  showContractsModal,
  showFriendsModal,
  showRequestsModal,
  showChallengeModal,
  activeChallenges,
  pendingContracts,
  friends,
  friendRequests,
  challengeOpponent,
  challengeGame,
  challengeWager,
  setChallengeGame,
  setChallengeWager,
  setShowChallengesModal,
  setShowContractsModal,
  setShowFriendsModal,
  setShowRequestsModal,
  setShowChallengeModal,
  setChallengeOpponent,
  handleAccept,
  handleDecline,
  handleCancelContract,
  handleAcceptFriend,
  handleDeclineFriend,
  handleSubmitChallenge,
  solPrice
}) => {
  const games = ["Stand Off", "Catapult", "Coin Toss", "Steal", "Duel"];

  const modalBackdrop = "fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50";
  const modalContainer = "bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto text-white font-sans";

  const buttonClass = "px-4 py-2 rounded-lg font-medium transition-transform transform hover:scale-105 shadow-md";
  const closeButton = "mt-4 bg-red-500 hover:bg-red-600 " + buttonClass;

  const solEstimate = (usd) => {
    const amount = parseFloat(usd);
    return (!amount || !solPrice) ? "0.0000" : (amount / solPrice).toFixed(4);
  };

  return (
    <>
      {/* Challenges Modal */}
      {showChallengesModal && (
        <div className={modalBackdrop}>
          <div className={modalContainer}>
            <h3 className="text-2xl font-bold text-green-400 mb-4">⚔️ All Challenges</h3>
            {activeChallenges.length ? (
              activeChallenges.map(ch => (
                <div key={ch.id} className="py-3 border-b border-gray-700">
                  <p><strong>From:</strong> {ch.challengerUsername}</p>
                  <p><strong>Game:</strong> {ch.game}</p>
                  <p><strong>Wager:</strong> ${ch.wager.toFixed(2)}</p>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => handleAccept(ch.id)} className={`bg-green-500 hover:bg-green-600 ${buttonClass}`}>
                      Accept
                    </button>
                    <button onClick={() => handleDecline(ch.id)} className={`bg-red-500 hover:bg-red-600 ${buttonClass}`}>
                      Decline
                    </button>
                  </div>
                </div>
              ))
            ) : <p className="text-gray-400">No Active Challenges</p>}
            <button onClick={() => setShowChallengesModal(false)} className={closeButton}>Close</button>
          </div>
        </div>
      )}

      {/* Contracts Modal */}
      {showContractsModal && (
        <div className={modalBackdrop}>
          <div className={modalContainer}>
            <h3 className="text-2xl font-bold text-green-400 mb-4">📜 Pending Contracts</h3>
            {pendingContracts.length ? (
              pendingContracts.map(contract => (
                <div key={contract.id} className="py-3 border-b border-gray-700 flex justify-between items-center">
                  <div>
                    <p><strong>Game:</strong> {contract.game}</p>
                    <p><strong>Amount:</strong> ${contract.amountUsd.toFixed(2)}</p>
                  </div>
                  <button onClick={() => handleCancelContract(contract.id)} className={`bg-red-500 hover:bg-red-600 ${buttonClass}`}>
                    Cancel
                  </button>
                </div>
              ))
            ) : <p className="text-gray-400">No Pending Contracts</p>}
            <button onClick={() => setShowContractsModal(false)} className={closeButton}>Close</button>
          </div>
        </div>
      )}

      {/* Friends Modal */}
      {showFriendsModal && (
        <div className={modalBackdrop}>
          <div className={modalContainer}>
            <h3 className="text-2xl font-bold text-green-400 mb-4">👥 Friends List</h3>
            {friends.length ? (
              friends.map(friend => (
                <div key={friend.id} className="py-3 border-b border-gray-700 flex justify-between items-center">
                  <span>{friend.username}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setChallengeOpponent(friend.id);
                        setShowChallengeModal(true);
                        setShowFriendsModal(false);
                      }}
                      className={`bg-blue-500 hover:bg-blue-600 ${buttonClass}`}
                    >
                      Challenge
                    </button>
                    <button className={`bg-purple-500 hover:bg-purple-600 ${buttonClass}`}>Stats</button>
                  </div>
                </div>
              ))
            ) : <p className="text-gray-400">No Friends Added</p>}
            <button onClick={() => setShowFriendsModal(false)} className={closeButton}>Close</button>
          </div>
        </div>
      )}

      {/* Friend Requests Modal */}
      {showRequestsModal && (
        <div className={modalBackdrop}>
          <div className={modalContainer}>
            <h3 className="text-2xl font-bold text-green-400 mb-4">📩 Friend Requests</h3>
            {friendRequests.length ? (
              friendRequests.map(req => (
                <div key={req.id} className="py-3 border-b border-gray-700">
                  <p><strong>From:</strong> {req.senderUsername}</p>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => handleAcceptFriend(req.id, req.senderId, req.senderUsername)} className={`bg-green-500 hover:bg-green-600 ${buttonClass}`}>
                      Accept
                    </button>
                    <button onClick={() => handleDeclineFriend(req.id)} className={`bg-red-500 hover:bg-red-600 ${buttonClass}`}>
                      Decline
                    </button>
                  </div>
                </div>
              ))
            ) : <p className="text-gray-400">No Friend Requests</p>}
            <button onClick={() => setShowRequestsModal(false)} className={closeButton}>Close</button>
          </div>
        </div>
      )}

      {/* Challenge Modal */}
      {showChallengeModal && (
        <div className={modalBackdrop}>
          <div className={modalContainer}>
            <h3 className="text-2xl font-bold text-green-400 mb-4">🎯 Send Challenge</h3>
            <p className="mb-2"><strong>Opponent:</strong> {challengeOpponent}</p>

            <select
              value={challengeGame}
              onChange={(e) => setChallengeGame(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-700 mb-3"
            >
              <option>Select a game</option>
              {games.map(game => <option key={game} value={game}>{game}</option>)}
            </select>

            <input
              type="number"
              placeholder="Enter wager ($)"
              value={challengeWager}
              onChange={(e) => setChallengeWager(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-700 mb-1"
            />
            <p className="text-sm text-gray-400 mb-3">≈ {solEstimate(challengeWager)} SOL</p>

            <div className="flex gap-2">
              <button onClick={handleSubmitChallenge} className={`bg-green-500 hover:bg-green-600 ${buttonClass}`}>
                Send
              </button>
              <button onClick={() => setShowChallengeModal(false)} className={closeButton}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileModals;
