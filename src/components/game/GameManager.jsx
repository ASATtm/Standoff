import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  doc, getDoc, serverTimestamp, increment, runTransaction, collection
} from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { incrementWinStreak, resetWinStreak } from '../../utils/winstreak';

const GameManager = ({ gameId }) => {
  const [gameData, setGameData] = useState(null);
  const [result, setResult] = useState(null);
  const [iframeSrc, setIframeSrc] = useState(null);
  const transactionProcessed = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGame = async () => {
      if (!gameId) return;
      const ref = doc(db, 'contracts', gameId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() };
        setGameData(data);
        console.log("📄 Loaded game data:", data);
      } else {
        navigate('/');
      }
    };
    fetchGame();
  }, [gameId, navigate]);

  useEffect(() => {
    if (!gameData || !auth.currentUser) return;

    const uid = auth.currentUser.uid;
    const roomId = gameData.roomId;

    const isSecondPlayer = gameData.createdBy && uid !== gameData.createdBy;

    const launchUrls = {
      "Duel": `/game3/duel/duel-site/public/Build/index.html?room=${roomId}&name=${uid}`,
      "Stand Off": `/game3/fps/standoff/index.html?roomId=${roomId}&playerId=${uid}`
    };

    const src = launchUrls[gameData.game] || launchUrls["Stand Off"];

    if (isSecondPlayer) {
      console.log("⏳ Second player iframe delayed 1.5 seconds for sync.");
      const timer = setTimeout(() => setIframeSrc(src), 1500);
      return () => clearTimeout(timer);
    } else {
      setIframeSrc(src);
    }
  }, [gameData]);

  useEffect(() => {
    if (!gameData || gameData.game !== "Stand Off") return;

    const interval = setInterval(() => {
      const frame = document.querySelector('iframe');
      const uWin = frame?.contentWindow;
      const uInst = uWin?.unityInstance;
      const uid = auth.currentUser?.uid || 'Guest';

      if (uInst && typeof uInst.SendMessage === 'function') {
        const launchData = `${gameData.roomId}|${uid}`;
        uInst.SendMessage("JSBridge", "SetLaunchData", launchData);
        console.log("✅ Sent launch data to Unity:", launchData);
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [gameData]);

  useEffect(() => {
    if (!gameData || gameData.game !== "Duel") return;

    const interval = setInterval(() => {
      const frame = document.querySelector("iframe");
      const uWin = frame?.contentWindow;
      const uInst = uWin?.unityInstance;

      if (uInst && typeof uInst.SendMessage === "function") {
        const uid = auth.currentUser?.uid || "Guest";
        const data = `${gameData.roomId}|${uid}`;
        uInst.SendMessage("JSBridge", "SetLaunchData", data);
        console.log("✅ GameManager sent launch data to Duel:", data);
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [gameData]);

  useEffect(() => {
    const handleUnityMessage = async (event) => {
      if (event.data.type === "GAME_END" && !transactionProcessed.current) {
        transactionProcessed.current = true;
        try {
          const data = JSON.parse(event.data.data);
          await handleGameEnd(data);
        } catch (err) {
          console.error('❌ Parsing error:', err);
          transactionProcessed.current = false;
        }
      }
    };

    window.addEventListener("message", handleUnityMessage);
    return () => window.removeEventListener("message", handleUnityMessage);
  }, [gameData]);

  const calculateRake = (wagerUsd) => {
    if (wagerUsd >= 150) return 0.03;
    if (wagerUsd >= 25) return 0.045;
    if (wagerUsd >= 5) return 0.10;
    return 0;
  };

  const fetchSolPrice = async () => {
    try {
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
      const data = await res.json();
      return data.solana.usd;
    } catch (err) {
      console.error('Failed to fetch SOL price:', err);
      return null;
    }
  };

  const handleGameEnd = async (resultData) => {
    setResult(resultData.result);
    const contractRef = doc(db, 'contracts', gameId);

    try {
      await runTransaction(db, async (transaction) => {
        const contractSnap = await transaction.get(contractRef);
        const contractData = contractSnap.data();

        if (contractData.status === 'completed') {
          throw new Error("⚠️ Game already completed. Skipping payout.");
        }

        const wagerUsd = Number(contractData.amountUsd);
        const totalPotUsd = wagerUsd * 2;
        const rakeRate = calculateRake(wagerUsd);
        const rakeUsd = parseFloat((totalPotUsd * rakeRate).toFixed(2));
        const winnerUsd = parseFloat((totalPotUsd - rakeUsd).toFixed(2));

        const solPrice = await fetchSolPrice();
        if (!solPrice) throw new Error('❌ SOL price unavailable');

        const winnerSol = parseFloat((winnerUsd / solPrice).toFixed(4));
        const loserSol = parseFloat((wagerUsd / solPrice).toFixed(4));
        const rakeSol = parseFloat((rakeUsd / solPrice).toFixed(4));

        const winnerRef = doc(db, 'users', resultData.winnerId);
        const loserRef = doc(db, 'users', resultData.loserId);
        const rakeRef = doc(db, 'siteStats', 'dailyRake');

        const [winnerSnap, loserSnap, rakeSnap] = await Promise.all([
          transaction.get(winnerRef),
          transaction.get(loserRef),
          transaction.get(rakeRef)
        ]);

        if (!winnerSnap.exists() || !loserSnap.exists()) {
          throw new Error("Winner or loser document doesn't exist");
        }

        transaction.update(winnerRef, { balance: increment(winnerSol - loserSol) });
        transaction.update(loserRef, { balance: increment(-loserSol) });

        const winnerTxRef = doc(collection(db, 'users', resultData.winnerId, 'transactions'));
        transaction.set(winnerTxRef, {
          type: 'game won',
          amountUsd: parseFloat((winnerUsd - wagerUsd).toFixed(2)),
          amountSol: parseFloat((winnerSol - loserSol).toFixed(4)),
          currency: 'SOL',
          opponent: resultData.loserId,
          timestamp: serverTimestamp(),
        });

        const loserTxRef = doc(collection(db, 'users', resultData.loserId, 'transactions'));
        transaction.set(loserTxRef, {
          type: 'game lost',
          amountUsd: wagerUsd,
          amountSol: loserSol,
          currency: 'SOL',
          opponent: resultData.winnerId,
          timestamp: serverTimestamp(),
        });

        if (rakeSnap.exists()) {
          transaction.update(rakeRef, { total: increment(rakeSol) });
        } else {
          transaction.set(rakeRef, { total: rakeSol });
        }

        transaction.update(contractRef, {
          status: 'completed',
          result: resultData.result,
          winnerId: resultData.winnerId,
          loserId: resultData.loserId,
          endedAt: serverTimestamp(),
          rakeCollectedSol: rakeSol,
          rakeCollectedUsd: rakeUsd,
          winnerPayoutSol: winnerSol,
          winnerPayoutUsd: winnerUsd,
        });
      });

      console.log(`✅ Transaction successful!`);
      await incrementWinStreak(resultData.winnerId, gameData.game);
      await resetWinStreak(resultData.loserId, gameData.game);
    } catch (err) {
      console.error('❌ Transaction failed:', err);
      transactionProcessed.current = false;
    }
  };

  if (!gameData) return <p className="text-white">Loading game...</p>;

  return (
    <div className="p-4 text-white">
      <h1 className="text-3xl font-bold mb-4">{gameData.game} Match</h1>
      {iframeSrc && (
        <iframe
          src={iframeSrc}
          width="100%"
          height="600px"
          title="Unity Game"
          frameBorder="0"
          allow="fullscreen"
        />
      )}
      {result && <p className="mt-4 font-bold">Result: {result}</p>}
    </div>
  );
};

export default GameManager;
