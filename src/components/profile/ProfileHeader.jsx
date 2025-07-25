"use strict";
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { auth, db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

const ProfileHeader = ({
  connected,
  publicKey,
  currentUserId,
  currentUsername,
  copyToClipboard
}) => {
  const [balance, setBalance] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) return;
      const ref = doc(db, 'users', auth.currentUser.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setBalance(data.balance || 0);
        setIsAdmin(data.role === 'admin');
      }
    };
    fetchUserData();
  }, []);

  return (
    <div className="flex justify-between items-start">
      {/* Left side: user info and buttons */}
      <div>
        <h2 className="text-3xl font-bold text-green-400 mb-4">Your Profile</h2>

        <div className="mb-4 space-y-2">
          {connected && publicKey ? (
            <>
              <div className="flex items-center gap-2 text-white">
                <span className="text-gray-400">Wallet:</span> {publicKey.toBase58()}
                <button
                  onClick={() => copyToClipboard(publicKey.toBase58())}
                  className="bg-gray-700 px-2 py-1 rounded text-sm"
                >
                  Copy
                </button>
              </div>

              <div className="flex items-center gap-2 text-white">
                <span className="text-gray-400">User ID:</span> {currentUserId}
                <button
                  onClick={() => copyToClipboard(currentUserId)}
                  className="bg-gray-700 px-2 py-1 rounded text-sm"
                >
                  Copy
                </button>
              </div>

              <p className="text-white">
                <span className="text-gray-400">Username:</span> {currentUsername}
              </p>
            </>
          ) : (
            <p className="text-red-400">Wallet not connected</p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <WalletMultiButton />
          <Link
            to="/settings"
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white text-sm"
          >
            Settings
          </Link>
          <Link
            to="/"
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white text-sm"
          >
            Go Home
          </Link>
          <Link
            to="/chat"
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white text-sm"
          >
            Chat
          </Link>
          <Link
            to="/player-search"
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white text-sm"
          >
            Player Search
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded text-white text-sm"
            >
              👑 Admin Mode
            </Link>
          )}
        </div>
      </div>

      {/* Right side: balance + edit */}
      <div className="text-right">
        <p className="text-white text-xl font-bold mb-2">
          {balance.toFixed(4)} <span className="text-green-400">SOL</span>
        </p>
        <Link
          to="/balance"
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white text-sm"
        >
          Edit Balance
        </Link>
      </div>
    </div>
  );
};

export default ProfileHeader;
