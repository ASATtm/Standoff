import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const SettingsContact = () => {
  const auth = useAuth();
  const currentUser = auth?.currentUser;

  const [email, setEmail] = useState('');
  const [sms, setSms] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const fetchUser = async () => {
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setEmail(data.email || '');
        setSms(data.notificationSettings?.sms || '');
      }
      setLoading(false);
    };

    fetchUser();
  }, [currentUser]);

  const savePhone = async () => {
    if (!currentUser) return;

    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, {
      notificationSettings: {
        sms,
      },
    });
  };

  if (!currentUser) return <p className="p-4 text-yellow-400">⚠️ Not logged in or auth not ready.</p>;
  if (loading) return <p className="p-4">Loading...</p>;

  return (
    <div className="p-4 max-w-xl mx-auto">
      <Link
        to="/settings"
        className="inline-block mb-4 bg-gray-700 hover:bg-gray-800 text-white text-sm px-4 py-2 rounded"
      >
        ← Back to Settings
      </Link>

      <h2 className="text-xl font-bold mb-4">Contact Info</h2>

      <label className="block mb-2">Email</label>
      <div className="w-full p-2 mb-4 border rounded bg-gray-100 text-gray-500">
        {email || 'No email on record'}
      </div>

      <label className="block mb-2">Phone Number for SMS</label>
      <input
        className="w-full p-2 mb-2 border rounded"
        value={sms}
        onChange={(e) => setSms(e.target.value)}
        placeholder="Enter phone number"
      />

      <button
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
        onClick={savePhone}
      >
        Save Contact Info
      </button>
    </div>
  );
};

export default SettingsContact;