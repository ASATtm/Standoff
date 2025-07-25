import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import {
  setDoc,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  onSnapshot,
  collection,
  addDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import Navbar from './components/Navbar';
import Navbar6 from './components/Navbar6';
import Home from './pages/HomeManager';
import Login from './pages/Login';
import Profile from './pages/ProfileManager';
import ChatPage from './pages/Chat';
import GamePage from './pages/game/GamePage.jsx';
import BalanceManager from './pages/BalanceManager';
import DepositPage from './pages/DepositPage';
import WithdrawPage from './pages/WithdrawPage';
import SettingsManager from './pages/SettingsManager';
import SettingsTransactions from './pages/SettingsTransactions';
import SettingsStats from './pages/SettingsStats';
import SettingsContact from './pages/SettingsContact';
import ChallengePopup from './components/ChallengePopup';
import ContractPopup from './components/ContractPopup';
import ChallengeAcceptedPopup from './components/ChallengeAcceptedPopup';
import StatsPopup from './components/StatsPopup';
import OpponentReadyPopup from './components/OpponentReadyPopup';
import AdminManager from './pages/AdminManager';
import AboutPage from './pages/AboutPage';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';
import { ToastProvider } from './components/ToastManager';
import PlayerSearch from './pages/PlayerSearch';
import { completeDuelPayout } from "./utils/duelPayout"; // Make sure this file exists


// Game list should match HomeManager
const games = [
  { id: 1, name: "Stand Off" },
  { id: 2, name: "Catapult" },
  { id: 3, name: "Coin Toss" },
  { id: 4, name: "Steal" },
  { id: 5, name: "Duel" },
];

function AppRouter() {
  const { publicKey } = useWallet();
  const [currentUid, setCurrentUid] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUsername, setCurrentUsername] = useState(null);
  const [incomingChallenge, setIncomingChallenge] = useState(null);
  const [incomingContract, setIncomingContract] = useState(null);
  const [incomingAcceptedChallenge, setIncomingAcceptedChallenge] = useState(null);
  const [showStatsForUid, setShowStatsForUid] = useState(null);

  // NEW: Keep selectedGame state at App level
  const [selectedGame, setSelectedGame] = useState(games[0]); // Default to Stand Off

  const navigate = useNavigate();

  useEffect(() => {
    let intervalId = null;
    const writePresenceAndEnsureRole = async (uid) => {
      try {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);
        const data = userSnap.exists() ? userSnap.data() : {};
        const userId = data.userId || uid;
        const username = data.username || 'Anonymous';
        if (!data.role) {
          await updateDoc(userRef, { role: 'user' });
        }
        setCurrentUserId(userId);
        setCurrentUsername(username);
        await setDoc(doc(db, 'presence', userId), {
          userId,
          username,
          lastActive: serverTimestamp(),
        });
      } catch (err) {
        console.error('❌ Failed to write presence or role:', err);
      }
    };
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (intervalId) clearInterval(intervalId);
      if (!user) {
        setCurrentUid(null);
        setCurrentUserId(null);
        return;
      }
      setCurrentUid(user.uid);
      writePresenceAndEnsureRole(user.uid);
      intervalId = setInterval(() => writePresenceAndEnsureRole(user.uid), 15000);
    });
    return () => {
      if (intervalId) clearInterval(intervalId);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    const unsub = onSnapshot(collection(db, 'challenges'), (snap) => {
      snap.docs.forEach((docSnap) => {
        const d = docSnap.data();
        if (d.challengerId === currentUserId && d.status === 'declined' && !d.declineNotified) {
          toast.success(`${d.opponentUsername || 'Opponent'} declined your challenge`);
          updateDoc(doc(db, 'challenges', docSnap.id), { declineNotified: true });
        }
      });
    });
    return () => unsub();
  }, [currentUserId]);

  useEffect(() => {
    const updateWallet = async () => {
      if (!publicKey || !auth.currentUser) return;
      const userRef = doc(db, 'users', auth.currentUser.uid);
      try {
        await updateDoc(userRef, {
          activeWallet: publicKey.toBase58(),
          wallets: arrayUnion(publicKey.toBase58()),
        });
      } catch (err) {
        console.error('❌ Failed to update wallet:', err);
      }
    };
    updateWallet();
  }, [publicKey]);

  useEffect(() => {
    if (!currentUserId) return;
  
    const unsub = onSnapshot(collection(db, 'challenges'), async (snap) => {
      for (const docSnap of snap.docs) {
        const d = docSnap.data();
  
        const isForCurrentUser = d.opponentId === currentUserId;
        const isPending = d.status === 'pending';
        const notSeenYet = d.seen !== true;
        const wasForceActive = d.forceActive === true;
  
        if (isForCurrentUser && isPending && notSeenYet && !wasForceActive) {
          const presenceRef = doc(db, 'presence', d.opponentId);
          const presenceSnap = await getDoc(presenceRef);
          const lastActive = presenceSnap.exists()
            ? presenceSnap.data().lastActive?.toMillis?.() || 0
            : 0;
  
          const isOnline = Date.now() - lastActive < 15000;
  
          if (isOnline) {
            setIncomingChallenge({ id: docSnap.id, ...d });
            await updateDoc(doc(db, 'challenges', docSnap.id), { seen: true });
          }
        }
      }
    });
  
    return () => unsub();
  }, [currentUserId]);
  


  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "gameResults"),
      (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === "added") {
            const data = change.doc.data();
            const contractId = data.contractId;
  
            if (!contractId) return;
  
            const contractRef = doc(db, "contracts", contractId);
            const contractSnap = await getDoc(contractRef);
            if (!contractSnap.exists()) return;
  
            const contract = contractSnap.data();
            if (contract.status === "completed") return;
  
            await completeDuelPayout(contractId, data.winnerId, data.loserId, contract);
          }
        });
      }
    );
  
    return () => unsub();
  }, []);
  

  // Only show contract popups for the currently selected game!
  useEffect(() => {
    if (!currentUserId || !selectedGame) return;
    // Poster/creator sees ContractPopup when contract is accepted and not started
    const unsub = onSnapshot(
      query(collection(db, 'contracts'), where('createdBy', '==', currentUserId)),
      (snap) => {
        snap.docs.forEach((docSnap) => {
          const d = docSnap.data();
          if (
            d.status === 'accepted' &&
            !d.gameStarted &&
            !d.popupShown &&
            d.game === selectedGame.name // <-- Only for current game!
          ) {
            setIncomingContract({ id: docSnap.id, ...d });
            updateDoc(doc(db, 'contracts', docSnap.id), { popupShown: true });
          }
        });
      }
    );
    return () => unsub();
  }, [currentUserId, selectedGame]);

  useEffect(() => {
    if (!currentUserId) return;
  
    const unsub = onSnapshot(
      query(collection(db, 'contracts'), where('createdBy', '==', currentUserId)),
      (snap) => {
        snap.docs.forEach((docSnap) => {
          const d = docSnap.data();
  
          if (
            d.status === 'accepted' &&
            !d.gameStarted &&
            !d.popupShown
          ) {
            // 🔧 Auto-set selected game to ensure correct popup
            const gameMatch = games.find(g => g.name === d.game);
            if (gameMatch) setSelectedGame(gameMatch);
  
            setIncomingContract({ id: docSnap.id, ...d });
            updateDoc(doc(db, 'contracts', docSnap.id), { popupShown: true });
          }
        });
      }
    );
    return () => unsub();
  }, [currentUserId]);
  

  useEffect(() => {
    if (!currentUserId) return;
  
    const unsub = onSnapshot(
      query(collection(db, 'contracts'), where('acceptedBy', '==', currentUserId)),
      (snap) => {
        snap.docs.forEach((docSnap) => {
          const d = docSnap.data();
          if (
            d.status === 'accepted' &&
            d.gameStarted === true &&
            !d.readyPopupShown
          ) {
            const gameMatch = games.find(g => g.name === d.game);
            if (gameMatch) setSelectedGame(gameMatch);
  
            setIncomingContract({ id: docSnap.id, ...d });
            updateDoc(doc(db, 'contracts', docSnap.id), { readyPopupShown: true });
          }
        });
      }
    );
  
    return () => unsub();
  }, [currentUserId]);
  


  useEffect(() => {
    if (!currentUserId) return;
    const unsub = onSnapshot(collection(db, 'challenges'), (snap) => {
      snap.docs.forEach((docSnap) => {
        const d = docSnap.data();
        if (d.challengerId === currentUserId && d.status === 'accepted' && !d.acceptedPopupShown) {
          setIncomingAcceptedChallenge({
            id: docSnap.id,
            ...d,
            accepterUsername: d.acceptedByUsername || d.opponentUsername || 'Opponent',
            accepterId: d.acceptedById || d.opponentId || 'unknown',
          });
          updateDoc(doc(db, 'challenges', docSnap.id), { acceptedPopupShown: true });
        }
      });
    });
    return () => unsub();
  }, [currentUserId]);
  
  // Keep incomingContract up to date with Firestore
  useEffect(() => {
    if (!incomingContract || !currentUserId) return;
    const unsub = onSnapshot(doc(db, 'contracts', incomingContract.id), (snap) => {
      const contract = snap.data();
      if (!contract) return;
      setIncomingContract((prev) =>
        prev && prev.id === snap.id ? { ...prev, ...contract } : prev
      );
    });
    return () => unsub();
  }, [incomingContract, currentUserId]);

  const handleCancelContract = async () => {
    if (!incomingContract) return;
    try {
      await updateDoc(doc(db, 'contracts', incomingContract.id), {
        status: 'canceled',
      });
    } catch (e) {
      console.error('❌ Failed to cancel contract:', e);
    }
    setIncomingContract(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-white">
      {incomingChallenge && (
        <ChallengePopup
          challengerUsername={incomingChallenge.challengerUsername}
          challengerId={incomingChallenge.challengerId}
          game={incomingChallenge.game}
          wager={incomingChallenge.wager}
          challengeId={incomingChallenge.id}
          currentUserId={currentUserId}
          onAccept={async () => {
            try {
              await updateDoc(doc(db, 'challenges', incomingChallenge.id), {
                status: 'accepted',
                acceptedPopupShown: false,
                acceptedByUsername: currentUsername || 'Opponent',
                acceptedById: currentUserId || auth.currentUser.uid,
              });
  
              const challengeSnap = await getDoc(doc(db, 'challenges', incomingChallenge.id));
              const challengeData = challengeSnap.data();
  
              const amountSolRaw = challengeData.amountSol;
              const parsedAmountSol = typeof amountSolRaw === 'string' ? parseFloat(amountSolRaw) : amountSolRaw;
  
              // ✅ Explicitly fixed contract creation logic (with "players" array clearly added)
              const contractRef = await addDoc(collection(db, 'contracts'), {
                createdBy: incomingChallenge.challengerId,
                acceptedBy: currentUserId,
                game: incomingChallenge.game || 'Stand Off',
                wager: incomingChallenge.wager,
                amountUsd: incomingChallenge.wager,
                amountSol: parseFloat(challengeData.amountSol) || 0,
                status: 'accepted',
                challengeRef: incomingChallenge.id,
                players: [incomingChallenge.challengerId, currentUserId], // ✅ Explicitly ensures correct matching
                createdAt: new Date(),
              });
  
              setIncomingChallenge(null);
              navigate(`/game/${contractRef.id}`);
            } catch (err) {
              console.error('❌ Error accepting challenge and creating contract:', err);
            }
          }}
          onDecline={async () => {
            await updateDoc(doc(db, 'challenges', incomingChallenge.id), {
              status: 'declined',
            });
            setIncomingChallenge(null);
          }}
          onStats={() => setShowStatsForUid(incomingChallenge.challengerId)}
          onClose={() => setIncomingChallenge(null)}
        />
      )}
  

      {/* Contract Accepted Popup for Poster/Creator */}
      {incomingContract &&
        incomingContract.status === 'accepted' &&
        incomingContract.createdBy === currentUserId &&
        !incomingContract.gameStarted &&
        incomingContract.game === selectedGame?.name && (
          <ContractPopup
            accepterUsername={incomingContract.acceptedByUsername || 'Opponent'}
            accepterId={incomingContract.acceptedBy || 'unknown'}
            game={incomingContract.game}
            wager={incomingContract.amountUsd || incomingContract.wager}
            contractId={incomingContract.id}
            onCancel={handleCancelContract}
          />
        )}

      {/* Opponent Ready Popup for Acceptor */}
      {incomingContract &&
        incomingContract.status === 'accepted' &&
        incomingContract.gameStarted &&
        incomingContract.acceptedBy === currentUserId &&
        incomingContract.game === selectedGame?.name && (
          <OpponentReadyPopup
            opponentUsername={incomingContract.createdByUsername || 'Opponent'}
            game={incomingContract.game}
            wager={incomingContract.amountUsd || incomingContract.wager}
            contractId={incomingContract.id}
            onClose={() => setIncomingContract(null)}
            onPlay={(contractId) => {
              navigate(`/game/${contractId}`);
              setIncomingContract(null);
            }}
          />
        )}

      {/* Challenge Accepted Popup (for challenge flow) */}
      {incomingAcceptedChallenge && (
        <ChallengeAcceptedPopup
          accepterUsername={incomingAcceptedChallenge.accepterUsername}
          accepterId={incomingAcceptedChallenge.accepterId}
          game={incomingAcceptedChallenge.game}
          wager={incomingAcceptedChallenge.wager}
          challengeId={incomingAcceptedChallenge.id}
          fetchContractForPlayers={async () => {
            console.log("🚨 Explicitly checking challengeRef:", incomingAcceptedChallenge.id);
          
            const q = query(
              collection(db, 'contracts'),
              where('challengeRef', '==', incomingAcceptedChallenge.id),
              where('status', '==', 'accepted')
            );
          
            const snapshot = await getDocs(q);
            console.log("📦 Explicit snapshot size:", snapshot.size);
          
            snapshot.forEach(doc => console.log("📑 Explicitly found doc:", doc.id, doc.data()));
          
            if (!snapshot.empty) {
              const contractId = snapshot.docs[0].id;
              console.log("✅ Explicitly found contractId:", contractId);
              // 🚨 REMOVE THIS LINE -> setIncomingAcceptedChallenge(null);
              return contractId;
            } else {
              console.warn("⚠️ Explicitly no contract found for challengeRef:", incomingAcceptedChallenge.id);
              return null;
            }
          }}          
        />
      )}

      {showStatsForUid && (
        <StatsPopup uid={showStatsForUid} onClose={() => setShowStatsForUid(null)} />
      )}

      <Routes>
        <Route path="/" element={
          <>
            <Navbar />
            <main className="flex-1 p-4 pb-24">
              {/* Pass selectedGame and setSelectedGame as props */}
              <Home
                selectedGame={selectedGame}
                setSelectedGame={setSelectedGame}
              />
            </main>
            <Navbar6 />
          </>
        } />
        <Route path="/login" element={<main className="flex-1 p-4 pb-24"><Login /></main>} />
        <Route path="/profile" element={<main className="flex-1 p-4 pb-24"><Profile /></main>} />
        <Route path="/chat" element={<><Navbar /><main className="flex-1 p-4 pb-24"><ChatPage /></main><Navbar6 /></>} />
        <Route path="/game/:gameId" element={<main className="flex-1 p-4 pb-24"><GamePage /></main>} />
        <Route path="/balance" element={<main className="flex-1 p-4 pb-24"><BalanceManager /></main>} />
        <Route path="/deposit" element={<main className="flex-1 p-4 pb-24"><DepositPage /></main>} />
        <Route path="/withdraw" element={<main className="flex-1 p-4 pb-24"><WithdrawPage /></main>} />
        <Route path="/settings" element={<main className="flex-1 p-4 pb-24"><SettingsManager /></main>} />
        <Route path="/settings/transactions" element={<main className="flex-1 p-4 pb-24"><SettingsTransactions /></main>} />
        <Route path="/settings/stats" element={<main className="flex-1 p-4 pb-24"><SettingsStats /></main>} />
        <Route path="/settings/contact" element={<main className="flex-1 p-4 pb-24"><SettingsContact /></main>} />
        <Route path="/admin" element={<main className="flex-1 p-4 pb-24"><AdminManager /></main>} />
        <Route path="/about" element={<main className="flex-1 p-4 pb-24"><AboutPage /></main>} />
        <Route path="/player-search" element={<PlayerSearch />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Router>
        <AppRouter />
      </Router>
    </ToastProvider>
  );
}
