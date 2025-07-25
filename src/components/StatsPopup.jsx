import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const StatsPopup = ({ uid, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!uid) {
      console.warn("❌ No userId provided to StatsPopup");
      return;
    }

    const fetchStats = async () => {
      setLoading(true);
      try {
        console.log("📡 Fetching stats for userId:", uid);

        // Since 'contracts' use Firestore Auth UIDs, get the user's auth UID
        const userQuery = query(collection(db, "users"), where("userId", "==", uid));
        const userSnap = await getDocs(userQuery);

        if (userSnap.empty) {
          throw new Error(`No matching user found for userId: ${uid}`);
        }

        const firebaseUid = userSnap.docs[0].id;

        const winnerQuery = query(collection(db, "contracts"), where("winnerId", "==", firebaseUid));
        const loserQuery = query(collection(db, "contracts"), where("loserId", "==", firebaseUid));

        const [winnerSnap, loserSnap] = await Promise.all([
          getDocs(winnerQuery),
          getDocs(loserQuery),
        ]);

        const wins = winnerSnap.size;
        const losses = loserSnap.size;
        const gameCount = {};

        winnerSnap.forEach((doc) => {
          const game = doc.data();
          if (game.game) gameCount[game.game] = (gameCount[game.game] || 0) + 1;
        });

        loserSnap.forEach((doc) => {
          const game = doc.data();
          if (game.game) gameCount[game.game] = (gameCount[game.game] || 0) + 1;
        });

        const fav = Object.entries(gameCount).sort((a, b) => b[1] - a[1])[0];

        setStats({
          wins,
          losses,
          matchCount: wins + losses,
          winRate: wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : "0",
          favoriteGame: fav ? fav[0] : "-",
        });

        console.log("✅ Stats set successfully for", firebaseUid);
      } catch (err) {
        console.error("❌ Failed to fetch stats:", err);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [uid]);

  if (!uid) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50">
      <div className="bg-gray-900 p-6 rounded w-96">
        <h3 className="text-xl font-bold text-green-400 mb-4">Player Stats</h3>

        <div className="mb-4">
          <p className="text-sm text-gray-300">User ID:</p>
          <div className="flex items-center gap-2">
            <span className="text-white text-xs font-mono break-all">{uid}</span>
            <button
              onClick={() => navigator.clipboard.writeText(uid)}
              className="bg-gray-700 hover:bg-gray-800 px-2 py-1 rounded text-xs"
            >
              Copy
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : stats ? (
          <>
            <p>Total Matches: <span className="text-white font-bold">{stats.matchCount}</span></p>
            <p>Wins: <span className="text-green-400 font-bold">{stats.wins}</span></p>
            <p>Losses: <span className="text-red-400 font-bold">{stats.losses}</span></p>
            <p>Win Rate: <span className="font-bold">{stats.winRate}%</span></p>
            <p>Favorite Game: <span className="text-yellow-300">{stats.favoriteGame}</span></p>
          </>
        ) : (
          <p className="text-red-400">Failed to load stats.</p>
        )}

        <button
          onClick={onClose}
          className="mt-6 bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default StatsPopup;