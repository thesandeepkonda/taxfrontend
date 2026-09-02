// src/pages/Dashboard/TeamEscalations.tsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AlertTriangle, Search, Clock, ArrowRight } from 'lucide-react';

const TeamEscalations: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const teamName = user?.team && user.team !== 'NONE' ? user.team : 'General';

  const mockEscalations = [
    { id: 'ESC-201', client: 'Stark Industries', issue: `${teamName} process delayed by 3 days`, escalatedBy: 'Priya Patel', priority: 'High', time: '1 hr ago' },
    { id: 'ESC-202', client: 'Wayne Ent', issue: 'Client unresponsive for signature', escalatedBy: 'John Doe', priority: 'Medium', time: '4 hrs ago' },
  ];

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden">
      <div className="flex items-center justify-between shrink-0 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1b2559] tracking-tight leading-none flex items-center gap-3">
            <AlertTriangle className="w-7 h-7 text-rose-600" /> Team Escalations
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Issues escalated from {teamName} agents</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search escalations..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm w-64"
          />
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {mockEscalations.map((item, idx) => (
            <div key={idx} className="border border-rose-100 rounded-xl p-5 hover:border-rose-300 transition bg-rose-50/30 flex justify-between items-center group">
              <div className="flex gap-5 items-center">
                <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      item.priority === 'High' ? 'bg-rose-600 text-white' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.priority} Priority
                    </span>
                    <span className="text-xs text-gray-500 font-semibold flex items-center gap-1"><Clock className="w-3 h-3"/> {item.time}</span>
                  </div>
                  <h4 className="font-bold text-[#1b2559] text-base">{item.id} - {item.client}</h4>
                  <p className="text-sm text-gray-700 font-bold mt-1">Issue: <span className="font-medium text-rose-700">{item.issue}</span></p>
                  <p className="text-xs text-gray-500 font-medium mt-1">Escalated by: {item.escalatedBy}</p>
                </div>
              </div>
              <button className="flex items-center gap-2 bg-white border border-gray-200 hover:border-rose-300 text-gray-700 hover:text-rose-600 px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm">
                Take Action <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamEscalations;