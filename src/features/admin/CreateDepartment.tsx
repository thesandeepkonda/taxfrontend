// src/features/admin/CreateDepartment.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowLeft, Info } from 'lucide-react';

const CreateDepartment: React.FC = () => {
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
              <Building2 className="w-5 h-5" />
              Departments are Fixed
            </h2>
            <p className="text-sm text-blue-700 mt-1">
              Departments are now fixed system enums:
              <span className="font-bold"> Documentation, Preparation, Payment, E-Filing</span>.
            </p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { code: 'DOCUMENTATION', label: 'Documentation' },
            { code: 'PREPARATION', label: 'Preparation' },
            { code: 'PAYMENT', label: 'Payment' },
            { code: 'EFILING', label: 'E-Filing' },
          ].map((d) => (
            <div key={d.code} className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{d.code}</p>
              <p className="text-sm font-bold text-[#1b2559] mt-1">{d.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <button
            onClick={() => navigate('/admin/view-departments')}
            className="min-h-[44px] flex items-center justify-center gap-2 bg-[#5f41b2] hover:bg-[#4d3396] text-white font-bold px-6 py-2.5 rounded-xl transition"
          >
            View Departments
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateDepartment;