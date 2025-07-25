"use strict";
import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import {
  collection, query, where, getDocs, updateDoc, doc, deleteDoc, addDoc,
  getDoc, orderBy, onSnapshot, serverTimestamp
} from 'firebase/firestore';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNavigate } from 'react-router-dom';
import ProfileView from '../components/profile/ProfileView';
import { checkUserHasEnoughBalance } from '../utils/BalanceGuard';

const ProfileManager = () => {
  const { connected, publicKey } = useWallet();
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [friends, setFriends] = useState([]);
  const [pendingContracts, setPendingContracts] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [solPrice, setSolPrice] = useState(0);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUsername, setCurrentUsername] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showChallengesModal, setShowChallengesModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [showContractsModal, setShowContractsModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [friendSearchId, setFriendSearchId] = useState('');
  const [searchedUser, setSearchedUser] = useState(null);
  const [pastOpponents, setPastOpponents] = useState([]);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [challengeOpponent, setChallengeOpponent] = useState(null);
  const [challengeGame, setChallengeGame] = useState('');
  const [challengeWager, setChallengeWager] = useState('');
  const navigate = useNavigate();

  const fetchFriends = async () => {
    if (!currentUserId) return;
    const q = query(collection(db, 'friends'), where('userId', '==', currentUserId));
    const snap = await getDocs(q);
    const friendsList = snap.docs
      .map(doc => {
        const data = doc.data();
        if (!data.friendId || !data.friendUsername) return null;
        return {
          id: data.friendId.trim(),
          username: data.friendUsername.trim()
        };
      })
      .filter(Boolean);
    setFriends(friendsList);
  };

  useEffect(() => {
    const unsubscribePresence = onSnapshot(collection(db, 'presence'), (snapshot) => {
      setOnlineUsers(snapshot.docs.map(doc => doc.data().userId?.trim()));
    });
    return () => unsubscribePresence();
  }, []);

  useEffect(() => {
    const fetchSolPrice = async () => {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
        const data = await res.json();
        setSolPrice(data.solana.usd);
      } catch (err) {
        console.error('Failed to fetch SOL price:', err);
      }
    };

    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setCurrentUserId(data.userId);
          setCurrentUsername(data.username);
    
          const qChallenges = query(
            collection(db, 'challenges'),
            where('opponentId', '==', data.userId),
            where('status', '==', 'pending')
          );
          const challengesSnap = await getDocs(qChallenges);
          const challengesList = await Promise.all(
            challengesSnap.docs.map(async (docSnap) => {
              const challenge = docSnap.data();
    
              const [canAfford, creatorHasFunds] = await Promise.all([
                checkUserHasEnoughBalance(challenge.opponentId, challenge.wager, solPrice),
                checkUserHasEnoughBalance(challenge.challengerId, challenge.wager, solPrice),
              ]);
    
              return {
                id: docSnap.id,
                ...challenge,
                canAfford,
                creatorHasFunds,
              };
            })
          );
          setActiveChallenges(challengesList);
    
          const qContracts = query(collection(db, 'contracts'), where('createdBy', '==', data.userId));
          const contractsSnap = await getDocs(qContracts);
          const contractsList = contractsSnap.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              amountUsd: data.amountUsd ?? 0,
              feePercent: data.feePercent ?? 0
            };
          });
          setPendingContracts(contractsList);
    
          const qRequests = query(collection(db, 'friendRequests'), where('receiverId', '==', data.userId));
          const requestsSnap = await getDocs(qRequests);
          setFriendRequests(requestsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
      }
    };
    

    fetchSolPrice();
    fetchUserData();
    fetchFriends();
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;
    const fetchPastOpponents = async () => {
      const q = query(
        collection(db, 'games'),
        where('players', 'array-contains', currentUserId),
        orderBy('timestamp', 'desc')
      );
      const snap = await getDocs(q);
      const seen = new Set();
      const opponents = [];

      for (const docSnap of snap.docs) {
        const game = docSnap.data();
        const opponentId = game.players.find(pid => pid !== currentUserId);

        if (opponentId && !seen.has(opponentId)) {
          seen.add(opponentId);

          try {
            const userDoc = await getDoc(doc(db, 'users', opponentId));
            const username = userDoc.exists() ? userDoc.data().username : "Unknown";
            opponents.push({ id: opponentId, username });
          } catch (err) {
            console.error("❌ Failed to fetch opponent:", opponentId, err);
          }
        }
      }

      setPastOpponents(opponents.slice(0, 10));
    };

    fetchPastOpponents();
  }, [currentUserId]);

  const handleAccept = async (challengeId) => {
    const ref = doc(db, 'challenges', challengeId);
    const challengeSnap = await getDoc(ref);
    if (!challengeSnap.exists()) return;
  
    const challenge = challengeSnap.data();
  
    // ✅ Check if current user has enough balance to accept the challenge
    const hasEnough = await checkUserHasEnoughBalance(currentUserId, challenge.wager, solPrice);
    if (!hasEnough) {
      alert("Insufficient balance to accept this challenge.");
      return;
    }
  
    await updateDoc(ref, { status: 'accepted' });
  
    const roomId = Math.floor(10000000 + Math.random() * 90000000).toString();
  
    const contractRef = await addDoc(collection(db, 'contracts'), {
      createdBy: challenge.challengerId,
      acceptedBy: challenge.opponentId,
      photonRoomCreator: auth.currentUser?.uid,
      roomId,
      game: challenge.game || 'Stand Off',
      wager: challenge.wager,
      amountUsd: challenge.wager,
      amountSol: parseFloat(challenge.amountSol) || 0,
      status: 'accepted',
      challengeRef: challengeId,
      players: [challenge.challengerId, challenge.opponentId],
      createdAt: serverTimestamp(),
    });
  
    setActiveChallenges(prev => prev.filter(c => c.id !== challengeId));
  
    navigate(`/game/${contractRef.id}?playerType=creator`);
  };
  

  const handleDecline = async (challengeId) => {
    await deleteDoc(doc(db, 'challenges', challengeId));
    setActiveChallenges(prev => prev.filter(c => c.id !== challengeId));
  };

  const handleCancelContract = async (contractId) => {
    await deleteDoc(doc(db, 'contracts', contractId));
    setPendingContracts(prev => prev.filter(c => c.id !== contractId));
  };

  const handleAcceptFriend = async (requestId, senderId, senderUsername) => {
    await addDoc(collection(db, 'friends'), { userId: currentUserId, friendId: senderId, friendUsername: senderUsername });
    await addDoc(collection(db, 'friends'), { userId: senderId, friendId: currentUserId, friendUsername: currentUsername });
    await deleteDoc(doc(db, 'friendRequests', requestId));
    setFriendRequests(prev => prev.filter(r => r.id !== requestId));
    fetchFriends();
  };

  const handleDeclineFriend = async (requestId) => {
    await deleteDoc(doc(db, 'friendRequests', requestId));
    setFriendRequests(prev => prev.filter(r => r.id !== requestId));
  };

  const handleSearchUser = async () => {
    const q = query(collection(db, 'users'), where('userId', '==', friendSearchId));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const user = snap.docs[0].data();
      setSearchedUser(user);
    } else {
      setSearchedUser(null);
      alert('User not found');
    }
  };

  const handleSendFriendRequest = async () => {
    if (searchedUser) {
      await addDoc(collection(db, 'friendRequests'), {
        senderId: currentUserId,
        senderUsername: currentUsername,
        receiverId: searchedUser.userId,
      });
      alert('Friend request sent!');
      setSearchedUser(null);
      setFriendSearchId('');
      setShowAddFriendModal(false);
    }
  };

  const handleSubmitChallenge = async () => {
    if (!challengeOpponent || !challengeGame || !challengeWager) return;
  
    const wagerUsd = parseFloat(challengeWager);
    if (isNaN(wagerUsd) || wagerUsd <= 0) {
      alert("Invalid wager amount.");
      return;
    }
  
    // ✅ Check sender balance
    const senderHasEnough = await checkUserHasEnoughBalance(currentUserId, wagerUsd, solPrice);
    if (!senderHasEnough) {
      alert("Insufficient balance to send challenge.");
      return;
    }
  
    // ✅ Check opponent balance
    const opponentHasEnough = await checkUserHasEnoughBalance(challengeOpponent, wagerUsd, solPrice);
    const amountSol = solPrice ? wagerUsd / solPrice : 0;
  
    await addDoc(collection(db, 'challenges'), {
      challengerId: currentUserId,
      challengerUsername: currentUsername,
      opponentId: challengeOpponent,
      game: challengeGame,
      wager: wagerUsd,
      amountSol,
      status: 'pending',
      forceActive: !opponentHasEnough, // ✅ Push to Active Challenges if they can't afford it
      createdAt: serverTimestamp(),
    });
  
    setShowChallengeModal(false);
    setChallengeOpponent(null);
    setChallengeGame('');
    setChallengeWager('');
  
    if (!opponentHasEnough) {
      alert("Challenge stored in opponent’s Active Challenges — they don’t have enough balance.");
    } else {
      alert("Challenge sent!");
    }
  };
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const solEquivalent = challengeWager && solPrice
    ? (parseFloat(challengeWager) / solPrice).toFixed(4)
    : "0.0000";

  return (
    <ProfileView
      connected={connected}
      publicKey={publicKey}
      currentUserId={currentUserId}
      currentUsername={currentUsername}
      copyToClipboard={copyToClipboard}
      activeChallenges={activeChallenges}
      pendingContracts={pendingContracts}
      handleAccept={handleAccept}
      handleDecline={handleDecline}
      handleCancelContract={handleCancelContract}
      setShowChallengesModal={setShowChallengesModal}
      setShowContractsModal={setShowContractsModal}
      onlineUsers={onlineUsers}
      friends={friends}
      friendRequests={friendRequests}
      searchedUser={searchedUser}
      friendSearchId={friendSearchId}
      setFriendSearchId={setFriendSearchId}
      setSearchedUser={setSearchedUser}
      handleAcceptFriend={handleAcceptFriend}
      handleDeclineFriend={handleDeclineFriend}
      handleSearchUser={handleSearchUser}
      handleSendFriendRequest={handleSendFriendRequest}
      setShowAddFriendModal={setShowAddFriendModal}
      setShowFriendsModal={setShowFriendsModal}
      setShowRequestsModal={setShowRequestsModal}
      setChallengeOpponent={setChallengeOpponent}
      setShowChallengeModal={setShowChallengeModal}
      showAddFriendModal={showAddFriendModal}
      pastOpponents={pastOpponents}
      challengeOpponent={challengeOpponent}
      challengeGame={challengeGame}
      challengeWager={challengeWager}
      setChallengeGame={setChallengeGame}
      setChallengeWager={setChallengeWager}
      showChallengesModal={showChallengesModal}
      showContractsModal={showContractsModal}
      showFriendsModal={showFriendsModal}
      showRequestsModal={showRequestsModal}
      showChallengeModal={showChallengeModal}
      handleSubmitChallenge={handleSubmitChallenge}
      solPrice={solPrice}
      solEquivalent={solEquivalent}
    />
  );
}; 

export default ProfileManager;