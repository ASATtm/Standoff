// src/pages/AdminManager.jsx
import React from 'react';
import AdminSkeleton from '../components/Admin/AdminSkeleton';
import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const AdminManager = () => {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const data = userDoc.exists() ? userDoc.data() : {};
        if (data.role === 'admin') {
          setAuthorized(true);
        } else {
          navigate('/');
        }
      } catch (err) {
        console.error('❌ Failed to check admin role:', err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [navigate]);

  if (loading) return <div className="p-4 text-white">Checking access...</div>;
  if (!authorized) return null;

  return <AdminSkeleton />;
};

export default AdminManager;
