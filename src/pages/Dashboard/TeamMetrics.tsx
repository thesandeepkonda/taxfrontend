// src/pages/Dashboard/TeamMetrics.tsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { BarChart2, TrendingUp, Activity, CheckCircle2, Clock } from 'lucide-react';

const TeamMetrics: React.FC = () => {
  const { user } = useAuth();
  const teamName = user?.team && user.team !== 'NONE' ? user.team : 'General';

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden">
      <div className="flex items-center justify-between shrink-0 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1b2559] tracking-tight leading-none flex items-center gap-3">
            <BarChart2 className="w-6 h-6 text-[#5f41b2]" /> Performance Metrics
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Analytics for {teamName} Team</p>
        </div>
        <select className="bg-white border border-gray-200 text-sm font-bold text-gray-700 px-4 py-2 rounded-lg shadow-sm focus:outline-none">
          <option>This Week</option>
          <option>This Month</option>
          <option>This Quarter</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6 shrink-0">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Tasks Completed</p>
            <h3 className="text-3xl font-extrabold text-[#1b2559]">452</h3>
            <p className="text-xs text-emerald-600 font-bold mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> +12% vs last week</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Avg Handle Time</p>
            <h3 className="text-3xl font-extrabold text-[#1b2559]">1.2 <span className="text-lg text-gray-500 font-bold">hrs</span></h3>
            <p className="text-xs text-emerald-600 font-bold mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> -5% vs last week</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Activity className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Quality Score</p>
            <h3 className="text-3xl font-extrabold text-[#1b2559]">98%</h3>
            <p className="text-xs text-gray-400 font-bold mt-1">Based on peer reviews</p>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center min-h-0">
        <div className="text-center">
          <BarChart2 className="w-16 h-16 text-gray-200 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-700">Detailed Analytics Chart</h3>
          <p className="text-sm text-gray-400">Visual representations of {teamName} workload will appear here.</p>
        </div>
      </div>
    </div>
  );
};

export default TeamMetrics;