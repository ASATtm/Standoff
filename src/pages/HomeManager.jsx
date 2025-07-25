"use client";
import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDoc,
  doc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  setDoc,
  serverTimestamp
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { query, where } from "firebase/firestore";
import HomeView from "../components/HomeView";
import { checkUserHasEnoughBalance } from "../utils/BalanceGuard";

const games = [
  { id: 1, name: "Stand Off", isAvailable: true },
  { id: 2, name: "Catapult", isAvailable: false },
  { id: 3, name: "Coin Toss", isAvailable: false },
  { id: 4, name: "Steal", isAvailable: false },
  { id: 5, name: "Duel", isAvailable: true },
];

const dummyLeaderboard = {
  "Stand Off": [
    { id: 1, username: "PlayerA", userId: "USER-PlayerA", winStreak: 3 },
    { id: 2, username: "PlayerB", userId: "USER-PlayerB", winStreak: 2 },
  ],
  "Catapult": [
    { id: 3, username: "PlayerC", userId: "USER-PlayerC", winStreak: 4 },
    { id: 4, username: "PlayerD", userId: "USER-PlayerD", winStreak: 3 },
  ],
  "Coin Toss": [
    { id: 5, username: "PlayerE", userId: "USER-PlayerE", winStreak: 1 },
  ],
  "Steal": [
    { id: 6, username: "PlayerF", userId: "USER-PlayerF", winStreak: 5 },
    { id: 7, username: "PlayerG", userId: "USER-PlayerG", winStreak: 2 },
  ],
  "Duel": [
    { id: 8, username: "PlayerH", userId: "USER-PlayerH", winStreak: 2 },
    { id: 9, username: "PlayerI", userId: "USER-PlayerI", winStreak: 1 },
  ],
};

