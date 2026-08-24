// src/features/documentation/ClientDocumentsView.tsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  FolderClock,
  FolderCheck,
  Phone,
  Mail,
  BellRing
} from 'lucide-react';

interface DocTask {
  id: string;
  clientId: string;
  clientName: string;
  phone: string;
  email: string;
  docsList: string[];
  status: 'AWAITING_CLIENT' | 'NEEDS_REVIEW' | 'VERIFIED';
  lastUpdated: string;
}

// Dummy Data
const mockPendingDocs: DocTask[] = [
  { id: 'TSK-101', clientId: 'LD-001', clientName: 'Rahul Sharma', phone: '+1 (555) 123-4567', email: 'rahul.s@email.com', docsList: ['W-2 Form', 'Passport Copy'], status: 'AWAITING_CLIENT', lastUpdated: '2 hrs ago' },
  { id: 'TSK-102', clientId: 'LD-002', clientName: 'Priya Patel', phone: '+1 (555) 987-6543', email: 'priya.p@email.com', docsList: ['1099-INT', 'Prior Year Return'], status: 'NEEDS_REVIEW', lastUpdated: '1 day ago' },
];

const mockVerifiedDocs: DocTask[] = [
  { id: 'TSK-103', clientId: 'LD-003', clientName: 'Michael Smith', phone: '+1 (555) 456-7890', email: 'mike.s@email.com', docsList: ['W-2 Form', 'SSN Card', 'ID Proof'], status: 'VERIFIED', lastUpdated: '2 days ago' },
  { id: 'TSK-104', clientId: 'LD-005', clientName: 'John Doe', phone: '+1 (555) 345-6789', email: 'john.d@email.com', docsList: ['1099-MISC', 'Passport Copy'], status: 'VERIFIED', lastUpdated: '3 days ago' },
];

const ClientDocumentsView: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');

  // Determine which page is currently active based on URL
  const isPendingView = location.pathname.includes('pending');
  
  const pageConfig = isPendingView ? {
    title: 'Pending Uploads',
    data: mockPendingDocs,
    Icon: FolderClock,
    docLabel: 'Missing / Pending Documents'
  } : {
    title: 'Verified Files',
    data: mockVerifiedDocs,
    Icon: FolderCheck,
    docLabel: 'Verified Documents'
  };

  // Permanent Masking Utilities for Employees
  const maskPhone = (phone: string) => phone.replace(/(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?/, '+1 (***) ***-');
  const maskEmail = (email: string) => {
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const [name, domain] = parts;
    const maskedName = name.length > 2 
      ? name.substring(0, 2) + '***' + name.substring(name.length - 1) 
      : name.substring(0, 1) + '***';
    return `${maskedName}@${domain}`;
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'AWAITING_CLIENT': return <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-100 text-rose-700 flex items-center gap-1"><Clock className="w-3 h-3"/> Awaiting Client</span>;
      case 'NEEDS_REVIEW': return <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-700 flex items-center gap-1"><Search className="w-3 h-3"/> Needs Review</span>;
      case 'VERIFIED': return <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Verified</span>;
      default: return null;
    }
  };

  const filteredTasks = pageConfig.data.filter(task => 
    task.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    task.clientId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const PageIcon = pageConfig.Icon;

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1b2559] tracking-tight leading-none">
            {pageConfig.title}
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1 flex items-center gap-2">
            Workspace: <span className="font-bold text-[#1b2559]">{user?.name}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search clients..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#5f41b2] shadow-sm w-64"
            />
          </div>
          <button className="bg-white border border-gray-200 p-2 rounded-full text-gray-500 hover:text-[#5f41b2] shadow-sm transition">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center shrink-0 bg-gray-50/50">
          <h2 className="text-lg font-bold text-[#1b2559] flex items-center gap-2">
            <PageIcon className="w-5 h-5 text-[#5f41b2]" />
            Document Queue ({filteredTasks.length})
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {filteredTasks.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
               <PageIcon className="w-12 h-12 opacity-20" />
               <p className="text-sm font-semibold">No documents found in this section.</p>
             </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 sticky top-0 z-10">
                <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="p-3">Client Details</th>
                  <th className="p-3">Contact Info</th>
                  <th className="p-3">{pageConfig.docLabel}</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-blue-50/30 transition group">
                    <td className="p-3">
                      <p className="font-bold text-[#1b2559]">{task.clientName}</p>
                      <p className="text-[11px] text-gray-500">{task.clientId}</p>
                    </td>
                    
                    {/* Permanently Masked Contact Info */}
                    <td className="p-3">
                      <div className="text-xs font-medium text-gray-700">
                        <p className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-gray-400"/> {maskPhone(task.phone)}</p>
                        <p className="flex items-center gap-1.5 mt-0.5"><Mail className="w-3 h-3 text-gray-400"/> {maskEmail(task.email)}</p>
                      </div>
                    </td>

                    {/* Documents List */}
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1.5">
                        {task.docsList.map((doc, idx) => (
                          <span key={idx} className={`px-2 py-0.5 rounded text-[10px] font-bold border ${isPendingView ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                            {doc}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="p-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {getStatusBadge(task.status)}
                        <span className="text-[10px] text-gray-400 font-medium">{task.lastUpdated}</span>
                      </div>
                    </td>

                    {/* Action Buttons */}
                    <td className="p-3 text-right">
                      {isPendingView ? (
                        <div className="flex items-center justify-end gap-2">
                          <button title="Send Reminder" className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white flex items-center justify-center transition-colors">
                            <BellRing className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => navigate(`/leads/detail/${task.clientId}`)}
                            className="text-xs font-bold bg-[#5f41b2] text-white px-3 py-1.5 rounded-lg hover:bg-[#4d3396] transition"
                          >
                            Upload Docs
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => navigate(`/leads/detail/${task.clientId}`)}
                          className="text-xs font-bold border border-[#5f41b2] text-[#5f41b2] px-4 py-1.5 rounded-lg hover:bg-purple-50 transition"
                        >
                          View Files
                        </button>
                      )}
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

export default ClientDocumentsView;