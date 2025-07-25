// src/components/AdminSkeleton.jsx
import React from 'react';
import AdminUserLookup from './AdminUserLookup';
import AccountsCountSection from './AccountsCountSection';
import WithdrawPanel from './WithdrawPanel';
import AdminRake from './AdminRake';

const AdminSkeleton = () => {
  return (
    <div className="p-6 text-white bg-gray-950 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-green-400">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start auto-rows-min">
        {/* User Lookup Section */}
        <AdminUserLookup />

        {/* Enhanced Rake UI */}
        <AdminRake />

        {/* Accounts Count Section */}
        <section className="bg-gray-900 rounded-xl p-4 shadow-lg h-fit">
          <AccountsCountSection />
        </section>

        {/* Withdraw Panel Section */}
        <section className="h-fit">
          <WithdrawPanel />
        </section>

        {/* Placeholder for Future Sections */}
        <section className="bg-gray-900 rounded-xl p-4 shadow-lg h-fit">
          <h2 className="text-xl font-semibold mb-2 text-green-300">📊 Analytics</h2>
          <div className="text-sm text-gray-400">Graphs and reports coming soon.</div>
        </section>
      </div>
    </div>
  );
};

export default AdminSkeleton;
