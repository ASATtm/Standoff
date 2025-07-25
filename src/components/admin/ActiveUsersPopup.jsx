import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  Timestamp
} from 'firebase/firestore';

const ActiveUsersPopup = ({ onClose }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'presence'),
        where('lastActive', '>=', Timestamp.fromMillis(Date.now() - 15000))
      ),
      async (snap) => {
        try {
          const userIds = snap.docs.map((docSnap) => docSnap.data().userId).filter(Boolean);

          if (userIds.length === 0) {
            setUsers([]);
            setLoading(false);
            return;
          }

          const userQuery = query(
            collection(db, 'users'),
            where('userId', 'in', userIds.slice(0, 10)) // Firestore `in` limit = 10
          );

          const userSnap = await getDocs(userQuery);
          const results = userSnap.docs.map(doc => {
            const data = doc.data();
            return {
              id: data.userId,
              username: data.username || 'Unknown',
              email: data.email || '—'
            };
          });

          setUsers(results);
        } catch (err) {
          console.error('❌ Failed to fetch active users:', err);
          setUsers([]);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-xl w-full max-w-md max-h-[80vh] overflow-y-auto shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-green-300">🟢 Active Users</h2>
          <button onClick={onClose} className="text-white text-sm hover:underline">
            Close
          </button>
        </div>

        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : users.length === 0 ? (
          <p className="text-gray-400">No active users found.</p>
        ) : (
          <ul className="space-y-2 text-sm text-gray-300">
            {users.map((user) => (
              <li key={user.id} className="border-b border-gray-700 pb-2">
                <p><span className="text-green-400">{user.username}</span> ({user.id})</p>
                <p className="text-gray-500">{user.email}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ActiveUsersPopup;
