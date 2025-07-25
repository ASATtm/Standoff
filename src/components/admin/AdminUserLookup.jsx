// src/components/admin/AdminUserLookup.jsx
import React, { useState } from 'react';
import { db } from '../../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  getDoc,
  doc,
  deleteDoc
} from 'firebase/firestore';

const AdminUserLookup = () => {
  const [userId, setUserId] = useState('');
  const [userData, setUserData] = useState(null);
  const [lookupError, setLookupError] = useState(null);
  const [gameLogs, setGameLogs] = useState([]);
  const [logError, setLogError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [txError, setTxError] = useState(null);
  const [showTransactions, setShowTransactions] = useState(false);

  const handleLookup = async () => {
    setLookupError(null);
    setLogError(null);
    setTxError(null);
    setUserData(null);
    setGameLogs([]);
    setTransactions([]);
    setShowTransactions(false);
    try {
      const q = query(collection(db, 'users'), where('userId', '==', userId.trim()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const userDoc = snap.docs[0];
        const user = userDoc.data();
        setUserData({ ...user, _docId: userDoc.id });
        await fetchGameLogs(user.userId);
      } else {
        setLookupError('User not found.');
      }
    } catch (err) {
      setLookupError('Failed to fetch user.');
    }
  };

  const fetchGameLogs = async (targetId) => {
    try {
      const gameQ = query(
        collection(db, 'games'),
        where('players', 'array-contains', targetId),
        orderBy('timestamp', 'desc')
      );
      const snap = await getDocs(gameQ);
      const logs = await Promise.all(snap.docs.map(async (docSnap) => {
        const game = docSnap.data();
        const opponentId = game.players.find(pid => pid !== targetId);
        let opponentName = 'Unknown';
        try {
          const opDoc = await getDoc(doc(db, 'users', opponentId));
          if (opDoc.exists()) opponentName = opDoc.data().username;
        } catch {}
        return {
          id: docSnap.id,
          game: game.game,
          opponent: opponentName,
          timestamp: game.timestamp?.toDate()?.toLocaleString() || '—'
        };
      }));
      setGameLogs(logs);
    } catch {
      setLogError('⚠️ Failed to fetch game logs.');
    }
  };

  const fetchTransactions = async () => {
    setTxError(null);
    setTransactions([]);
    setShowTransactions(true);
    try {
      const txQ = collection(db, 'users', userData._docId, 'transactions');
      const snap = await getDocs(txQ);
      const txs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(txs);
    } catch {
      setTxError('⚠️ Failed to fetch transactions.');
    }
  };

  const handleDeleteUser = async () => {
    if (!userData?._docId) return;
    const confirm = window.confirm('Are you sure you want to permanently delete this user?');
    if (!confirm) return;
    try {
      await deleteDoc(doc(db, 'users', userData._docId));
      alert('✅ User deleted.');
      setUserData(null);
      setUserId('');
    } catch (err) {
      alert('❌ Failed to delete user.');
    }
  };

  return (
    <section className="bg-gray-900 rounded-xl p-4 shadow-lg">
      <h2 className="text-xl font-semibold mb-2 text-green-300">🔍 User Lookup</h2>
      <input
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        placeholder="Enter user ID..."
        className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700"
      />
      <button
        onClick={handleLookup}
        className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white"
      >
        Search
      </button>
      <div className="mt-4 text-sm text-gray-400">
        {lookupError && <p className="text-red-500">{lookupError}</p>}
        {userData && (
          <div className="space-y-2 mt-2">
            <p><span className="text-gray-300">Username:</span> {userData.username}</p>
            <p><span className="text-gray-300">Email:</span> {userData.email || '—'}</p>
            <p><span className="text-gray-300">Balance:</span> {userData.balance ?? 0} SOL</p>
            <p><span className="text-gray-300">Wallet:</span> {userData.wallet}</p>
            <p><span className="text-gray-300">SMS:</span> {userData.notificationSettings?.sms || '—'}</p>
            <p><span className="text-gray-300">Email Notif:</span> {userData.notificationSettings?.email || '—'}</p>

            <div className="mt-4">
              <h3 className="text-green-300 font-semibold mb-1">🕹️ Game Logs</h3>
              {logError && <p className="text-red-500">{logError}</p>}
              {gameLogs.length > 0 ? (
                <ul className="list-disc ml-4 space-y-1">
                  {gameLogs.map((log) => (
                    <li key={log.id}>
                      <span className="text-gray-300">{log.game}</span> vs <span className="text-white">{log.opponent}</span> @ <span className="text-gray-400">{log.timestamp}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                !logError && <p className="text-gray-500">No games found.</p>
              )}
            </div>

            <button
              onClick={fetchTransactions}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
            >
              💳 View Transactions
            </button>

            {txError && <p className="text-red-500">{txError}</p>}
            {showTransactions && (
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <h3 className="text-green-300 font-semibold">📄 Transactions</h3>
                  <button
                    onClick={() => setShowTransactions(false)}
                    className="text-sm text-gray-400 hover:text-red-500"
                  >
                    ❌ Close
                  </button>
                </div>
                {transactions.length > 0 ? (
                  <ul className="list-disc ml-4">
                    {transactions.map((tx) => (
                      <li key={tx.id}>
                        <span className="text-gray-300">{tx.type}</span> – {tx.amount} {tx.currency}
                        {tx.txSignature && (
                          <> – <a href={`https://explorer.solana.com/tx/${tx.txSignature}?cluster=devnet`} target="_blank" rel="noopener noreferrer" className="underline text-blue-400">TX</a></>
                        )}
                        <span className="text-gray-400"> @ {tx.timestamp?.toDate()?.toLocaleString() || '—'}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No transactions found.</p>
                )}
              </div>
            )}

            <button
              onClick={handleDeleteUser}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white"
            >
              🚫 Delete User
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default AdminUserLookup;
