// src/pages/WithdrawPage.jsx
import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getAuth } from 'firebase/auth';
import { Link } from 'react-router-dom';
import { useToasts } from '../components/ToastManager';
import { encryptData } from '../utils/cryptoClient';
import { getPublicEncryptionKey } from '../config/publicKey';
import Starfield from '../components/Starfield';

const WithdrawPage = () => {
  const { publicKey, connected } = useWallet();
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');
  const [balance, setBalance] = useState(null);
  const [uid, setUid] = useState(null);
  const { addToast } = useToasts();
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      setStatus('You must be logged in.');
      return;
    }
    setUid(user.uid);

    user.getIdTokenResult().then((idTokenResult) => {
      setIsAdmin(!!idTokenResult.claims.admin);
    });

    const fetchBalance = async () => {
      try {
        const res = await fetch(`/api/user/${user.uid}/balance`);
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        const json = await res.json();
        setBalance(json.balance);
      } catch (err) {
        console.error('Error fetching balance:', err);
        setBalance(null);
        setStatus('Unable to fetch balance.');
      }
    };

    const fetchPendingWithdrawals = async () => {
      try {
        const res = await fetch('/api/withdraw/pending');
        const json = await res.json();
        setPendingWithdrawals(json || []);
      } catch (err) {
        console.error('Error fetching pending withdrawals:', err);
      }
    };

    fetchBalance();
    if (isAdmin) fetchPendingWithdrawals();
  }, [isAdmin]);

  const handleWithdraw = async () => {
    const withdrawAmount = Number(amount);

    if (!withdrawAmount || isNaN(withdrawAmount) || withdrawAmount <= 0) {
      setStatus('Enter a valid amount.');
      return;
    }

    if (balance !== null && withdrawAmount > balance) {
      setStatus(`❌ Cannot withdraw ${withdrawAmount} SOL. Your balance is only ${balance} SOL.`);
      return;
    }

    if (!connected || !publicKey) {
      setStatus('Connect your wallet.');
      return;
    }

    if (!uid) {
      setStatus('User ID not available.');
      return;
    }

    setStatus('Encrypting & submitting withdrawal...');

    try {
      const pubKey = await getPublicEncryptionKey();
      const payload = encryptData(
        {
          uid,
          amount: withdrawAmount,
          toWallet: publicKey.toBase58(),
        },
        pubKey
      );

      const response = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload }),
      });

      const result = await response.json();
      if (!response.ok) {
        setStatus(`❌ Withdrawal failed: ${result.error || 'Unknown error'}`);
        return;
      }

      const txId = result.signature || result.txSignature;
      if (result.status === 'pending') {
        addToast('🕓 Withdrawal pending. View it under Settings > Transactions');
      }

      setStatus(
        result.status === 'pending'
          ? '🕓 Withdraw request submitted for approval.'
          : `✅ Withdrawal successful. TX: ${txId?.slice(0, 8)}`
      );

      setBalance((prev) => prev - withdrawAmount);
    } catch (err) {
      console.error('Withdrawal failed:', err);
      setStatus('❌ Error submitting withdrawal.');
    }
  };

  const handleApprove = async (docId) => {
    try {
      const res = await fetch('/api/withdraw/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Unknown error');
      addToast('✅ Withdrawal approved and processed.');
      setPendingWithdrawals((prev) => prev.filter((w) => w.id !== docId));
    } catch (err) {
      console.error('Error approving withdrawal:', err);
      addToast('❌ Error approving withdrawal.');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 relative overflow-hidden">
      <Starfield />
      <div className="relative z-10 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold text-green-400 mb-6">Withdraw SOL</h1>
        <p className="text-sm text-gray-400 mb-2">
          Current Balance: {balance !== null ? `${balance} SOL` : 'Unable to load'}
        </p>
        <div className="flex flex-col gap-4 w-full max-w-sm">
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="p-3 rounded bg-gray-700 text-white"
            placeholder="Enter amount in SOL"
          />
          <button
            onClick={handleWithdraw}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded text-lg"
          >
            Withdraw
          </button>
          {status && <p className="text-sm text-center text-yellow-400">{status}</p>}
          <Link
            to="/balance"
            className="bg-gray-700 hover:bg-gray-800 px-4 py-3 rounded text-center text-lg"
          >
            Back to Balance
          </Link>
        </div>

        {isAdmin && (
          <div className="mt-10">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">Pending Withdrawals (Admin)</h2>
            {pendingWithdrawals.map((w) => (
              <div key={w.id} className="bg-gray-800 p-4 rounded mb-2">
                <p><strong>User:</strong> {w.username}</p>
                <p><strong>Amount:</strong> {w.amount} SOL</p>
                <p><strong>To Wallet:</strong> {w.toWallet}</p>
                <button
                  onClick={() => handleApprove(w.id)}
                  className="mt-2 bg-green-600 hover:bg-green-700 px-3 py-2 rounded"
                >
                  Approve
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WithdrawPage;
