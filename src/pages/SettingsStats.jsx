"use client";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const SettingsStats = () => {
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [favoriteGame, setFavoriteGame] = useState("-");
  const [deposited, setDeposited] = useState(0);
  const [withdrawn, setWithdrawn] = useState(0);
  const [profitData, setProfitData] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const uid = user.uid;

      const txSnap = await getDocs(collection(db, "users", uid, "transactions"));
      let totalDep = 0;
      let totalWith = 0;
      let cumulativeProfit = 0;
      const profitPoints = [];

      txSnap.forEach((doc) => {
        const tx = doc.data();
        if (tx.type === "deposit") totalDep += tx.amount;
        if (tx.type === "withdraw") totalWith += tx.amount;
        if (tx.type === "release") {
          cumulativeProfit += tx.amount;
          profitPoints.push({ y: cumulativeProfit.toFixed(4), x: new Date(tx.timestamp?.toDate()) });
        }
      });

      setDeposited(totalDep);
      setWithdrawn(totalWith);
      setProfitData(profitPoints);

      // ✅ Corrected logic for wins and losses
      const winnerQuery = query(collection(db, "contracts"), where("winnerId", "==", uid));
      const loserQuery = query(collection(db, "contracts"), where("loserId", "==", uid));

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

      setWins(wins);
      setLosses(losses);
      setFavoriteGame(fav ? fav[0] : "-");
    };

    fetchStats();
  }, []);

  const chartData = {
    labels: profitData.map((p) => p.x.toLocaleDateString()),
    datasets: [
      {
        label: "Profit Over Time (SOL)",
        data: profitData.map((p) => p.y),
        borderColor: "rgb(34 197 94)",
        backgroundColor: "rgba(34 197 94, 0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="p-6 text-white max-w-4xl mx-auto">
      <Link
        to="/settings"
        className="inline-block bg-gray-700 hover:bg-gray-800 text-white text-sm px-4 py-2 rounded mb-6"
      >
        ← Back to Settings
      </Link>

      <h2 className="text-3xl font-bold text-green-400 mb-6">Your Stats</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-900 p-4 rounded">
          <h3 className="text-xl text-green-400 font-semibold mb-2">Performance</h3>
          <p>Wins: <span className="text-green-300 font-bold">{wins}</span></p>
          <p>Losses: <span className="text-red-400 font-bold">{losses}</span></p>
          <p>Win Rate: <span className="font-bold">{wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : 0}%</span></p>
          <p>Favorite Game: <span className="text-yellow-300 font-semibold">{favoriteGame}</span></p>
        </div>

        <div className="bg-gray-900 p-4 rounded">
          <h3 className="text-xl text-green-400 font-semibold mb-2">Financials</h3>
          <p>Total Deposited: <span className="font-bold text-green-400">{deposited.toFixed(4)} SOL</span></p>
          <p>Total Withdrawn: <span className="font-bold text-red-400">{withdrawn.toFixed(4)} SOL</span></p>
        </div>
      </div>

      <div className="bg-gray-900 p-4 rounded">
        <h3 className="text-xl text-green-400 font-semibold mb-4">Profit Over Time</h3>
        {profitData.length > 0 ? (
          <Line data={chartData} />
        ) : (
          <p className="text-gray-400">No profit data to display yet.</p>
        )}
      </div>
    </div>
  );
};

export default SettingsStats;
