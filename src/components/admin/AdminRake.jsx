import React, { useEffect, useState } from 'react';
import {
  doc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';

const timeFilters = [
  { label: 'Today', days: 0 },
  { label: 'Yesterday', days: 1 },
  { label: 'Last 3 Days', days: 3 },
  { label: 'Last 7 Days', days: 7 },
  { label: 'Last Month', days: 30 },
  { label: 'YTD', days: 365 }
];

const AdminRake = () => {
  const [selectedFilter, setSelectedFilter] = useState(timeFilters[0]);
  const [rakeLogs, setRakeLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRakeLogs = async () => {
      setLoading(true);
      const now = new Date();
      let start = new Date();
      let end = now;

      if (selectedFilter.label === 'Today') {
        start.setHours(0, 0, 0, 0);
      } else {
        start.setDate(start.getDate() - selectedFilter.days);
        start.setHours(0, 0, 0, 0);
      }

      const rakeQuery = query(
        collection(db, 'contracts'),
        where('endedAt', '>=', Timestamp.fromDate(start)),
        where('endedAt', '<=', Timestamp.fromDate(end)),
        orderBy('endedAt', 'desc')
      );

      const snapshot = await getDocs(rakeQuery);
      const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRakeLogs(logs);

      const totalUsd = logs.reduce((sum, log) => sum + Number(log.rakeCollectedUsd ?? 0), 0);
      const totalSol = logs.reduce((sum, log) => sum + Number(log.rakeCollectedSol ?? 0), 0);

      if (selectedFilter.label === 'Today') {
        const rakeRef = doc(db, 'siteStats', 'dailyRake');
        await runTransaction(db, async (transaction) => {
          const rakeSnap = await transaction.get(rakeRef);
          const data = {
            totalUsd,
            totalSol,
            updatedAt: serverTimestamp(),
          };

          rakeSnap.exists()
            ? transaction.update(rakeRef, data)
            : transaction.set(rakeRef, data);
        });
      }

      setLoading(false);
    };

    fetchRakeLogs();
  }, [selectedFilter]);

  const calculateTotalRake = () => {
    const totalUsd = rakeLogs.reduce((sum, log) => sum + Number(log.rakeCollectedUsd ?? 0), 0);
    const totalSol = rakeLogs.reduce((sum, log) => sum + Number(log.rakeCollectedSol ?? 0), 0);
    return { totalUsd, totalSol };
  };

  const { totalUsd, totalSol } = calculateTotalRake();

  return (
    <section className="bg-gray-900 rounded-xl p-4 shadow-lg">
      <h2 className="text-xl font-semibold mb-2 text-green-300">💰 Rake Profit</h2>

      <div className="flex gap-2 mb-4">
        {timeFilters.map(filter => (
          <button
            key={filter.label}
            onClick={() => setSelectedFilter(filter)}
            disabled={selectedFilter.label === filter.label}
            className={`px-3 py-1 rounded text-sm font-medium ${
              selectedFilter.label === filter.label
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <p className="text-2xl font-bold text-white">
        ${totalUsd.toFixed(2)} | {totalSol.toFixed(4)} SOL
      </p>

      <div className="mt-4 max-h-60 overflow-y-auto">
        {loading ? (
          <p className="text-gray-400 italic">Loading rake data...</p>
        ) : rakeLogs.length === 0 ? (
          <p className="text-gray-400 italic">No rake logs for this period.</p>
        ) : (
          <ul className="space-y-2">
            {rakeLogs.map(log => {
              const wager = Number(log.amountUsd ?? 0);
              const pot = wager * 2;
              const rakeUsd = Number(log.rakeCollectedUsd ?? 0);
              const rakeSol = Number(log.rakeCollectedSol ?? 0);
              const rakePercent = pot > 0 ? ((rakeUsd / pot) * 100).toFixed(2) : '0.00';

              return (
                <li key={log.id} className="border-b border-gray-700 pb-2">
                  <p className="text-gray-300">
                    <span className="font-semibold">Game:</span> {log.game}
                  </p>
                  <p className="text-gray-300">
                    <span className="font-semibold">Wager (per player):</span> ${wager.toFixed(2)} |{' '}
                    <span className="font-semibold">Pot:</span> ${pot.toFixed(2)}
                  </p>
                  <p className="text-gray-300">
                    <span className="font-semibold">USD Rake:</span> ${rakeUsd.toFixed(2)} |{' '}
                    <span className="font-semibold">Rake %:</span> {rakePercent}%
                  </p>
                  <p className="text-gray-300">
                    <span className="font-semibold">SOL Rake:</span> {rakeSol.toFixed(4)}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {log.endedAt?.toDate().toLocaleString() || 'Date unavailable'}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
};

export default AdminRake;
