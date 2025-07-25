import React, { useEffect, useState } from 'react';
import Chat from '../components/Chat';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import GreenDriftfield from '../components/GreenDriftfield'; // ✅ background import

const ChatPage = () => {
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUsername, setCurrentUsername] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setCurrentUserId(user.uid);
          setCurrentUsername(userDoc.data().username || 'Unknown');
        }
      }
    };

    fetchUser();
  }, []);

  if (!currentUserId) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        <p>Loading chat...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <GreenDriftfield />
      <div className="relative z-10 flex flex-col min-h-screen pt-6 px-4">
        <h2 className="text-2xl font-bold text-green-400 text-center mb-3">
          Community Chat
        </h2>

        <div className="flex-grow flex justify-center overflow-hidden pb-24">
          <div className="w-full max-w-5xl flex flex-col">
            <Chat currentUserId={currentUserId} currentUsername={currentUsername} />
          </div>
        </div>

        <div className="text-green-400 text-sm text-center mt-3 mb-4">
          More users online? Chat & Challenge!
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
