// src/pages/Dashboard/PendingApprovals.tsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { CheckSquare, Search, CheckCircle2, XCircle, Clock } from 'lucide-react';

const PendingApprovals: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const teamName = user?.team && user.team !== 'NONE' ? user.team : 'General';

  const mockApprovals = [
    { id: 'APP-101', client: 'Acme Corp', type: `${teamName} Override`, requestedBy: 'John Doe', time: '10 mins ago', status: 'Pending' },
    { id: 'APP-102', client: 'Michael Smith', type: 'Fee Discount', requestedBy: 'Sarah Martins', time: '1 hr ago', status: 'Pending' },
    { id: 'APP-103', client: 'TechFlow LLC', type: 'Final Review Signoff', requestedBy: 'Akin Siyan', time: '2 hrs ago', status: 'Pending' },
  ];

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden">
      <div className="flex items-center justify-between shrink-0 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1b2559] tracking-tight leading-none flex items-center gap-3">
            <CheckSquare className="w-7 h-7 text-[#5f41b2]" /> Pending Approvals
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Items requiring {teamName} Lead authorization</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search requests..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5f41b2] shadow-sm w-64"
          />
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {mockApprovals.map((item, idx) => (
            <div key={idx} className="border border-gray-100 rounded-xl p-5 hover:border-blue-200 transition bg-gray-50/50 flex justify-between items-center group">
              <div className="flex gap-5 items-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                  <CheckSquare className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {item.type}
                    </span>
                    <span className="text-xs text-gray-400 font-semibold flex items-center gap-1"><Clock className="w-3 h-3"/> {item.time}</span>
                  </div>
                  <h4 className="font-bold text-[#1b2559] text-base">{item.id} - {item.client}</h4>
                  <p className="text-sm text-gray-500 font-medium mt-1">Requested by: <span className="text-gray-700 font-bold">{item.requestedBy}</span></p>
                </div>
              </div>
              <div className="flex gap-3 opacity-80 group-hover:opacity-100 transition-opacity">
                <button className="flex items-center gap-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 px-4 py-2 rounded-lg text-sm font-bold transition">
                  <XCircle className="w-4 h-4" /> Reject
                </button>
                <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm">
                  <CheckCircle2 className="w-4 h-4" /> Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PendingApprovals;