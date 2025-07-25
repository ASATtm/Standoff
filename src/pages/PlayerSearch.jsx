import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import Starfield from '../components/Starfield';
import StatsPopup from '../components/StatsPopup';

const games = ['Duel', 'Stand Off', 'Steal', 'Catapult', 'Coin Toss'];

const PlayerSearch = () => {
  const [userIdInput, setUserIdInput] = useState('');
  const [searchedUser, setSearchedUser] = useState(null);
  const [wager, setWager] = useState('');
  const [selectedGame, setSelectedGame] = useState('Duel');
  const [solPrice, setSolPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
        const data = await res.json();
        setSolPrice(data.solana.usd);
      } catch (err) {
        console.error('Failed to fetch SOL price', err);
      }
    };
    fetchPrice();
  }, []);

  const handleSearch = async () => {
    setSearchedUser(null);
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('userId', '==', userIdInput.trim()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const data = snap.docs[0].data();
        setSearchedUser(data);
      } else {
        alert('User not found');
      }
    } catch (err) {
      console.error('Search error:', err);
      alert('Search failed');
    }
    setLoading(false);
  };

  const handleChallenge = async () => {
    if (!searchedUser || !wager || isNaN(parseFloat(wager)) || parseFloat(wager) <= 0) {
      alert('Enter a valid wager amount');
      return;
    }

    const challenger = auth.currentUser;
    if (!challenger) return alert('Not logged in');

    const currentRef = doc(db, 'users', challenger.uid);
    const userSnap = await getDoc(currentRef);
    if (!userSnap.exists()) return alert('User data not found');
    const challengerData = userSnap.data();

    const wagerUsd = parseFloat(wager);
    const amountSol = solPrice ? wagerUsd / solPrice : 0;

    const challenge = {
      challengerId: challengerData.userId,
      challengerUsername: challengerData.username,
      opponentId: searchedUser.userId,
      opponentUsername: searchedUser.username,
      game: selectedGame,
      wager: wagerUsd,
      amountSol,
      status: 'pending',
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, 'challenges'), challenge);
    alert('Challenge sent!');
    setUserIdInput('');
    setSearchedUser(null);
    setWager('');
  };

  const renderBalanceTier = (balance) => {
    if (balance >= 4) return '++3';
    if (balance >= 3) return '+3';
    if (balance >= 2) return '+2';
    if (balance >= 1) return '+1';
    return '-1';
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 relative overflow-hidden">
      <Starfield />

      {/* Page Content */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold text-green-400 mb-6">🔎 Player Search</h1>

        <button
          onClick={() => navigate('/profile')}
          className="absolute top-6 left-6 bg-gray-800 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded"
        >
          ← Back to Profile
        </button>

        <div className="bg-gray-900 p-6 rounded-lg shadow-md w-full max-w-md">
          <input
            type="text"
            value={userIdInput}
            onChange={(e) => setUserIdInput(e.target.value)}
            placeholder="Enter User ID..."
            className="w-full p-3 rounded bg-gray-800 text-white mb-4 border border-gray-700"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !userIdInput.trim()}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {searchedUser && (
          <div className="mt-8 bg-gray-900 p-6 rounded-lg shadow-md w-full max-w-md">
            <h2 className="text-xl font-bold text-green-300 mb-2">🎯 Found Player</h2>
            <p><span className="text-gray-400">Username:</span> {searchedUser.username}</p>
            <p><span className="text-gray-400">User ID:</span> {searchedUser.userId}</p>
            <p><span className="text-gray-400">Balance Tier:</span> {renderBalanceTier(searchedUser.balance ?? 0)}</p>

            <div className="mt-4">
              <label className="block text-sm text-white mb-1">Game</label>
              <select
                className="w-full p-2 rounded bg-gray-800 text-white mb-3"
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value)}
              >
                {games.map(game => (
                  <option key={game} value={game}>{game}</option>
                ))}
              </select>

              <label className="block text-sm text-white mb-1">Wager (USD)</label>
              <input
                type="number"
                value={wager}
                onChange={(e) => setWager(e.target.value)}
                placeholder="$0"
                className="w-full p-2 rounded bg-gray-800 text-white"
              />
              {wager && solPrice > 0 && (
                <div className="text-sm text-green-400 mt-1">
                  ≈ {(parseFloat(wager) / solPrice).toFixed(4)} SOL
                </div>
              )}
              <button
                onClick={handleChallenge}
                className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded"
              >
                Send Challenge
              </button>
              <button
                onClick={() => setShowStats(true)}
                className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
              >
                View Stats
              </button>
            </div>
          </div>
        )}
      </div>

      {showStats && searchedUser && (
        <StatsPopup uid={searchedUser.userId} onClose={() => setShowStats(false)} />
      )}
    </div>
  );
};

export default PlayerSearch;