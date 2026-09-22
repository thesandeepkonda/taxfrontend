// src/features/admin/resueables/CreateDepartmentModal.tsx
import React from 'react';
import { Building2, X, Info } from 'lucide-react';

interface Props { isOpen: boolean; onClose: () => void; onSuccess?: () => void; }

const CreateDepartmentModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-[#1b2559] flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#5f41b2]" />
            Departments Are Fixed
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-800">
            Departments are now system-level enums. Cannot be created or edited.
          </p>
        </div>
        <div className="mt-4 space-y-2">
          {['DOCUMENTATION', 'PREPARATION', 'PAYMENT', 'EFILING'].map((d) => (
            <div key={d} className="flex justify-between items-center px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{d}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-5 py-2.5 bg-[#5f41b2] hover:bg-[#4d3396] text-white text-sm font-bold rounded-xl transition">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateDepartmentModal;