// src/pages/BalanceManager.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Starfield from '../components/Starfield';

const BalanceManager = () => {
  return (
    <div className="min-h-screen bg-black text-white p-8 relative overflow-hidden">
      <Starfield />

      <div className="relative z-10 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold text-green-400 mb-6">Manage Balance</h1>

        <div className="flex flex-col gap-4 w-full max-w-sm">
          <Link
            to="/deposit"
            className="bg-green-600 hover:bg-green-700 px-4 py-3 rounded text-center text-lg"
          >
            Deposit
          </Link>
          <Link
            to="/withdraw"
            className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded text-center text-lg"
          >
            Withdraw
          </Link>
          <Link
            to="/profile"
            className="bg-gray-700 hover:bg-gray-800 px-4 py-3 rounded text-center text-lg"
          >
            Back to Profile
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BalanceManager;
