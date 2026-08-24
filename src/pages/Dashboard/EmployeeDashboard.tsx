// src/pages/Dashboard/EmployeeDashboard.tsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FolderClock, 
  FileCheck2, 
  AlertCircle, 
  Clock, 
  ChevronRight, 
  FileText, 
  Send, 
  Search, 
  MessageSquare 
} from 'lucide-react';

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Dynamic logic to change content based on team
  const isDocTeam = user?.team === 'DOCUMENTATION';
  const isPrepTeam = user?.team === 'PREPARATION';
  const isEfilingTeam = user?.team === 'E-FILING';

  // Dynamic Metrics based on Team
  const metrics = {
    pending: isDocTeam ? 24 : isPrepTeam ? 18 : isEfilingTeam ? 12 : 8,
    completed: isDocTeam ? 45 : isPrepTeam ? 22 : isEfilingTeam ? 30 : 15,
    urgent: isDocTeam ? 5 : isPrepTeam ? 4 : isEfilingTeam ? 2 : 1
  };

  // Dynamic Queue Data based on Team
  const queueData = isDocTeam ? [
    { id: 'LD-1042', client: 'Acme Corp', status: 'Pending W2', time: '2 hrs ago', priority: 'High' },
    { id: 'LD-1045', client: 'John Doe', status: 'Reviewing 1099', time: '4 hrs ago', priority: 'Medium' },
    { id: 'LD-1050', client: 'TechFlow LLC', status: 'Missing Sign', time: '1 day ago', priority: 'Low' },
  ] : isPrepTeam ? [
    { id: 'PRP-001', client: 'Michael Smith', status: 'Pending Prep', time: '1 hr ago', priority: 'High' },
    { id: 'PRP-002', client: 'John Doe', status: 'In Progress', time: '3 hrs ago', priority: 'Medium' },
    { id: 'PRP-003', client: 'Sara Lee', status: 'Query Raised', time: '1 day ago', priority: 'Low' },
  ] : isEfilingTeam ? [
    { id: 'TX-0992', client: 'Stark Ind.', status: 'Ready to Transmit', time: '15 mins ago', priority: 'High' },
    { id: 'TX-0995', client: 'Wayne Ent.', status: 'IRS Rejected', time: '1 hr ago', priority: 'High' },
    { id: 'TX-0998', client: 'Bruce B', status: 'Transmitting', time: '2 hrs ago', priority: 'Medium' },
  ] : [
    { id: 'GEN-01', client: 'General Task', status: 'Pending', time: 'Now', priority: 'Low' }
  ];

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden">
      
      {/* Header Section */}
      <div className="flex items-center justify-between shrink-0 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1b2559] tracking-tight leading-none">
            Welcome back, {user?.name}
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1 flex items-center gap-2">
            Workspace: <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md text-xs font-bold">{user?.team}</span>
          </p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search client or ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#5f41b2] shadow-sm w-64 transition-all"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
        
        {/* Left Column (Metrics & Queue) */}
        <div className="flex-[2] flex flex-col min-h-0 gap-6">
          
          {/* KPI Cards */}
          <div className="grid grid-cols-3 gap-4 shrink-0">
            <div className="bg-white rounded-2xl p-4 flex items-center space-x-4 shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                <FolderClock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Pending Tasks</p>
                <h3 className="text-2xl font-extrabold text-[#1b2559]">{metrics.pending}</h3>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-4 flex items-center space-x-4 shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-500 shrink-0">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Completed Today</p>
                <h3 className="text-2xl font-extrabold text-[#1b2559]">{metrics.completed}</h3>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 flex items-center space-x-4 shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Urgent Action</p>
                <h3 className="text-2xl font-extrabold text-[#1b2559]">{metrics.urgent}</h3>
              </div>
            </div>
          </div>

          {/* Active Work Queue */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold text-[#1b2559]">Active Work Queue</h2>
              <button className="text-sm font-semibold text-[#5f41b2] hover:underline">View All</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/50 sticky top-0 z-10">
                  <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <th className="p-3 rounded-tl-lg">Task ID</th>
                    <th className="p-3">Client Name</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Last Updated</th>
                    <th className="p-3 text-right rounded-tr-lg">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {queueData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/30 transition group cursor-pointer">
                      <td className="p-3 font-bold text-[#1b2559]">{item.id}</td>
                      <td className="p-3 font-semibold text-gray-700">{item.client}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                          item.priority === 'High' ? 'bg-red-100 text-red-700' : 
                          item.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : 
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-3 text-gray-500 font-medium flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> {item.time}
                      </td>
                      <td className="p-3 text-right">
                        <button className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 group-hover:bg-[#5f41b2] group-hover:text-white flex items-center justify-center ml-auto transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (Quick Actions & Notifications) */}
        <div className="flex-1 flex flex-col gap-6 shrink-0 min-h-0">
          
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 shrink-0">
            <h2 className="text-lg font-bold text-[#1b2559] mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 hover:border-[#5f41b2] hover:bg-[#5f41b2]/5 transition group">
                <FileText className="w-6 h-6 text-gray-400 group-hover:text-[#5f41b2] mb-2 transition" />
                <span className="text-xs font-bold text-gray-600 group-hover:text-[#5f41b2]">New Task</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition group">
                <Send className="w-6 h-6 text-gray-400 group-hover:text-blue-500 mb-2 transition" />
                <span className="text-xs font-bold text-gray-600 group-hover:text-blue-600">Client Message</span>
              </button>
            </div>
          </div>

          {/* Internal Messages */}
          <div className="flex-1 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h2 className="text-lg font-bold text-[#1b2559] flex items-center gap-2">
                Team Messages
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">2</span>
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0 text-xs">
                  TL
                </div>
                <div className="bg-gray-50 p-3 rounded-xl rounded-tl-none border border-gray-100 text-sm">
                  <p className="font-bold text-[#1b2559] text-xs mb-1">Team Lead <span className="text-gray-400 font-normal ml-2">10:45 AM</span></p>
                  <p className="text-gray-600">Please prioritize the urgent verifications. We have clients calling in 1 hour.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold shrink-0 text-xs">
                  SYS
                </div>
                <div className="bg-purple-50 p-3 rounded-xl rounded-tl-none border border-purple-100 text-sm w-full">
                  <p className="font-bold text-purple-900 text-xs mb-1">System Alert <span className="text-purple-400 font-normal ml-2">09:00 AM</span></p>
                  <p className="text-purple-700">IRS Gateway is currently experiencing minor delays. Plan accordingly.</p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 shrink-0">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Reply to team..." 
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-3 pr-10 py-2 text-sm focus:outline-none focus:border-[#5f41b2]"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#5f41b2]">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;