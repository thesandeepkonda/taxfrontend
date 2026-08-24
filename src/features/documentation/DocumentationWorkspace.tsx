// src/features/documentation/DocumentationWorkspace.tsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Phone, 
  Mail, 
  MessageCircle, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  XCircle,
  FileText,
  Users
} from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  visaStatus: string;
  status: 'NEW' | 'FOLLOW_UP' | 'DOCS_COLLECTED' | 'NOT_INTERESTED';
  lastContacted: string;
}

// Dummy Data
const mockLeads: Lead[] = [
  { id: 'LD-001', name: 'Rahul Sharma', phone: '+1 (555) 123-4567', email: 'rahul.s@email.com', visaStatus: 'H1B', status: 'NEW', lastContacted: 'Never' },
  { id: 'LD-002', name: 'Priya Patel', phone: '+1 (555) 987-6543', email: 'priya.p@email.com', visaStatus: 'F1 OPT', status: 'FOLLOW_UP', lastContacted: '2 hours ago' },
  { id: 'LD-003', name: 'Michael Smith', phone: '+1 (555) 456-7890', email: 'mike.s@email.com', visaStatus: 'Citizen', status: 'DOCS_COLLECTED', lastContacted: '1 day ago' },
  { id: 'LD-004', name: 'Anita Desai', phone: '+1 (555) 234-5678', email: 'anita.d@email.com', visaStatus: 'L1', status: 'NOT_INTERESTED', lastContacted: '3 days ago' },
  { id: 'LD-005', name: 'John Doe', phone: '+1 (555) 345-6789', email: 'john.d@email.com', visaStatus: 'Green Card', status: 'NEW', lastContacted: 'Never' },
  { id: 'LD-006', name: 'Srinivas Rao', phone: '+1 (555) 111-2222', email: 'sri.r@email.com', visaStatus: 'H4 EAD', status: 'FOLLOW_UP', lastContacted: '5 hours ago' },
];

const DocumentationWorkspace: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation(); 
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [searchQuery, setSearchQuery] = useState('');

  // URL batti Page Title, Icon, mariyu eh status Leads chupinchalo decide chestham
  let pageConfig = {
    title: 'New Assigned Leads',
    filterStatuses: ['NEW'],
    Icon: Users
  };

  if (location.pathname.includes('follow-ups')) {
    pageConfig = { title: 'Follow-ups Queue', filterStatuses: ['FOLLOW_UP'], Icon: Clock };
  } else if (location.pathname.includes('completed')) {
    pageConfig = { title: 'Completed / Docs OK', filterStatuses: ['DOCS_COLLECTED'], Icon: CheckCircle2 };
  } else if (location.pathname.includes('rejected')) {
    pageConfig = { title: 'Not Interested Leads', filterStatuses: ['NOT_INTERESTED'], Icon: XCircle };
  }

  // Status maarchagane data update avvadaniki
  const handleStatusChange = (id: string, newStatus: Lead['status']) => {
    setLeads(leads.map(lead => lead.id === id ? { ...lead, status: newStatus } : lead));
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'NEW': return <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-100 text-blue-700">New Lead</span>;
      case 'FOLLOW_UP': return <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-700 flex items-center gap-1"><Clock className="w-3 h-3"/> Follow Up</span>;
      case 'DOCS_COLLECTED': return <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Docs OK</span>;
      case 'NOT_INTERESTED': return <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-100 text-rose-700 flex items-center gap-1"><XCircle className="w-3 h-3"/> Not Int.</span>;
      default: return null;
    }
  };

  const filteredLeads = leads
    .filter(lead => pageConfig.filterStatuses.includes(lead.status))
    .filter(lead => 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      lead.id.toLowerCase().includes(searchQuery.toLowerCase())
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
              placeholder="Search leads..." 
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
            Queue ({filteredLeads.length})
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {filteredLeads.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
               <PageIcon className="w-12 h-12 opacity-20" />
               <p className="text-sm font-semibold">No leads found in this section.</p>
             </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 sticky top-0 z-10">
                <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="p-3">Client Details</th>
                  <th className="p-3">Visa Status</th>
                  <th className="p-3 text-center">Communication</th>
                  <th className="p-3 text-center">Status Mark</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-blue-50/30 transition group">
                    <td className="p-3">
                      <p className="font-bold text-[#1b2559]">{lead.name}</p>
                      <p className="text-[11px] text-gray-500">{lead.id}</p>
                    </td>
                    <td className="p-3 font-semibold text-gray-600">{lead.visaStatus}</td>
                    
                    {/* Communication Buttons */}
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button title="Call Client" className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-colors">
                          <Phone className="w-4 h-4" />
                        </button>
                        <button title="Email Client" className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white flex items-center justify-center transition-colors">
                          <Mail className="w-4 h-4" />
                        </button>
                        <button title="WhatsApp Client" className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-colors">
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                    {/* Status Dropdown */}
                    <td className="p-3 text-center">
                      <select 
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value as Lead['status'])}
                        className="text-xs font-bold border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#5f41b2] cursor-pointer bg-white"
                      >
                        <option value="NEW">New Lead</option>
                        <option value="FOLLOW_UP">Follow Up</option>
                        <option value="DOCS_COLLECTED">Docs Collected (OK)</option>
                        <option value="NOT_INTERESTED">Not Interested</option>
                      </select>
                      <div className="mt-1 flex justify-center">
                        {getStatusBadge(lead.status)}
                      </div>
                    </td>

                    {/* Action Button */}
                    <td className="p-3 text-right">
                      <button 
                        onClick={() => navigate(`/leads/detail/${lead.id}`)}
                        className="text-xs font-bold bg-[#5f41b2] text-white px-4 py-2 rounded-lg hover:bg-[#4d3396] transition"
                      >
                        View & Upload
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

export default DocumentationWorkspace;