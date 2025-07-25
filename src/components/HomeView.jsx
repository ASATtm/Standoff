"use client";
import React, { useState, useEffect } from "react";
import GreenDriftfield from "../components/GreenDriftfield"; // ✅ swapped in
import OnlineIndicator from "./OnlineIndicator";
import StatsPopup from "../components/StatsPopup";
import Leaderboard from "./Leaderboard";

const games = [
  { id: 1, name: "Stand Off", isAvailable: true },
  { id: 2, name: "Catapult", isAvailable: false },
  { id: 3, name: "Coin Toss", isAvailable: false },
  { id: 4, name: "Steal", isAvailable: false },
  { id: 5, name: "Duel", isAvailable: true },
];

const HomeView = ({
  selectedGame,
  setSelectedGame,
  usdAmount,
  setUsdAmount,
  solEstimate,
  contracts,
  sortDesc,
  setSortDesc,
  handleCreateContract,
  handleCancelContract,
  handleAcceptContract,
  handleChallenge,
  currentUserId,
  onlineUsers,
  solPrice,
  setIncomingChallenge,
  setChallengeOpponent,
  setShowChallengeModal,
  challengeOpponent,
  showChallengeModal,
}) => {
  const [selectedStatsUserId, setSelectedStatsUserId] = useState(null);
  const [filteredContracts, setFilteredContracts] = useState([]);

  useEffect(() => {
    if (selectedGame) {
      setFilteredContracts(
        contracts.filter((c) => c.game === selectedGame.name)
      );
    } else {
      setFilteredContracts([]);
    }
  }, [selectedGame, contracts]);

  const safeFixed = (val, digits = 2) =>
    typeof val === "number" ? val.toFixed(digits) : "0.00";

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <GreenDriftfield />
      <div className="relative z-10 p-6 pt-[100px] pb-[100px] font-sans">
        <h2 className="text-4xl font-extrabold text-center text-green-400 mb-8">
          🚀 Welcome to Stand Off
        </h2>

        <div className="flex justify-center gap-4 flex-wrap mb-8">
          {games.map((game) => (
            <button
              key={game.id}
              onClick={() => game.isAvailable && setSelectedGame(game)}
              disabled={!game.isAvailable}
              className={`w-52 h-28 flex items-center justify-center text-xl font-semibold border-2 rounded-lg transition-transform hover:scale-105 ${
                selectedGame?.id === game.id
                  ? "bg-green-600 border-green-400 shadow-green-500/40"
                  : "bg-gray-900 border-gray-800 hover:bg-green-700"
              } ${!game.isAvailable ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              [{game.name}]
              {!game.isAvailable && (
                <span className="ml-2 text-yellow-400">(Soon)</span>
              )}
            </button>
          ))}
        </div>

        {selectedGame && (
          <>
            <Leaderboard
              selectedGame={selectedGame}
              handleChallenge={handleChallenge}
              sortDesc={sortDesc}
              setSortDesc={setSortDesc}
              setSelectedStatsUserId={setSelectedStatsUserId}
              setIncomingChallenge={setIncomingChallenge}
              setChallengeOpponent={setChallengeOpponent}
              setShowChallengeModal={setShowChallengeModal}
            />

            <div className="bg-gray-900 rounded-xl p-6 shadow-xl mb-8">
              <h2 className="text-2xl font-bold text-green-400 mb-4">
                🎲 Enter Your Wager
              </h2>
              <p className="text-lg mb-2">
                Game: <span className="text-green-400 font-semibold">{selectedGame.name}</span>
              </p>
              <input
                type="number"
                value={usdAmount}
                onChange={(e) => setUsdAmount(e.target.value)}
                placeholder="Enter wager in USD"
                className="w-full p-3 rounded-lg bg-gray-800 text-white mb-4 shadow-inner"
                disabled={!selectedGame.isAvailable}
              />
              <p className="mb-4 text-gray-300 text-lg">
                Estimated: {safeFixed(solEstimate, 4)} SOL
              </p>
              <button
                onClick={handleCreateContract}
                disabled={!selectedGame.isAvailable}
                className="w-full bg-green-600 hover:bg-green-700 text-xl font-bold rounded-lg py-3 transition shadow-xl disabled:opacity-50"
              >
                Create Contract
              </button>
            </div>

            {filteredContracts.length > 0 && (
              <div className="bg-gray-900 rounded-xl p-6 shadow-xl">
                <h2 className="text-2xl font-bold text-green-400 mb-4">
                  📜 Pending Contracts
                </h2>
                <div className="max-h-72 overflow-y-auto space-y-2 pr-2">
                  {filteredContracts.map((contract) => (
                    <div
                      key={contract.id}
                      className={`flex justify-between items-center rounded-lg p-3 transition ${
                        contract.creatorHasFunds === false
                          ? "bg-gray-700 opacity-40 pointer-events-none"
                          : "bg-gray-800 hover:bg-gray-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <OnlineIndicator uid={contract.createdBy} />
                        <strong>${safeFixed(contract.amountUsd)}</strong>{" "}
                        <span className="text-sm text-gray-300">
                          ({safeFixed(contract.amountSol, 4)} SOL)
                        </span>
                        {contract.creatorHasFunds === false && (
                          <div className="text-xs text-yellow-400 ml-1 mt-1">
                            ⚠️ Creator currently has insufficient funds
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {contract.createdBy === currentUserId ? (
                          <button
                            onClick={() => handleCancelContract(contract.id)}
                            className="text-red-400 border border-red-400 hover:bg-red-500 hover:text-white px-3 py-1 rounded transition text-sm"
                          >
                            Cancel
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleAcceptContract(contract.id)}
                              className="text-green-400 border border-green-400 hover:bg-green-500 hover:text-white px-3 py-1 rounded transition text-sm"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => setSelectedStatsUserId(contract.createdBy)}
                              className="text-purple-400 border border-purple-400 hover:bg-purple-500 hover:text-white px-2 py-1 rounded transition text-xs"
                            >
                              Stats
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {selectedStatsUserId && (
          <StatsPopup
            uid={selectedStatsUserId}
            onClose={() => setSelectedStatsUserId(null)}
          />
        )}
      </div>
    </div>
  );
};

export default HomeView;
