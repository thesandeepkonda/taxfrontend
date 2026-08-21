// src/pages/Dashboard/EmployeeDashboard.tsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Employee Workspace</h1>
      <p className="text-gray-600 mb-6">Hello {user?.name}. Your assigned queue: <span className="font-bold text-blue-600">{user?.team}</span></p>
      
      {/* Documentation Team specific UI */}
      {user?.team === 'DOCUMENTATION' && (
        <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-lg">
          <h2 className="text-xl font-bold text-indigo-900 mb-2">Document Verification Queue</h2>
          <p className="text-indigo-700">You have 5 client documents waiting for verification.</p>
          <button className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded">Start Verification</button>
        </div>
      )}

      {/* E-Filing Team specific UI */}
      {user?.team === 'E-FILING' && (
        <div className="p-6 bg-orange-50 border border-orange-100 rounded-lg">
          <h2 className="text-xl font-bold text-orange-900 mb-2">E-Filing Transmission</h2>
          <p className="text-orange-700">3 returns are ready to be transmitted to the IRS.</p>
          <button className="mt-4 bg-orange-600 text-white px-4 py-2 rounded">Transmit Now</button>
        </div>
      )}

      {/* Add logic for PREPARATION, ESTIMATION, PAYMENTS as you need them */}
      
    </div>
  );
};

export default EmployeeDashboard;