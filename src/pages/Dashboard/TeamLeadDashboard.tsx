// src/pages/Dashboard/TeamLeadDashboard.tsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const TeamLeadDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Team Lead Dashboard</h1>
      <p className="text-gray-600 mb-6">Welcome {user?.name}. Managing: <span className="font-bold text-blue-600">{user?.team} Team</span></p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="text-blue-800 font-bold text-lg">Pending Approvals</h3>
          <p className="text-3xl font-extrabold text-blue-600 mt-2">14</p>
        </div>
        <div className="p-6 bg-yellow-50 rounded-lg border border-yellow-100">
          <h3 className="text-yellow-800 font-bold text-lg">Team Performance</h3>
          <p className="text-xl font-bold text-yellow-600 mt-2">92% Efficiency</p>
        </div>
      </div>
    </div>
  );
};

export default TeamLeadDashboard;