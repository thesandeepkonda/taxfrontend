// src/features/preparation/PreparationWorkspace.tsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Clock, 
  CheckSquare, 
  Calculator,
  AlertCircle
} from 'lucide-react';

interface PrepTask {
  id: string;
  clientId: string;
  clientName: string;
  taxYear: string;
  formsRequired: string[];
  status: 'PENDING' | 'IN_PROGRESS' | 'QUERY_RAISED' | 'REVIEW_READY';
  assignedDate: string;
}

const mockTasks: PrepTask[] = [
  { id: 'PRP-001', clientId: 'LD-003', clientName: 'Michael Smith', taxYear: '2023', formsRequired: ['1040', 'W-2', 'Schedule A'], status: 'PENDING', assignedDate: '1 hr ago' },
  { id: 'PRP-002', clientId: 'LD-005', clientName: 'John Doe', taxYear: '2023', formsRequired: ['1040-NR', '1099-MISC'], status: 'IN_PROGRESS', assignedDate: '3 hrs ago' },
  { id: 'PRP-003', clientId: 'LD-008', clientName: 'Sara Lee', taxYear: '2023', formsRequired: ['1040', 'W-2'], status: 'QUERY_RAISED', assignedDate: '1 day ago' },
  { id: 'PRP-004', clientId: 'LD-009', clientName: 'David Kim', taxYear: '2023', formsRequired: ['1040', 'Schedule C'], status: 'REVIEW_READY', assignedDate: '2 days ago' }
];

const PreparationWorkspace: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation(); 
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<PrepTask[]>(mockTasks);
  const [searchQuery, setSearchQuery] = useState('');

  let pageConfig = { title: 'Preparation Queue', filterStatuses: ['PENDING'], Icon: Calculator };

  if (location.pathname.includes('in-progress')) {
    pageConfig = { title: 'In Progress Returns', filterStatuses: ['IN_PROGRESS'], Icon: Clock };
  } else if (location.pathname.includes('review')) {
    pageConfig = { title: 'Ready for Review', filterStatuses: ['REVIEW_READY'], Icon: CheckSquare };
  } else if (location.pathname.includes('queries')) {
    pageConfig = { title: 'Client Queries', filterStatuses: ['QUERY_RAISED'], Icon: AlertCircle };
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'PENDING': return <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-100 text-blue-700">Pending Prep</span>;
      case 'IN_PROGRESS': return <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-700">In Progress</span>;
      case 'QUERY_RAISED': return <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-100 text-rose-700">Query Raised</span>;
      case 'REVIEW_READY': return <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-700">Review Ready</span>;
      default: return null;
    }
  };

  const filteredTasks = tasks
    .filter(task => pageConfig.filterStatuses.includes(task.status))
    .filter(task => 
      task.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      task.clientId.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const PageIcon = pageConfig.Icon;

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden">
      <div className="flex items-center justify-between shrink-0 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1b2559] tracking-tight leading-none">{pageConfig.title}</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Assigned to: <span className="font-bold text-[#1b2559]">{user?.name}</span></p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search forms or clients..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#5f41b2] shadow-sm w-64"
            />
          </div>
          <button className="bg-white border border-gray-200 p-2 rounded-full text-gray-500 hover:text-[#5f41b2] shadow-sm transition"><Filter className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center shrink-0 bg-gray-50/50">
          <h2 className="text-lg font-bold text-[#1b2559] flex items-center gap-2">
            <PageIcon className="w-5 h-5 text-[#5f41b2]" /> Queue ({filteredTasks.length})
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {filteredTasks.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
               <PageIcon className="w-12 h-12 opacity-20" />
               <p className="text-sm font-semibold">No tasks found in this section.</p>
             </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 sticky top-0 z-10">
                <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="p-3">Client Details</th>
                  <th className="p-3">Required Forms</th>
                  <th className="p-3 text-center">Status Mark</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-blue-50/30 transition group">
                    <td className="p-3">
                      <p className="font-bold text-[#1b2559]">{task.clientName}</p>
                      <p className="text-[11px] text-gray-500">{task.clientId} • Tax Year: {task.taxYear}</p>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1.5">
                        {task.formsRequired.map((form, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-bold border bg-gray-50 text-gray-600 border-gray-200">{form}</span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {getStatusBadge(task.status)}
                        <span className="text-[10px] text-gray-400 font-medium">Assigned: {task.assignedDate}</span>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <button 
                        onClick={() => navigate(`/prep/detail/${task.id}`)}
                        className="text-xs font-bold bg-[#5f41b2] text-white px-4 py-2 rounded-lg hover:bg-[#4d3396] transition"
                      >
                        Start Prep
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreparationWorkspace;