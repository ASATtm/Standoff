// src/components/PresenceTest.jsx
import React from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const PresenceTest = () => {
  const writeTestPresence = async () => {
    try {
      await setDoc(doc(db, 'presence', 'test-manual'), {
        userId: 'test-manual',
        username: 'Manual Test',
        timestamp: new Date(),
      });
      alert('✅ Presence test document written');
    } catch (err) {
      console.error('❌ Firestore write failed:', err);
      alert('❌ Failed to write presence. See console.');
    }
  };

  return (
    <div className="p-4">
      <button
        onClick={writeTestPresence}
        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 text-white rounded"
      >
        Test Firestore Write
      </button>
    </div>
  );
};

export default PresenceTest;
