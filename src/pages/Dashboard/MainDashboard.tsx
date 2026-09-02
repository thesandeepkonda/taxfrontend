// src/pages/Dashboard/MainDashboard.tsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminDashboard from './AdminDashboard';
import TeamLeadDashboard from './TeamLeadDashboard';
import EmployeeDashboard from './EmployeeDashboard';

const MainDashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) return <div>Loading...</div>;

  console.log('User Role:', user.role);
  console.log('Department Name:', user.departmentName);
  console.log('Team Name:', user.teamName);

  // ✅ ROLE-BASED NAVIGATION (Highest Priority)
  if (user.role === 'ADMIN') {
    return <AdminDashboard />;
  }

  if (user.role === 'TEAMLEAD') {
    return <TeamLeadDashboard />;
  }

  if (user.role === 'EMPLOYEE') {
    return <EmployeeDashboard />;
  }

  // Fallback
  return (
    <div className="p-8 text-red-600 font-bold">
      Unauthorized Access: Role not recognized.
      <br />
      <span className="text-sm font-normal text-gray-500">
        Role: {user.role} | Department: {user.departmentName || 'None'}
      </span>
    </div>
  );
};

export default MainDashboard;