import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const OnlineIndicator = ({ uid }) => {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (!uid || typeof uid !== 'string') {
      console.warn("❌ No uid provided to OnlineIndicator:", uid);
      setIsOnline(false);
      return;
    }

    const ref = doc(db, 'presence', uid);

    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        console.warn("📭 No presence doc for:", uid);
        return setIsOnline(false);
      }

      const data = snap.data();
      const lastActive = data.lastActive;

      if (!lastActive || typeof lastActive.toMillis !== 'function') {
        console.warn("⚠️ lastActive invalid for:", uid, lastActive);
        return setIsOnline(false);
      }

      const delta = Date.now() - lastActive.toMillis();
      console.log("⏱ delta (ms):", delta, "user:", uid);

      setIsOnline(delta < 30000);
    });

    return () => unsub();
  }, [uid]);

  return (
    <span
      className={`inline-block w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`}
      title={isOnline ? 'Online' : 'Offline'}
    ></span>
  );
};

export default OnlineIndicator;
