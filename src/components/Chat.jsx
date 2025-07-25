// src/components/Chat.jsx
import React, { useEffect, useRef, useState } from 'react';
import { db } from '../firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  getDoc,
  doc,
  updateDoc,
  getDocs,
} from 'firebase/firestore';
import ContractModal from './ContractModal';
import OnlineIndicator from './OnlineIndicator';
import StatsPopup from './StatsPopup';
import ContractPopup from './ContractPopup'; // if not already imported
import { auth } from '../firebase';
import { checkUserHasEnoughBalance } from '../utils/BalanceGuard';



const GAMES = ['Stand Off', 'Catapult', 'Coin Toss', 'Steal', 'Duel'];

const Chat = ({ currentUserId, currentUsername }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [challengeOpponentId, setChallengeOpponentId] = useState(null);
  const [challengeGame, setChallengeGame] = useState('');
  const [challengeWager, setChallengeWager] = useState('');
  const [solPrice, setSolPrice] = useState(0);
  const [selectedStatsUserId, setSelectedStatsUserId] = useState(null);
  const scrollRef = useRef(null);
  const [realUserId, setRealUserId] = useState(currentUserId);
  const [showContractPopup, setShowContractPopup] = useState(false);
  const [popupContractData, setPopupContractData] = useState(null);
  

  useEffect(() => {
    const fetchUserId = async () => {
      const snap = await getDoc(doc(db, 'users', currentUserId));
      if (snap.exists()) {
        setRealUserId(snap.data().userId || currentUserId);
      }
    };
    fetchUserId();
  }, [currentUserId]);

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });

    const presenceRef = collection(db, 'presence');
    const unsubscribePresence = onSnapshot(presenceRef, (snapshot) => {
      const now = Date.now();
      const uniqueIds = new Set();

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const last = data.lastActive?.toMillis?.();
        if (last && (now - last < 15000)) {
          uniqueIds.add(data.userId);
        }
      });

      setOnlineUsers(Array.from(uniqueIds));
    });

    return () => {
      unsubscribe();
      unsubscribePresence();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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

  useEffect(() => {
    if (!solPrice || messages.length === 0) return;
  
    const updateMessageBalanceFlags = async () => {
      const contractMsgs = messages.filter((m) => m.type === 'contract');
  
      for (const msg of contractMsgs) {
        const hasEnough = await checkUserHasEnoughBalance(
          msg.userId,
          parseFloat(msg.wager),
          solPrice
        );
  
        try {
          await updateDoc(doc(db, 'messages', msg.id), {
            creatorHasFunds: hasEnough,
          });
        } catch (err) {
          console.warn("⚠️ Could not update creatorHasFunds for message:", msg.id, err);
        }
      }
    };
  
    updateMessageBalanceFlags(); // Run once immediately
    const interval = setInterval(updateMessageBalanceFlags, 30000); // Every 30s
  
    return () => clearInterval(interval);
  }, [messages, solPrice]);
  


  const handleSend = async () => {
    if (!input.trim()) return;
    await addDoc(collection(db, 'messages'), {
      type: 'text',
      userId: realUserId,
      username: currentUsername,
      text: input.trim(),
      timestamp: serverTimestamp(),
    });
    setInput('');
  };


  const handleSubmitChallenge = async () => {
    if (!challengeGame || !challengeWager || isNaN(parseFloat(challengeWager))) {
      alert("Invalid challenge details.");
      return;
    }
  
    const wagerUsd = parseFloat(challengeWager);
  
    // ✅ Check YOUR balance
    const senderHasEnough = await checkUserHasEnoughBalance(realUserId, wagerUsd, solPrice);
    if (!senderHasEnough) {
      alert("Insufficient balance to send this challenge.");
      return;
    }
  
    // ✅ Check opponent balance
    const opponentHasEnough = await checkUserHasEnoughBalance(challengeOpponentId, wagerUsd, solPrice);
  
    const amountSol = solPrice ? wagerUsd / solPrice : 0;
  
    await addDoc(collection(db, 'challenges'), {
      challengerId: realUserId,
      challengerUsername: currentUsername,
      opponentId: challengeOpponentId,
      game: challengeGame,
      wager: wagerUsd,
      amountSol,
      status: 'pending',
      forceActive: !opponentHasEnough, // Optional: use in UI later
      createdAt: serverTimestamp(),
    });
  
    setShowChallengeModal(false);
    setChallengeOpponentId(null);
    setChallengeGame('');
    setChallengeWager('');
  
    if (!opponentHasEnough) {
      alert("Challenge stored in opponent’s Active Challenges — they don’t have enough balance.");
    } else {
      alert("Challenge sent!");
    }
  };
  


  const handleAcceptContract = async (msg) => {
    try {
      const wagerUsd = parseFloat(msg.wager);
      const hasEnough = await checkUserHasEnoughBalance(realUserId, wagerUsd, solPrice);
  
      if (!hasEnough) {
        alert("Insufficient balance to accept this contract.");
        return;
      }
  
      const roomId = Math.floor(10000000 + Math.random() * 90000000).toString();
  
      const contractRef = await addDoc(collection(db, 'contracts'), {
        createdBy: msg.userId,
        acceptedBy: realUserId,
        photonRoomCreator: auth.currentUser?.uid,
        roomId,
        game: msg.game,
        wager: wagerUsd,
        amountUsd: wagerUsd,
        amountSol: wagerUsd / solPrice,
        status: 'accepted',
        popupShown: false,
        players: [msg.userId, realUserId],
        createdAt: new Date(),
      });
  
      alert('✅ Contract accepted!');
    } catch (err) {
      console.error("❌ Failed to create contract for popup:", err);
      alert("Failed to accept contract.");
    }
  };
  
  
  
  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg overflow-hidden relative">
      {showModal && (
        <ContractModal
          currentUserId={realUserId}
          currentUsername={currentUsername}
          onClose={() => setShowModal(false)}
        />
      )}
  
      {showContractPopup && popupContractData ? (
        <ContractPopup
          contractId={popupContractData.contractId}
          accepterId={popupContractData.accepterId}
          accepterUsername={popupContractData.accepterUsername}
          game={popupContractData.game}
          wager={popupContractData.wager}
          playerType={popupContractData.playerType}
          onCancel={() => {
            setShowContractPopup(false);
            setPopupContractData(null);
          }}
          onClose={() => {
            setShowContractPopup(false);
            setPopupContractData(null);
          }}
        />
      ) : null}
  
      
      {showChallengeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-md w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-white">Challenge Opponent</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleSubmitChallenge(); }} className="space-y-4">
              <div>
                <label className="block text-sm text-white mb-1">Game</label>
                <select
                  value={challengeGame}
                  onChange={(e) => setChallengeGame(e.target.value)}
                  className="w-full p-2 rounded bg-gray-900 text-white"
                  required
                >
                  <option value="">Select a game</option>
                  {GAMES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-white mb-1">Wager (USD)</label>
                <input
                  type="number"
                  value={challengeWager}
                  onChange={(e) => setChallengeWager(e.target.value)}
                  className="w-full p-2 rounded bg-gray-900 text-white"
                  placeholder="$0"
                  required
                  min="1"
                />
                {challengeWager && solPrice > 0 && (
                  <div className="text-sm text-green-400 mt-1">
                    ≈ {(parseFloat(challengeWager) / solPrice).toFixed(4)} SOL
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowChallengeModal(false)}
                  className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-700 text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Send Challenge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="text-green-400 text-sm px-4 py-2 border-b border-gray-700">
        Online Users: {onlineUsers.length}
      </div>

      <div className="flex-1 px-4 py-2">
        <div
          ref={scrollRef}
          className="bg-gray-800 rounded-md h-[500px] overflow-y-auto p-4 border border-gray-700 flex flex-col-reverse space-y-reverse space-y-2"
        >
          {[...messages].reverse().map((msg) => (
            <div
              key={msg.id}
              className="bg-gray-700 p-2 rounded text-white flex justify-between items-center"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{msg.username || msg.userId}</span>
                  <OnlineIndicator uid={msg.userId} />
                </div>
                {msg.type === 'contract' ? (
                  <span className="text-purple-400">
                    {msg.text || `🎯 Proposed a contract – ${msg.game}, Wager: $${msg.wager}`}
                  </span>
                ) : (
                  msg.text
                )}
              </div>

              {msg.userId !== realUserId && (
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => setSelectedStatsUserId(msg.userId)}
                    className="text-sm bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded"
                  >
                    Stats
                  </button>
                  <button
                    onClick={() => {
                      setChallengeOpponentId(msg.userId);
                      setShowChallengeModal(true);
                    }}
                    className="text-sm bg-green-600 hover:bg-green-700 px-2 py-1 rounded"
                  >
                    Challenge
                  </button>
                  {msg.type === 'contract' && (
  <>
    <button
      onClick={() => handleAcceptContract(msg)}
      disabled={msg.creatorHasFunds === false}
      className={`text-sm px-2 py-1 rounded ${
        msg.creatorHasFunds === false
          ? 'bg-gray-600 cursor-not-allowed opacity-50'
          : 'bg-yellow-600 hover:bg-yellow-700'
      }`}
      title={msg.creatorHasFunds === false ? 'Creator has insufficient balance' : 'Accept/Play'}
    >
      {msg.creatorHasFunds === false ? 'Creator lacks funds' : 'Accept/Play'}
    </button>
    {msg.creatorHasFunds === false && (
      <div className="text-red-400 text-xs mt-1">
        ❌ Creator no longer has enough balance to fund this contract.
      </div>
    )}
  </>
)}

                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-2 mt-auto bg-gray-950 border-t border-gray-800">
        <div className="border border-gray-700 p-3 rounded-lg flex flex-col gap-3 bg-gray-900">
          <div className="text-green-400 text-sm">Online Users: {onlineUsers.length}</div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded text-white text-sm"
            >
              Send Contract
            </button>
            <input
              type="text"
              className="flex-1 p-2 rounded bg-gray-800 text-white"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
            />
            <button
              onClick={handleSend}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {selectedStatsUserId && (
        <StatsPopup uid={selectedStatsUserId} onClose={() => setSelectedStatsUserId(null)} />
      )}
    </div>
  );
};

export default Chat;
