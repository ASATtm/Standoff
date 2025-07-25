import React, { useEffect, useState } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import OnlineIndicator from "./OnlineIndicator";

const Leaderboard = ({
  selectedGame,
  sortDesc,
  setSortDesc,
  setSelectedStatsUserId,
  setChallengeOpponent,
  setShowChallengeModal,
  handleChallenge, // ✅ added explicitly
}) => {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!selectedGame) return;

      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const players = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const winStreak = data.winstreaks?.[selectedGame.name] || 0;
          if (winStreak > 0) {
            players.push({
              id: doc.id,
              userId: data.userId,
              username: data.username,
              winStreak,
            });
          }
        });

        setLeaderboard(
          players.sort((a, b) =>
            sortDesc ? b.winStreak - a.winStreak : a.winStreak - b.winStreak
          )
        );
      } catch (err) {
        console.error("Failed to fetch leaderboard data:", err);
      }
    };

    fetchLeaderboard();
  }, [selectedGame, sortDesc]);

  return (
    <div className="bg-gray-900 rounded-xl p-6 shadow-xl mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-green-400">
          🏆 {selectedGame?.name} Leaderboard
        </h2>
        <button
          onClick={() => setSortDesc((prev) => !prev)}
          className="bg-gray-800 hover:bg-gray-700 p-2 rounded-full"
        >
          {sortDesc ? <ArrowDown /> : <ArrowUp />}
        </button>
      </div>
      {leaderboard.length ? (
        <ul>
          {leaderboard.map((player) => (
            <li
              key={player.id}
              className="flex justify-between items-center border-b border-gray-700 py-2"
            >
              <div className="flex items-center gap-2">
                <OnlineIndicator uid={player.userId} />
                {player.username}
              </div>
              <div className="flex items-center gap-2">
                {player.winStreak} Wins
                <button
                  onClick={() => handleChallenge(player)}
                  className="text-green-400 border border-green-400 hover:bg-green-500 hover:text-white rounded px-2 py-1 text-sm transition"
                >
                  Challenge
                </button>
                <button
                  onClick={() => setSelectedStatsUserId(player.userId)}
                  className="text-purple-400 border border-purple-400 hover:bg-purple-500 hover:text-white px-2 py-1 rounded transition text-xs"
                >
                  Stats
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-400">No leaderboard data yet.</p>
      )}
    </div>
  );
};

export default Leaderboard;
