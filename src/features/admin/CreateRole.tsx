// src/features/admin/CreateRole.tsx  (same for src/features/admin/roles/CreateRole.tsx)
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, Info } from 'lucide-react';

const CreateRole: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="w-full flex flex-col font-sans overflow-x-hidden gap-y-4">
      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-4 sm:p-6 lg:p-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 text-sm font-semibold text-[#5f41b2] hover:underline flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <h2 className="text-base font-bold text-blue-900 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Roles are Fixed
            </h2>
            <p className="text-sm text-blue-700 mt-1">
              Roles are now fixed system enums: <span className="font-bold">Admin, Team Lead, Employee</span>.
            </p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {['ADMIN', 'TEAM_LEAD', 'EMPLOYEE'].map((r) => (
            <div key={r} className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{r}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CreateRole;