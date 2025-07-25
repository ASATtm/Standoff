import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import {
  collection,
  query,
  orderBy,
  getDocs,
  where
} from 'firebase/firestore';
import { Link } from 'react-router-dom';

const SettingsTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [withdraws, setWithdraws] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const uid = user.uid;

        const txRef = collection(db, 'users', uid, 'transactions');
        const txQ = query(txRef, orderBy('timestamp', 'asc'));
        const txSnap = await getDocs(txQ);
        const rawTxs = txSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        let balance = 0;
        const computed = rawTxs.map((tx) => {
          const amt = parseFloat(tx.amount || tx.amountSol || 0);
          const change = ['deposit', 'release', 'game won'].includes(tx.type) ? amt : -amt;
          balance += change;

          return {
            ...tx,
            runningBalance: balance
          };
        }).reverse();

        const wdQ = query(collection(db, 'withdraws'), where('uid', '==', uid));
        const wdSnap = await getDocs(wdQ);
        const wds = wdSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        wds.sort((a, b) => b.createdAt?.toMillis?.() - a.createdAt?.toMillis?.());

        setTransactions(computed);
        setWithdraws(wds);
      } catch (err) {
        console.error("❌ Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="p-6">
      <Link
        to="/settings"
        className="inline-block bg-gray-700 hover:bg-gray-800 text-white text-sm px-4 py-2 rounded mb-4"
      >
        ← Back to Settings
      </Link>

      <h2 className="text-3xl font-bold text-green-400 mb-4">Transaction History</h2>

      {loading ? (
        <p className="text-gray-400">Loading transactions...</p>
      ) : (
        <>
          <table className="w-full border border-gray-700 text-sm text-left mb-10">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="p-2">Type</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Currency</th>
                <th className="p-2">Date</th>
                <th className="p-2">Opponent</th>
                <th className="p-2 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id} className="border-t border-gray-700">
                  <td className="p-2 capitalize">{tx.type}</td>
                  <td
                    className={`p-2 ${
                      ['deposit', 'release', 'game won'].includes(tx.type)
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}
                  >
                    {['deposit', 'release', 'game won'].includes(tx.type) ? '+' : '-'}
                    {tx.amountUsd
                      ? `${tx.amountUsd.toFixed(2)} USD (${tx.amountSol.toFixed(4)} SOL)`
                      : tx.amount}
                  </td>
                  <td className="p-2">{tx.currency || 'SOL'}</td>
                  <td className="p-2">{tx.timestamp?.toDate().toLocaleString() || '—'}</td>
                  <td className="p-2">{tx.opponent || '—'}</td>
                  <td className="p-2 text-right text-white">{tx.runningBalance.toFixed(4)} SOL</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 className="text-2xl font-bold text-yellow-400 mb-2">Pending Withdrawals</h3>
          {withdraws.length === 0 ? (
            <p className="text-gray-500">No pending withdrawals.</p>
          ) : (
            <ul className="space-y-3">
              {withdraws.map(wd => (
                <li
                  key={wd.id}
                  className="border border-gray-700 p-3 rounded bg-gray-800"
                >
                  <p><span className="text-gray-300">Amount:</span> {wd.amount} SOL</p>
                  <p><span className="text-gray-300">Wallet:</span> {wd.toWallet || '—'}</p>
                  <p>
                    <span className="text-gray-300">Status:</span>{' '}
                    {wd.status === 'pending' && <span className="text-yellow-400">Pending</span>}
                    {wd.status === 'approved' && <span className="text-green-400">Approved</span>}
                    {wd.status === 'denied' && <span className="text-red-400">Denied — {wd.reason || 'No reason provided'}</span>}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
};

export default SettingsTransactions;
