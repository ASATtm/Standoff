import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const lastUidRef = useRef(null);

  useEffect(() => {
    let cleanupUnload = null;
    let intervalId = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const lastUid = lastUidRef.current;

      if (lastUid && lastUid !== user?.uid) {
        try {
          await deleteDoc(doc(db, 'presence', lastUid));
        } catch (e) {
          console.warn('Could not clean old presence:', e);
        }
      }

      lastUidRef.current = user?.uid || null;
      setCurrentUser(user);

      if (!user) {
        setLoading(false);
        return;
      }

      const presenceRef = doc(db, 'presence', user.uid);
      const userRef = doc(db, 'users', user.uid);

      const writePresence = async () => {
        try {
          const userDoc = await getDoc(userRef);
          const data = userDoc.exists() ? userDoc.data() : {};

          await setDoc(presenceRef, {
            userId: data.userId || user.uid,
            username: data.username || 'Anonymous',
            lastActive: serverTimestamp(),
          });
        } catch (err) {
          console.error('❌ Failed to write presence:', err);
        }
      };

      intervalId = setInterval(writePresence, 15000);
      writePresence();

      const handleUnload = async () => {
        try {
          clearInterval(intervalId);
          await deleteDoc(presenceRef);
        } catch (err) {
          console.error('❌ Failed to remove presence on unload:', err);
        }
      };

      window.addEventListener('beforeunload', handleUnload);
      cleanupUnload = () => {
        window.removeEventListener('beforeunload', handleUnload);
        clearInterval(intervalId);
      };

      setLoading(false);
    });

    return () => {
      if (cleanupUnload) cleanupUnload();
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
