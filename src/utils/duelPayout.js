import {
    doc,
    increment,
    runTransaction,
    serverTimestamp,
    collection
  } from "firebase/firestore";
  import { db } from "../firebase";
  
  export async function completeDuelPayout(contractId, winnerId, loserId, contract) {
    try {
      const contractRef = doc(db, "contracts", contractId);
  
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(contractRef);
        const data = snap.data();
        if (data.status === "completed") return;
  
        const wagerUsd = Number(data.amountUsd);
        const totalPot = wagerUsd * 2;
  
        // ✅ Correct rake logic
        const calculateRake = (usd) => {
          if (usd >= 150) return 0.03;
          if (usd >= 25) return 0.045;
          if (usd >= 5) return 0.10;
          return 0;
        };
  
        const rakeRate = calculateRake(wagerUsd);
        const rakeUsd = +(totalPot * rakeRate).toFixed(2);
        const winnerUsd = +(totalPot - rakeUsd).toFixed(2);
  
        const winnerRef = doc(db, "users", winnerId);
        const loserRef = doc(db, "users", loserId);
        const rakeRef = doc(db, "siteStats", "dailyRake");
  
        const solPrice = await fetchSolPrice();
        if (!solPrice) throw new Error("SOL price fetch failed");
  
        const winnerSol = +(winnerUsd / solPrice).toFixed(4);
        const loserSol = +(wagerUsd / solPrice).toFixed(4);
        const rakeSol = +(rakeUsd / solPrice).toFixed(4);
  
        transaction.update(winnerRef, { balance: increment(winnerSol - loserSol) });
        transaction.update(loserRef, { balance: increment(-loserSol) });
  
        transaction.set(doc(collection(db, "users", winnerId, "transactions")), {
          type: "game won",
          amountUsd: +(winnerUsd - wagerUsd).toFixed(2),
          amountSol: +(winnerSol - loserSol).toFixed(4),
          currency: "SOL",
          opponent: loserId,
          timestamp: serverTimestamp(),
        });
  
        transaction.set(doc(collection(db, "users", loserId, "transactions")), {
          type: "game lost",
          amountUsd: wagerUsd,
          amountSol: loserSol,
          currency: "SOL",
          opponent: winnerId,
          timestamp: serverTimestamp(),
        });
  
        transaction.update(contractRef, {
          status: "completed",
          result: "duel completed",
          winnerId,
          loserId,
          rakeCollectedUsd: rakeUsd,
          rakeCollectedSol: rakeSol,
          winnerPayoutUsd: winnerUsd,
          winnerPayoutSol: winnerSol,
          endedAt: serverTimestamp(),
        });
      });
  
      console.log(`✅ Duel payout processed for ${contractId}`);
    } catch (err) {
      console.error("❌ Duel payout failed:", err);
    }
  }
  
  async function fetchSolPrice() {
    try {
      const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd");
      const data = await res.json();
      return data.solana.usd;
    } catch (err) {
      console.error("❌ Failed to fetch SOL price:", err);
      return null;
    }
  }
  