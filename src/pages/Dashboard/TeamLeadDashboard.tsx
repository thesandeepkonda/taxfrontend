// src/pages/Dashboard/TeamLeadDashboard.tsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Users, 
  CheckSquare, 
  AlertTriangle, 
  Activity, 
  Search, 
  ChevronRight, 
  MessageSquare,
  Send,
  MoreVertical
} from 'lucide-react';

const TeamLeadDashboard: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Dynamic Data based on Team
  const teamName = user?.team || 'General';

  // KPI Metrics
  const metrics = {
    efficiency: '94%',
    pendingApprovals: 14,
    escalations: 3,
    activeAgents: '8 / 10'
  };

  // Mock Team Members Data
  const teamMembers = [
    { id: 'EMP-01', name: 'John Doe', status: 'Online', activeTasks: 12, efficiency: '96%' },
    { id: 'EMP-02', name: 'Sarah Martins', status: 'In Meeting', activeTasks: 8, efficiency: '91%' },
    { id: 'EMP-03', name: 'Akin Siyan', status: 'Online', activeTasks: 15, efficiency: '98%' },
    { id: 'EMP-04', name: 'Nimi Odu', status: 'Offline', activeTasks: 0, efficiency: '88%' },
  ];

  // Mock Approvals & Escalations
  const actionItems = [
    { id: 'TX-1099', agent: 'John Doe', type: 'Approval', issue: 'Final Review - High Value', time: '10 mins ago' },
    { id: 'TX-1102', agent: 'Sarah Martins', type: 'Escalation', issue: 'Client Dispute - Missing W2', time: '1 hr ago' },
    { id: 'TX-1105', agent: 'Akin Siyan', type: 'Approval', issue: 'Fee Discount Override', time: '2 hrs ago' },
  ];

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden">
      
      {/* Header Section */}
      <div className="flex items-center justify-between shrink-0 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1b2559] tracking-tight leading-none">
            Team Control Center
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1 flex items-center gap-2">
            Lead: <span className="font-bold text-[#1b2559]">{user?.name}</span> | 
            Managing Unit: <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md text-xs font-bold">{teamName}</span>
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search team or files..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#5f41b2] shadow-sm w-64 transition-all"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
        
        {/* Left Column (Metrics & Team Overview) */}
        <div className="flex-[2] flex flex-col min-h-0 gap-6">
          
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-4 shrink-0">
            <div className="bg-white rounded-2xl p-4 flex items-center space-x-3 shadow-sm border border-gray-100">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Team Efficiency</p>
                <h3 className="text-xl font-extrabold text-[#1b2559]">{metrics.efficiency}</h3>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-4 flex items-center space-x-3 shadow-sm border border-gray-100">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckSquare className="w-5 h-5" />
              </div>
               <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Pending Approvals</p>
                <h3 className="text-xl font-extrabold text-[#1b2559]">{metrics.pendingApprovals}</h3>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 flex items-center space-x-3 shadow-sm border border-gray-100">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
               <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Escalations</p>
                <h3 className="text-xl font-extrabold text-[#1b2559]">{metrics.escalations}</h3>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 flex items-center space-x-3 shadow-sm border border-gray-100">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                <Users className="w-5 h-5" />
              </div>
               <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Active Agents</p>
                <h3 className="text-xl font-extrabold text-[#1b2559]">{metrics.activeAgents}</h3>
              </div>
            </div>
          </div>

          {/* Team Overview Table */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold text-[#1b2559]">Live Team Overview</h2>
              <button className="text-sm font-semibold text-[#5f41b2] hover:underline">Manage Roster</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/50 sticky top-0 z-10">
                  <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <th className="p-3 rounded-tl-lg">Agent Name</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-center">Active Tasks</th>
                    <th className="p-3 text-center">Efficiency</th>
                    <th className="p-3 text-right rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {teamMembers.map((member, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/30 transition group">
                      <td className="p-3 font-semibold text-gray-800 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                          {member.name.charAt(0)}
                        </div>
                        {member.name}
                        <span className="text-[10px] text-gray-400 font-normal">({member.id})</span>
                      </td>
                      <td className="p-3">
                        <span className={`flex items-center gap-1.5 text-xs font-bold ${
                          member.status === 'Online' ? 'text-emerald-600' : 
                          member.status === 'In Meeting' ? 'text-amber-500' : 'text-gray-400'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${
                            member.status === 'Online' ? 'bg-emerald-500' : 
                            member.status === 'In Meeting' ? 'bg-amber-400' : 'bg-gray-300'
                          }`}></span>
                          {member.status}
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold text-[#1b2559]">{member.activeTasks}</td>
                      <td className="p-3 text-center">
                        <span className="bg-green-50 text-green-700 px-2 py-1 rounded-md text-xs font-bold">
                          {member.efficiency}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button className="p-1.5 text-gray-400 hover:text-[#5f41b2] transition-colors rounded-md hover:bg-purple-50">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (Action Items & Broadcast) */}
        <div className="flex-1 flex flex-col gap-6 shrink-0 min-h-0">
          
          {/* Approvals & Escalations */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-hidden">
            <div className="p-5 border-b border-gray-100 shrink-0">
              <h2 className="text-lg font-bold text-[#1b2559]">Action Required</h2>
              <p className="text-xs text-gray-500 mt-1">Files needing your review or intervention.</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {actionItems.map((item, idx) => (
                <div key={idx} className="border border-gray-100 rounded-xl p-3 hover:border-blue-200 transition cursor-pointer hover:shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      item.type === 'Escalation' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {item.type}
                    </span>
                    <span className="text-[10px] text-gray-400 font-semibold">{item.time}</span>
                  </div>
                  <h4 className="font-bold text-[#1b2559] text-sm mb-1">{item.id} - {item.issue}</h4>
                  <p className="text-xs text-gray-500 font-medium">Assigned to: <span className="text-gray-700 font-bold">{item.agent}</span></p>
                </div>
              ))}
            </div>
          </div>

          {/* Team Broadcast */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 shrink-0">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-[#5f41b2]" />
              <h2 className="text-lg font-bold text-[#1b2559]">Team Broadcast</h2>
            </div>
            
            <div className="space-y-3">
              <textarea 
                rows={3}
                placeholder="Send an announcement to the entire team..."
                className="w-full text-sm border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#5f41b2] resize-none bg-gray-50"
              ></textarea>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 font-medium">Visible to {teamName} team only</span>
                <button className="bg-[#5f41b2] hover:bg-[#4d3396] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                  <Send className="w-4 h-4" /> Send
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TeamLeadDashboard;