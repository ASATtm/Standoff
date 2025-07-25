// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  reload,
  sendEmailVerification,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const { connected, publicKey } = useWallet();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [walletSaved, setWalletSaved] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await reload(currentUser);
        setIsVerified(currentUser.emailVerified);

        // ✅ Ensure balance exists
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          if (data.balance === undefined) {
            await updateDoc(userRef, { balance: 0 });
          }
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const validatePhone = (number) => /^\+?[1-9]\d{1,14}$/.test(number);

  const handleRegister = async () => {
    setError('');
    if (!email || !username || !password) {
      setError('Email, Username, and Password are required!');
      return;
    }
    if (phone && !validatePhone(phone)) {
      setError('Invalid phone number format (use +1234567890).');
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      const generatedId = 'USER-' + Math.random().toString(36).substr(2, 6).toUpperCase();
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email,
        username,
        userId: generatedId,
        phone: phone || null,
        wallet: null,
        balance: 0, // ✅ Add default balance
        winstreaks: {
          'Stand Off': 0,
          'Catapult': 0,
          'Coin Toss': 0,
          'Steal': 0
        }
      }, { merge: true });
      setIsRegistered(true);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const handleLogin = async () => {
    setError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await reload(userCredential.user);
      if (!userCredential.user.emailVerified) {
        await sendEmailVerification(userCredential.user);
        setError('Email not verified. Verification email sent again.');
      } else {
        setIsVerified(true);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setIsVerified(false);
    setSubmitted(false);
    setIsRegistered(false);
    setWalletSaved(false);
    setError('');
  };

  const checkVerification = async () => {
    if (auth.currentUser) {
      await reload(auth.currentUser);
      setIsVerified(auth.currentUser.emailVerified);
    }
  };

  const saveWallet = async () => {
    try {
      if (!publicKey) {
        setError('Please connect a wallet first!');
        return;
      }
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        wallet: publicKey.toString(),
      });
      setWalletSaved(true);
    } catch (err) {
      console.error(err);
      setError('Failed to save wallet: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="bg-gray-800 p-6 rounded-lg w-96 text-white relative">
        <h2 className="text-xl font-bold mb-4">{isRegistered ? 'Verify Email' : 'Register or Login'}</h2>

        {error && <div className="bg-red-500 text-white p-2 rounded mb-2">{error}</div>}

        {!user ? (
          <>
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full text-black p-2 rounded mb-2" />
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full text-black p-2 rounded mb-2" />
            {!isRegistered && (
              <>
                <label>Username</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                  className="w-full text-black p-2 rounded mb-2" />
                <label>Phone (optional)</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +1234567890" className="w-full text-black p-2 rounded mb-2" />
                <button onClick={handleRegister}
                  className="bg-green-600 hover:bg-green-700 w-full py-2 mt-4 rounded">
                  Register
                </button>
              </>
            )}
            <button onClick={handleLogin}
              className="bg-blue-600 hover:bg-blue-700 w-full py-2 mt-2 rounded">
              Login
            </button>
          </>
        ) : !isVerified ? (
          <>
            <p className="text-sm text-yellow-400 mb-2">Check your email for verification.</p>
            <p>Please verify your email then click below:</p>
            <button onClick={checkVerification}
              className="bg-yellow-500 hover:bg-yellow-600 w-full py-2 mt-4 rounded">
              I verified my email
            </button>
            <button onClick={() => {
              setUser(null);
              setSubmitted(false);
              setIsRegistered(false);
              setEmail('');
              setPassword('');
              setUsername('');
              setPhone('');
            }}
              className="bg-gray-600 hover:bg-gray-700 w-full py-2 mt-2 rounded">
              Change Email
            </button>
          </>
        ) : (
          <>
            <p className="mt-4 text-green-400">🎉 Verified! Connect your wallet below:</p>
            <WalletMultiButton className="mt-2" />
            {!walletSaved ? (
              <button onClick={saveWallet}
                className="bg-green-600 hover:bg-green-700 w-full py-2 mt-4 rounded">
                Save Wallet
              </button>
            ) : (
              <Link to="/" className="block bg-green-600 hover:bg-green-700 w-full text-center py-2 rounded mt-4">
                ✅ Wallet Saved — Return to Home
              </Link>
            )}
            <button onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 w-full py-2 mt-4 rounded">
              Logout
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
