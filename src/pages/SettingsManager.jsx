import React from 'react';
import { Link } from 'react-router-dom';

const SettingsManager = () => {
  return (
    <div className="p-4 text-white">
      <h2 className="text-3xl font-bold text-green-400 mb-6">Settings</h2>

      <div className="mb-6">
        <Link
          to="/profile"
          className="inline-block bg-gray-700 hover:bg-gray-800 text-white text-sm px-4 py-2 rounded"
        >
          ← Back to Profile
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        <Link
          to="/settings/transactions"
          className="bg-gray-800 hover:bg-gray-700 px-4 py-3 rounded text-white text-lg"
        >
          Transaction History
        </Link>

        <Link
          to="/settings/stats"
          className="bg-gray-800 hover:bg-gray-700 px-4 py-3 rounded text-white text-lg"
        >
          View Stats
        </Link>

        <Link
          to="/settings/contact"
          className="bg-gray-800 hover:bg-gray-700 px-4 py-3 rounded text-white text-lg"
        >
          Contact Info
        </Link>
      </div>
    </div>
  );
};

export default SettingsManager;
