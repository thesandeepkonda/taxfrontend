// src/components/layout/Sidebar.tsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const { user } = useAuth();

  return (
    <aside className="w-64 bg-gray-800 text-white min-h-screen p-4 flex flex-col">
      <div className="mb-8 px-4">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Navigation</h2>
      </div>

      <nav className="space-y-1">
        {/* COMMON FOR ALL */}
        <Link to="/dashboard" className="block py-2.5 px-4 hover:bg-gray-700 rounded transition-colors">
          Dashboard
        </Link>
        
        {/* ADMIN EXCLUSIVE */}
        {user?.role === 'ADMIN' && (
          <>
            <div className="pt-4 pb-2 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Administration</div>
            <Link to="/manage-users" className="block py-2.5 px-4 hover:bg-gray-700 rounded transition-colors">
              Manage Employees
            </Link>
            <Link to="/system-reports" className="block py-2.5 px-4 hover:bg-gray-700 rounded transition-colors">
              System Reports
            </Link>
          </>
        )}

        {/* TEAM LEAD EXCLUSIVE */}
        {user?.role === 'TEAMLEAD' && (
          <>
            <div className="pt-4 pb-2 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Team Management</div>
            <Link to="/team-performance" className="block py-2.5 px-4 hover:bg-gray-700 rounded transition-colors">
              My Team Performance
            </Link>
            <Link to="/assign-tasks" className="block py-2.5 px-4 hover:bg-gray-700 rounded transition-colors">
              Assign Tasks
            </Link>
          </>
        )}

        {/* DYNAMIC TEAM LINKS (Applicable for both Employees and TeamLeads of that specific team) */}
        {user?.team !== 'NONE' && (
           <div className="pt-4 pb-2 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{user?.team} Workspace</div>
        )}

        {user?.team === 'DOCUMENTATION' && (
          <>
            <Link to="/collect-docs" className="block py-2.5 px-4 hover:bg-gray-700 rounded transition-colors">
              Client Documents
            </Link>
            <Link to="/verify-docs" className="block py-2.5 px-4 hover:bg-gray-700 rounded transition-colors">
              Pending Verification
            </Link>
          </>
        )}
        
        {user?.team === 'PREPARATION' && (
          <>
            <Link to="/tax-prep" className="block py-2.5 px-4 hover:bg-gray-700 rounded transition-colors">
              Tax Preparation
            </Link>
            <Link to="/review-returns" className="block py-2.5 px-4 hover:bg-gray-700 rounded transition-colors">
              Review Returns
            </Link>
          </>
        )}

        {user?.team === 'ESTIMATION' && (
          <>
            <Link to="/tax-estimates" className="block py-2.5 px-4 hover:bg-gray-700 rounded transition-colors">
              Tax Estimates
            </Link>
            <Link to="/client-projections" className="block py-2.5 px-4 hover:bg-gray-700 rounded transition-colors">
              Client Projections
            </Link>
          </>
        )}

        {user?.team === 'PAYMENTS' && (
          <>
            <Link to="/invoices" className="block py-2.5 px-4 hover:bg-gray-700 rounded transition-colors">
              Invoices & Billing
            </Link>
            <Link to="/payment-gateway" className="block py-2.5 px-4 hover:bg-gray-700 rounded transition-colors">
              Payment Gateway
            </Link>
          </>
        )}

        {user?.team === 'E-FILING' && (
          <>
            <Link to="/irs-transmissions" className="block py-2.5 px-4 hover:bg-gray-700 rounded transition-colors">
              IRS Transmissions
            </Link>
            <Link to="/filing-status" className="block py-2.5 px-4 hover:bg-gray-700 rounded transition-colors">
              Filing Status Check
            </Link>
          </>
        )}

      </nav>
    </aside>
  );
};

export default Sidebar;