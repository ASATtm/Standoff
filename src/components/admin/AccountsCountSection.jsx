import React, { useEffect, useState } from 'react';
import {
  collection,
  getCountFromServer,
  onSnapshot,
  query,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../firebase';
import ActiveUsersPopup from './ActiveUsersPopup';

const AccountsCountSection = () => {
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const fetchTotalUsers = async () => {
      const snap = await getCountFromServer(collection(db, 'users'));
      setTotalUsers(snap.data().count);
    };

    const listenToActivePresence = () => {
      const fifteenSecondsAgo = Timestamp.fromMillis(Date.now() - 15000);
      const presenceQuery = query(
        collection(db, 'presence'),
        where('lastActive', '>=', fifteenSecondsAgo)
      );
      return onSnapshot(presenceQuery, (snap) => {
        const userIds = new Set();
        snap.docs.forEach(doc => {
          const { userId } = doc.data();
          userIds.add(userId);
        });
        setActiveUsers(userIds.size);
      });
    };

    fetchTotalUsers();
    const unsub = listenToActivePresence();
    return () => unsub();
  }, []);

  return (
    <section className="bg-gray-900 rounded-xl p-4 shadow-lg relative">
      <h2 className="text-xl font-semibold mb-2 text-green-300">👥 User Stats</h2>
      <p className="text-2xl font-bold">
        {totalUsers} <span className="text-sm text-gray-400">total</span>
      </p>
      <p
        onClick={() => setShowPopup(true)}
        className="text-lg text-green-400 mt-1 cursor-pointer underline"
      >
        {activeUsers} active now
      </p>
      {showPopup && <ActiveUsersPopup onClose={() => setShowPopup(false)} />}
    </section>
  );
};

export default AccountsCountSection;
