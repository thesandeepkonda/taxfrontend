// src/pages/Dashboard/AdminDashboard.tsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Control Panel</h1>
      <p className="text-gray-600 mb-6">Welcome back, {user?.name}. You have full access.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-purple-50 rounded-lg border border-purple-100">
          <h3 className="text-purple-800 font-bold text-lg">Total Users</h3>
          <p className="text-3xl font-extrabold text-purple-600 mt-2">1,240</p>
        </div>
        <div className="p-6 bg-green-50 rounded-lg border border-green-100">
          <h3 className="text-green-800 font-bold text-lg">System Status</h3>
          <p className="text-xl font-bold text-green-600 mt-2">All Systems Operational</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;