const HomeManager = () => {
  const [selectedGame, setSelectedGame] = useState(games.find(g => g.isAvailable));
  const [challengeOpponent, setChallengeOpponent] = useState(null);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [usdAmount, setUsdAmount] = useState("");
  const [solEstimate, setSolEstimate] = useState(0);
  const [solPrice, setSolPrice] = useState(0);
  const [contracts, setContracts] = useState([]);
  const [sortDesc, setSortDesc] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUsername, setCurrentUsername] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [balanceCache, setBalanceCache] = useState({});


  useEffect(() => {
    const fetchSolPrice = async () => {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd");
        const data = await res.json();
        const price = data?.solana?.usd;
        if (!price || isNaN(price)) throw new Error("Invalid SOL price response");
        setSolPrice(price);
      } catch (err) {
        console.error("❌ Failed to fetch SOL price:", err);
        setSolPrice(0.0001); // fallback so balance check doesn’t break everything
      }
    };
  
    fetchSolPrice(); // load once initially
    const interval = setInterval(fetchSolPrice, 60000); // update every 60 seconds
    return () => clearInterval(interval);
  }, []);
  


  useEffect(() => {
    if (!usdAmount || solPrice === 0) {
      setSolEstimate(0);
      return;
    }
    const estimate = parseFloat(usdAmount) / solPrice;
    setSolEstimate(estimate);
  }, [usdAmount, solPrice]);

  useEffect(() => {
    if (!currentUserId) return;
  
    const q = query(
      collection(db, "contracts"),
      where("status", "==", "pending")
    );
    
  
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedContracts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setContracts(loadedContracts);
    });
  
    return () => unsubscribe();
  }, [currentUserId]);
  

  useEffect(() => {
    const fetchCurrentUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setCurrentUserId(data.userId);
          setCurrentUsername(data.username);
        } else {
          console.error("User document not found!");
        }
      }
    };
    fetchCurrentUserData();
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const presenceRef = doc(db, "presence", user.uid);

    const heartbeat = setInterval(() => {
      setDoc(presenceRef, {
        userId: currentUserId || user.uid,
        username: currentUsername || "Anonymous",
        lastActive: serverTimestamp(),
      });
    }, 30000);

    const handleUnload = async () => {
      try {
        await deleteDoc(presenceRef);
      } catch (err) {
        console.error("Failed to remove presence:", err);
      }
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearInterval(heartbeat);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [currentUserId, currentUsername]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "presence"), (snapshot) => {
      const now = Date.now();
      const onlineIds = snapshot.docs
        .filter(doc => {
          const ts = doc.data().lastActive;
          return ts && now - ts.toMillis() < 60000;
        })
        .map(doc => doc.data().userId);
      setOnlineUsers(onlineIds);
    });
    return () => unsubscribe();
  }, []);


  useEffect(() => {
    if (!solPrice || !contracts.length) return;
  
    const updateCreatorBalanceFlags = async () => {
      const updatedContracts = await Promise.all(
        contracts.map(async (c) => {
          if (!c.createdBy || typeof c.amountUsd !== "number") return c;
  
          const key = `${c.id}-${c.createdBy}`;
          if (balanceCache[key] !== undefined) return { ...c, creatorHasFunds: balanceCache[key] };
  
          const hasEnough = await checkUserHasEnoughBalance(c.createdBy, c.amountUsd, solPrice);
          setBalanceCache(prev => ({ ...prev, [key]: hasEnough }));
  
          if (c.creatorHasFunds !== hasEnough) {
            try {
              await updateDoc(doc(db, "contracts", c.id), { creatorHasFunds: hasEnough });
            } catch (err) {
              console.error("Failed to update contract status:", err);
            }
          }
  
          return { ...c, creatorHasFunds: hasEnough };
        })
      );
  
      setContracts(updatedContracts);
    };
  
    // ✅ Defer the first run to avoid blocking initial render
    const delayed = setTimeout(updateCreatorBalanceFlags, 100);
  
    // ✅ Then set up regular interval
    const interval = setInterval(updateCreatorBalanceFlags, 30000);
  
    return () => {
      clearTimeout(delayed);
      clearInterval(interval);
    };
  }, [contracts, solPrice]);
  
  

  const handleCreateContract = async () => {
    if (!selectedGame || !usdAmount || isNaN(parseFloat(usdAmount)) || !currentUserId) {
      alert("Please select a game and enter a valid wager.");
      return;
    }

    const wagerUsd = parseFloat(usdAmount);
    if (wagerUsd <= 0) {
      alert("Wager must be greater than 0.");
      return;
    }

    const hasEnough = await checkUserHasEnoughBalance(currentUserId, wagerUsd, solPrice);
    if (!hasEnough) {
      alert("Insufficient balance to post this contract.");
      return;
    }

    const newContract = {
      game: selectedGame.name,
      amountUsd: wagerUsd,
      amountSol: solEstimate,
      createdBy: currentUserId,
      status: "pending",
    };

    await addDoc(collection(db, "contracts"), newContract);
    setUsdAmount("");
    setSolEstimate(0);
  };

  const handleCancelContract = async (id) => {
    await deleteDoc(doc(db, "contracts", id));
    setContracts((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAcceptContract = async (id) => {
    try {
      const contractRef = doc(db, "contracts", id);
      const snap = await getDoc(contractRef);
      if (!snap.exists()) {
        alert("Contract not found.");
        return;
      }
  
      const contract = snap.data();
      const hasEnough = await checkUserHasEnoughBalance(currentUserId, contract.amountUsd, solPrice);
  
      if (!hasEnough) {
        alert("Insufficient balance to accept this contract.");
        return;
      }
  
      await updateDoc(contractRef, {
        status: "accepted",
        acceptedBy: currentUserId,
        acceptedAt: serverTimestamp(),
        popupShown: false
      });
    } catch (err) {
      console.error("❌ Failed to accept contract:", err);
    }
  };
  

  const handleChallenge = async (player) => {
    console.log("Challenge button clicked for:", player);
    if (!currentUserId || !currentUsername) {
      alert("You must be logged in to send a challenge.");
      return;
    }
    try {
      const wagerInput = prompt(`Enter wager in USD for ${player.username}:`);
      const wagerAmount = parseFloat(wagerInput);
  
      if (isNaN(wagerAmount) || wagerAmount <= 0) {
        alert("Invalid wager amount.");
        return;
      }
  
      const senderHasEnough = await checkUserHasEnoughBalance(currentUserId, wagerAmount, solPrice);
      if (!senderHasEnough) {
        alert("Insufficient balance to send this challenge.");
        return;
      }
  
      const opponentHasEnough = await checkUserHasEnoughBalance(player.userId, wagerAmount, solPrice);
      const amountSol = solPrice ? wagerAmount / solPrice : 0;
  
      await addDoc(collection(db, "challenges"), {
        challengerId: currentUserId,
        challengerUsername: currentUsername,
        opponentId: player.userId,
        opponentUsername: player.username,
        game: selectedGame.name,
        wager: wagerAmount,
        amountSol,
        status: "pending",
        forceActive: !opponentHasEnough,
        createdAt: new Date(),
      });
  
      if (!opponentHasEnough) {
        alert(`Challenge stored in ${player.username}'s Active Challenges — they don’t have enough balance.`);
      } else {
        alert(`Challenge sent to ${player.username}!`);
      }
    } catch (err) {
      console.error("Failed to send challenge:", err);
      alert("Failed to send challenge.");
    }
  };
  

  const filteredContracts = selectedGame
    ? contracts.filter(
        (c) =>
          c.game === selectedGame.name &&
          (!c.status || c.status !== "accepted" || c.gameStarted !== true)
      )
    : [];

  return (
    <HomeView
      games={games}
      selectedGame={selectedGame}
      setSelectedGame={setSelectedGame}
      usdAmount={usdAmount}
      setUsdAmount={setUsdAmount}
      solEstimate={solEstimate}
      contracts={filteredContracts}
      sortDesc={sortDesc}
      setSortDesc={setSortDesc}
      handleCreateContract={handleCreateContract}
      handleCancelContract={handleCancelContract}
      handleAcceptContract={handleAcceptContract}
      handleChallenge={handleChallenge}
      dummyLeaderboard={dummyLeaderboard}
      currentUserId={currentUserId}
      onlineUsers={onlineUsers}
      solPrice={solPrice}
      challengeOpponent={challengeOpponent}
      setChallengeOpponent={setChallengeOpponent}
      showChallengeModal={showChallengeModal}
      setShowChallengeModal={setShowChallengeModal}
    />
  );
};

export default HomeManager;