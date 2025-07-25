// src/utils/solana.js

import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { BANK_WALLET_ADDRESS } from './wallets';
import { auth, db } from '../firebase';
import { doc, runTransaction, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

const connection = new Connection('https://api.devnet.solana.com'); // devnet only

export async function depositSol(amountSol, wallet) {
  if (!wallet?.publicKey || !wallet?.signTransaction) {
    throw new Error('Wallet not connected');
  }

  try {
    const walletBalanceLamports = await connection.getBalance(wallet.publicKey);
    const walletBalanceSol = walletBalanceLamports / LAMPORTS_PER_SOL;

    if (amountSol > walletBalanceSol) {
      throw new Error('Insufficient funds in your wallet');
    }

    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: new PublicKey(BANK_WALLET_ADDRESS),
        lamports: amountSol * LAMPORTS_PER_SOL,
      })
    );

    tx.feePayer = wallet.publicKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    const signedTx = await wallet.signTransaction(tx);
    const signature = await connection.sendRawTransaction(signedTx.serialize());
    await connection.confirmTransaction(signature, 'confirmed');

    const userRef = doc(db, 'users', auth.currentUser.uid);
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(userRef);
      if (!snap.exists()) throw new Error('User doc not found');
      const current = snap.data().balance || 0;
      transaction.update(userRef, {
        balance: current + amountSol,
      });
    });

    // 🔐 Add Firestore transaction log
    await addDoc(collection(userRef, 'transactions'), {
      type: 'deposit',
      amount: amountSol,
      currency: 'SOL',
      timestamp: serverTimestamp(),
    });

    return signature;
  } catch (err) {
    console.error('❌ depositSol error:', err);
    throw err;
  }
}

export async function withdrawSol(amountSol, wallet) {
  if (!wallet?.publicKey) {
    throw new Error('Wallet not connected');
  }

  try {
    const userRef = doc(db, 'users', auth.currentUser.uid);
    let userBalance = 0;

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(userRef);
      if (!snap.exists()) throw new Error('User doc not found');
      const data = snap.data();
      userBalance = data.balance || 0;

      if (amountSol > userBalance) {
        throw new Error('Insufficient balance to withdraw');
      }

      transaction.update(userRef, {
        balance: userBalance - amountSol,
      });
    });

    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: new PublicKey(BANK_WALLET_ADDRESS),
        toPubkey: wallet.publicKey,
        lamports: amountSol * LAMPORTS_PER_SOL,
      })
    );

    tx.feePayer = new PublicKey(BANK_WALLET_ADDRESS);
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    // 🔐 In production, this must be signed securely (e.g. via server, keypair, or cloud function)
    throw new Error('Withdraw not implemented: Signing requires backend');

    return 'tx_signature';
  } catch (err) {
    console.error('❌ withdrawSol error:', err);
    throw err;
  }
}
