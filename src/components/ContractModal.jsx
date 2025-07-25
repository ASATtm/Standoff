// src/components/ContractModal.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { checkUserHasEnoughBalance } from '../utils/BalanceGuard';
import { useToasts } from './ToastManager';

const GAMES = ['Stand Off', 'Catapult', 'Coin Toss', 'Steal', 'Duel'];

const ContractModal = ({ currentUserId, currentUsername, onClose }) => {
  const [selectedGame, setSelectedGame] = useState('');
  const [wager, setWager] = useState('');
  const [solPrice, setSolPrice] = useState(0);
  const { addToast } = useToasts();

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedGame || !wager.trim()) {
      addToast("Please select a game and enter a wager.");
      return;
    }

    const usdAmount = parseFloat(wager);

    if (isNaN(usdAmount) || usdAmount <= 0) {
      addToast("Invalid wager amount.");
      return;
    }

    console.log("⚠️ Calling checkUserHasEnoughBalance");
    const hasEnoughBalance = await checkUserHasEnoughBalance(currentUserId, usdAmount, solPrice);

    if (!hasEnoughBalance) {
      addToast("Insufficient balance to post");
      return;
    }

    const solEstimate = solPrice ? (usdAmount / solPrice) : 0;

    const contract = {
      game: selectedGame,
      amountUsd: usdAmount,
      amountSol: solEstimate,
      createdBy: currentUserId,
      createdByUsername: currentUsername,
      status: 'pending',
      type: 'manual',
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, 'contracts'), contract);

      await addDoc(collection(db, 'messages'), {
        type: 'contract',
        userId: currentUserId,
        username: currentUsername,
        game: selectedGame,
        wager: usdAmount.toFixed(2),
        creatorHasFunds: true,
        timestamp: serverTimestamp(),
      });

      onClose();
    } catch (error) {
      console.error('Failed to submit contract:', error);
      addToast('Error creating contract');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-md w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-white">Send Contract</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-white mb-1">Game</label>
            <select
              className="w-full p-2 rounded bg-gray-900 text-white"
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
              required
            >
              <option value="">Select a game</option>
              {GAMES.map((game) => (
                <option key={game} value={game}>{game}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-white mb-1">Wager (USD)</label>
            <input
              type="number"
              className="w-full p-2 rounded bg-gray-900 text-white"
              value={wager}
              onChange={(e) => setWager(e.target.value)}
              placeholder="$0"
              required
              min="1"
            />
            {wager && solPrice > 0 && (
              <div className="text-sm text-green-400 mt-1">
                ≈ {(parseFloat(wager) / solPrice).toFixed(4)} SOL
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-700 text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContractModal;
