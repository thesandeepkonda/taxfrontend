// src/features/estimation/EstimationWorkspace.tsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Filter, FileText, CheckCircle2 } from 'lucide-react';

const mockEstimations = [
  { id: 'EST-001', clientId: 'LD-003', name: 'Michael Smith', taxYear: '2023', refund: '$1,250', status: 'PENDING', date: '2 hrs ago' },
  { id: 'EST-002', clientId: 'LD-008', name: 'Sara Lee', taxYear: '2023', refund: 'Owes $400', status: 'SENT', date: '1 day ago' }
];

const EstimationWorkspace: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const isPending = location.pathname.includes('pending');
  const pageConfig = isPending 
    ? { title: 'Pending Estimates', statuses: ['PENDING'], Icon: FileText }
    : { title: 'Sent to Client', statuses: ['SENT'], Icon: CheckCircle2 };

  const filteredTasks = mockEstimations
    .filter(t => pageConfig.statuses.includes(t.status))
    .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.id.toLowerCase().includes(searchQuery.toLowerCase()));

  const PageIcon = pageConfig.Icon;

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden">
      <div className="flex items-center justify-between shrink-0 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1b2559] tracking-tight leading-none">{pageConfig.title}</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Review and draft tax summaries for clients</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search estimates..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#5f41b2] shadow-sm w-64" />
          </div>
          <button className="bg-white border border-gray-200 p-2 rounded-full text-gray-500 hover:text-[#5f41b2] shadow-sm transition"><Filter className="w-5 h-5" /></button>
        </div>
      </div>
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-2">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 sticky top-0 z-10">
              <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                <th className="p-3">Client</th>
                <th className="p-3">Summary</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredTasks.map((task) => (
                <tr key={task.id} className="hover:bg-blue-50/30 transition group">
                  <td className="p-3">
                    <p className="font-bold text-[#1b2559]">{task.name}</p>
                    <p className="text-[11px] text-gray-500">{task.id} | Client: {task.clientId}</p>
                  </td>
                  <td className="p-3 font-semibold text-gray-700">{task.refund}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${task.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => navigate(`/estimation/detail/${task.id}`)} className="text-xs font-bold bg-[#5f41b2] text-white px-4 py-2 rounded-lg hover:bg-[#4d3396] transition">
                      View Details
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
export default EstimationWorkspace;