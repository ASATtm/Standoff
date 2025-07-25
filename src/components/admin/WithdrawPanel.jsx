// src/components/admin/WithdrawPanel.jsx
import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';

const WithdrawPanel = () => {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'withdraws'), async (snap) => {
      const enriched = await Promise.all(
        snap.docs
          .map(docSnap => ({ id: docSnap.id, uid: docSnap.data().uid, ...docSnap.data() }))
          .filter(w => w.status === 'pending')
          .map(async (w) => {
            try {
              const userSnap = await getDoc(doc(db, 'users', w.userId));
              const balance = userSnap.exists() ? userSnap.data().balance || 0 : '—';
              return { ...w, balance };
            } catch {
              return { ...w, balance: '—' };
            }
          })
      );
      setRequests(enriched);
    });
    return () => unsub();
  }, []);

  const handleApprove = async (id) => {
    await updateDoc(doc(db, 'withdraws', id), {
      status: 'approved',
      approvedAt: serverTimestamp()
    });

    try {
      console.log('📦 Calling backend with docId:', id);
      const res = await fetch('/api/withdraw/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docId: id })
      });
      const result = await res.json();
      console.log('✅ Admin transfer result:', result);
    } catch (err) {
      console.error('❌ Admin approve failed:', err);
    }
  };

  const handleDeny = async (id) => {
    const options = [
      'Wallet mismatch',
      'Unusual activity',
      'Insufficient wagering',
      'Violation of terms',
      'Custom...'
    ];

    const menu = document.createElement('select');
    options.forEach(opt => {
      const o = document.createElement('option');
      o.text = opt;
      o.value = opt;
      menu.appendChild(o);
    });

    menu.onchange = async () => {
      let reason = menu.value;
      if (reason === 'Custom...') {
        reason = prompt('Enter custom denial reason:');
      }
      if (!reason) return;
      await updateDoc(doc(db, 'withdraws', id), {
        status: 'denied',
        deniedAt: serverTimestamp(),
        reason
      });
      document.body.removeChild(menu);
    };

    Object.assign(menu.style, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 9999,
      padding: '0.5rem',
      fontSize: '1rem'
    });

    document.body.appendChild(menu);
    menu.focus();
  };

  return (
    <div className="bg-gray-900 text-white p-6 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-green-400 mb-4">💸 Pending Withdrawals</h2>
      {requests.length === 0 ? (
        <p className="text-gray-400">No pending requests.</p>
      ) : (
        <div className="max-h-[500px] overflow-y-auto pr-2">
          <ul className="space-y-4">
            {requests.map((req) => (
              <li key={req.id} className="border-b border-gray-700 pb-4">
                <p><span className="text-green-300">User:</span> {req.username} ({req.userId})</p>
                <p><span className="text-green-300">Balance:</span> {req.balance} SOL</p>
                <p><span className="text-green-300">Wallet:</span> {req.toWallet}</p>
                <p><span className="text-green-300">Amount:</span> {req.amount} SOL</p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => handleApprove(req.id)}
                    className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleDeny(req.id)}
                    className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
                  >
                    Deny
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default WithdrawPanel;
