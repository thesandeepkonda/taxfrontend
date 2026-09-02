// src/pages/Dashboard/TeamSchedules.tsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar as CalendarIcon, Clock, Users, Search } from 'lucide-react';

const TeamSchedules: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const teamName = user?.team && user.team !== 'NONE' ? user.team : 'General';

  const schedules = [
    { name: 'John Doe', shift: '09:00 AM - 05:00 PM EST', status: 'On Shift', days: 'Mon - Fri' },
    { name: 'Sarah Martins', shift: '11:00 AM - 07:00 PM EST', status: 'Upcoming', days: 'Mon - Fri' },
    { name: 'Akin Siyan', shift: '06:00 PM - 02:00 AM EST', status: 'Off Shift', days: 'Tue - Sat' },
  ];

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden">
      <div className="flex items-center justify-between shrink-0 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1b2559] tracking-tight leading-none flex items-center gap-3">
            <CalendarIcon className="w-7 h-7 text-[#5f41b2]" /> Team Schedules
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Shift management for {teamName} Team</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search schedules..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5f41b2] shadow-sm w-64"
          />
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-2">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 sticky top-0 z-10">
              <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                <th className="p-4 rounded-tl-lg">Agent Name</th>
                <th className="p-4">Working Days</th>
                <th className="p-4">Shift Timings</th>
                <th className="p-4 text-right rounded-tr-lg">Current Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {schedules.map((schedule, idx) => (
                <tr key={idx} className="hover:bg-blue-50/30 transition group">
                  <td className="p-4 font-semibold text-[#1b2559] flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                      <Users className="w-4 h-4" />
                    </div>
                    {schedule.name}
                  </td>
                  <td className="p-4 text-gray-600 font-medium">{schedule.days}</td>
                  <td className="p-4">
                    <span className="flex items-center gap-1.5 text-gray-700 font-bold bg-gray-100 px-3 py-1 rounded-lg w-max border border-gray-200">
                      <Clock className="w-3.5 h-3.5 text-[#5f41b2]" /> {schedule.shift}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${
                      schedule.status === 'On Shift' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                      schedule.status === 'Upcoming' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-50 text-gray-500 border-gray-200'
                    }`}>
                      {schedule.status}
                    </span>
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

export default TeamSchedules;