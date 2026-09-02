// src/pages/Dashboard/TeamRoster.tsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Search, Plus, MoreVertical, Mail, Phone } from 'lucide-react';

const TeamRoster: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  
  const teamName = user?.team && user.team !== 'NONE' ? user.team : 'General';

  const mockMembers = [
    { id: 'EMP-01', name: 'John Doe', role: 'Senior Agent', status: 'Online', email: 'john@metrixtax.com' },
    { id: 'EMP-02', name: 'Sarah Martins', role: 'Agent', status: 'In Meeting', email: 'sarah@metrixtax.com' },
    { id: 'EMP-03', name: 'Akin Siyan', role: 'Agent', status: 'Offline', email: 'akin@metrixtax.com' },
    { id: 'EMP-04', name: 'Priya Patel', role: 'Junior Agent', status: 'Online', email: 'priya@metrixtax.com' },
  ];

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden">
      <div className="flex items-center justify-between shrink-0 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1b2559] tracking-tight leading-none">Roster Overview</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Manage {teamName} Team Members</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search members..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5f41b2] shadow-sm w-64"
            />
          </div>
          <button className="bg-[#5f41b2] hover:bg-[#4d3396] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Add Member
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-2">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 sticky top-0 z-10">
              <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                <th className="p-4 rounded-tl-lg">Employee Name</th>
                <th className="p-4">Contact Info</th>
                <th className="p-4">Role</th>
                <th className="p-4 text-center">Live Status</th>
                <th className="p-4 text-right rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {mockMembers.map((member, idx) => (
                <tr key={idx} className="hover:bg-blue-50/30 transition group">
                  <td className="p-4 font-semibold text-gray-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-[#1b2559]">{member.name}</p>
                      <p className="text-[11px] text-gray-500">{member.id}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1 text-xs text-gray-600 font-medium">
                      <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gray-400"/> {member.email}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm font-semibold text-gray-700">{member.role}</td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${
                      member.status === 'Online' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                      member.status === 'In Meeting' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        member.status === 'Online' ? 'bg-emerald-500' : 
                        member.status === 'In Meeting' ? 'bg-amber-400' : 'bg-gray-400'
                      }`}></span>
                      {member.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="p-2 text-gray-400 hover:text-[#5f41b2] transition-colors rounded-lg hover:bg-purple-50">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeamRoster;