// src/pages/DepositPage.jsx
import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { depositSol } from '../utils/solana';
import { Link } from 'react-router-dom';
import Starfield from '../components/Starfield';

const DepositPage = () => {
  const { publicKey, connected, signTransaction } = useWallet();
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');

  const handleDeposit = async () => {
    try {
      if (!amount || isNaN(amount) || Number(amount) <= 0) {
        setStatus('Enter a valid amount.');
        return;
      }
      setStatus('Processing deposit...');
      const signature = await depositSol(Number(amount), { publicKey, signTransaction });
      setStatus(`✅ Deposit successful! TX: ${signature.slice(0, 8)}...`);
    } catch (err) {
      console.error(err);
      setStatus('❌ Deposit failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 relative overflow-hidden">
      <Starfield />
      <div className="relative z-10 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold text-green-400 mb-6">Deposit SOL</h1>
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
            onClick={handleDeposit}
            className="bg-green-600 hover:bg-green-700 px-4 py-3 rounded text-lg"
          >
            Deposit
          </button>
          {status && <p className="text-sm text-center text-yellow-400">{status}</p>}
          <Link
            to="/balance"
            className="bg-gray-700 hover:bg-gray-800 px-4 py-3 rounded text-center text-lg"
          >
            Back to Balance
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DepositPage;