// src/pages/Dashboard/MainDashboard.tsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminDashboard from './AdminDashboard';
import TeamLeadDashboard from './TeamLeadDashboard';
import EmployeeDashboard from './EmployeeDashboard';

const MainDashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) return <div>Loading...</div>;

  // Role ni batti direct ga aa component ki pamputhunnam
  if (user.role === 'ADMIN') return <AdminDashboard />;
  if (user.role === 'TEAMLEAD') return <TeamLeadDashboard />;
  if (user.role === 'EMPLOYEE') return <EmployeeDashboard />;

  return (
    <div className="p-8 text-red-600 font-bold">
      Unauthorized Access: Role not recognized.
    </div>
  );
};

export default MainDashboard;