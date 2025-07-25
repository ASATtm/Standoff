// src/components/RegisterModal.jsx
import React, { useState, useEffect } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';

const RegisterModal = ({ onClose, onComplete }) => {
  const { connected, publicKey } = useWallet();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!email || !username) {
      alert('Email and Username are required!');
      return;
    }
    const generatedId = 'USER-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    setUserId(generatedId);
    setSubmitted(true);
  };

  useEffect(() => {
    if (connected && publicKey && submitted) {
      const userData = {
        email,
        phone,
        username,
        userId,
        walletAddress: publicKey.toBase58(),
      };
      console.log('✅ Registered user:', userData);
      onComplete(userData);
      onClose();
    }
  }, [connected, publicKey, submitted, email, phone, username, userId, onComplete, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-96 text-white relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-xl">×</button>
        <h2 className="text-xl font-bold mb-4">Register to Play</h2>
        {!submitted ? (
          <>
            <label className="block mb-1">Email (required)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-black p-2 rounded mb-2"
            />
            <label className="block mb-1">Phone (optional)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Optional, but recommended"
              className="w-full text-black p-2 rounded mb-2"
            />
            <label className="block mt-3 mb-1">Username (required)</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full text-black p-2 rounded mb-2"
            />
            <button
              onClick={handleSubmit}
              className="bg-green-600 hover:bg-green-700 w-full py-2 mt-4 rounded"
            >
              Submit
            </button>
          </>
        ) : (
          <>
            <p className="mt-4">Now connect your wallet:</p>
            <WalletMultiButton className="mt-2" />
          </>
        )}
      </div>
    </div>
  );
};

export default RegisterModal;