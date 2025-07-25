import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar6 = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <footer className="relative z-10 bg-gray-900 py-4 text-center border-t border-gray-800 mt-12">
      <div className="flex justify-center flex-wrap gap-3 mb-2">
        <Link
          to="/"
          className={`px-4 py-2 rounded-lg shadow-md font-semibold transition ${
            isActive('/')
              ? 'border-2 border-white bg-green-700'
              : 'bg-green-600 hover:bg-green-700'
          } text-white`}
        >
          Home
        </Link>
        <Link
          to="/profile"
          className={`px-4 py-2 rounded-lg shadow-md font-semibold transition ${
            isActive('/profile')
              ? 'border-2 border-white bg-green-700'
              : 'bg-green-600 hover:bg-green-700'
          } text-white`}
        >
          Profile
        </Link>
        <Link
          to="/chat"
          className={`px-4 py-2 rounded-lg shadow-md font-semibold transition ${
            isActive('/chat')
              ? 'border-2 border-white bg-green-700'
              : 'bg-green-600 hover:bg-green-700'
          } text-white`}
        >
          Chat
        </Link>
        <Link
          to="/about"
          className={`px-4 py-2 rounded-lg shadow-md font-semibold transition ${
            isActive('/about')
              ? 'border-2 border-white bg-green-700'
              : 'bg-green-600 hover:bg-green-700'
          } text-white`}
        >
          What is StandOff?
        </Link>
        <a
          href="https://example.com/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md font-semibold transition"
        >
          Privacy
        </a>
        <a
          href="https://example.com/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md font-semibold transition"
        >
          Terms
        </a>
      </div>
      <p className="text-sm mt-3 text-gray-400">&copy; 2025 Stand Off. All rights reserved.</p>
    </footer>
  );
};

export default Navbar6;