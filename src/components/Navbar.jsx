import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const Navbar = () => {
  const location = useLocation();
  const { connected, publicKey, disconnect } = useWallet();
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!auth.currentUser) return;
      const ref = doc(db, 'users', auth.currentUser.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setBalance(data.balance || 0);
      }
    };
    fetchBalance();
  }, [auth.currentUser]);

  return (
    <div className="w-full bg-gray-900 text-white px-4 py-3 flex justify-between items-center shadow-md relative z-10">
      <h1 className="text-2xl font-bold text-green-400">Stand Off</h1>

      <div className="flex items-center space-x-4">
        <span className="text-sm text-white font-bold">
          Balance: {balance.toFixed(4)} <span className="text-green-400">SOL</span>
        </span>

        {location.pathname === '/' && (
          <Link
            to="/login"
            className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
          >
            Log in / Connect Wallet
          </Link>
        )}

        {location.pathname === '/profile' && (
          connected && publicKey ? (
            <>
              <span className="text-green-400 text-sm">
                Connected: {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
              </span>
              <button
                onClick={disconnect}
                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm ml-2"
              >
                Log Out
              </button>
            </>
          ) : (
            <span className="text-red-400 text-sm">No wallet connected</span>
          )
        )}
      </div>
    </div>
  );
};

export default Navbar;
