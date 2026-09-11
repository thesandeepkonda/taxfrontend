// src/features/documentation/ClientDocumentsView.tsx
import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchClientsByStatuses, clearDocClientsSearch } from '../../store/slices/docClientsSlice';
import DocGlobalSearch from './DocGlobalSearch';
import {
  Clock,
  CheckCircle2,
  FolderClock,
  FolderCheck,
  Phone,
  Mail,
  BellRing,
  Loader2
} from 'lucide-react';

const ClientDocumentsView: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  const { list: clients, loading, searchResults, searchActive, isSearching } = useSelector((state: RootState) => state.docClients);

  // Map Pending Uploads to DOCUMENTS_PENDING and Verified Files to DOCUMENTS_RECEIVED
  const isPendingView = location.pathname.includes('pending');
  
  const pageConfig = isPendingView ? {
    title: 'Pending Uploads',
    statuses: ['DOCUMENTS_PENDING'],
    Icon: FolderClock,
    docLabel: 'Status Stage'
  } : {
    title: 'Verified Files',
    statuses: ['DOCUMENTS_RECEIVED'],
    Icon: FolderCheck,
    docLabel: 'Status Stage'
  };

  useEffect(() => {
    dispatch(clearDocClientsSearch());
    dispatch(fetchClientsByStatuses(pageConfig.statuses));
  }, [dispatch, location.pathname]);

  const maskPhone = (phone: string | undefined | null) => {
    if (!phone) return 'N/A';
    return phone;
  };

  const maskEmail = (email: string | undefined | null) => {
    if (!email) return 'N/A';
    return email;
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'DOCUMENTS_PENDING': return <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-100 text-rose-700 flex items-center gap-1 w-max"><Clock className="w-3 h-3"/> Pending</span>;
      case 'DOCUMENTS_RECEIVED': return <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1 w-max"><CheckCircle2 className="w-3 h-3"/> Received</span>;
      default: return <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-gray-100 text-gray-700 w-max">{status?.replace(/_/g, ' ') || 'UNKNOWN'}</span>;
    }
  };

  // Safe search and match validation connected to Redux Search
  const sourceList = searchActive ? searchResults : clients;
  const filteredTasks = sourceList.filter(task => pageConfig.statuses.includes(task.status));

  const PageIcon = pageConfig.Icon;

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between shrink-0 mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1b2559] tracking-tight leading-none">
            {pageConfig.title}
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1 flex items-center gap-2">
            Workspace: <span className="font-bold text-[#1b2559]">{user?.name}</span>
          </p>
        </div>
        <DocGlobalSearch />
      </div>

      {/* Main Table Area */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center shrink-0 bg-gray-50/50">
          <h2 className="text-lg font-bold text-[#1b2559] flex items-center gap-2">
            <PageIcon className="w-5 h-5 text-[#5f41b2]" />
            {searchActive ? 'Search Results' : 'Document Queue'} ({filteredTasks.length})
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {loading || isSearching ? (
             <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
               <Loader2 className="w-8 h-8 animate-spin text-[#5f41b2]" />
               <p className="text-sm font-semibold">{isSearching ? 'Searching database...' : 'Loading documents...'}</p>
             </div>
          ) : filteredTasks.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
               <PageIcon className="w-12 h-12 opacity-20" />
               <p className="text-sm font-semibold">
                 {searchActive ? `No results found for this tab.` : 'No documents found in this section.'}
               </p>
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
                  <tr key={task.clientId} className="hover:bg-blue-50/30 transition group">
                    <td className="p-3">
                      <p className="font-bold text-[#1b2559]">{task.name}</p>
                      <p className="text-[11px] text-gray-500">ID: {task.clientId}</p>
                    </td>
                    
                    {/* Render raw backend values directly to prevent map crashes */}
                    <td className="p-3">
                      <div className="text-xs font-medium text-gray-700">
                        <p className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-gray-400"/> {maskPhone(task.maskedPhone)}</p>
                        <p className="flex items-center gap-1.5 mt-0.5"><Mail className="w-3 h-3 text-gray-400"/> {maskEmail(task.maskedEmail)}</p>
                      </div>
                    </td>

                    <td className="p-3">
                      <span className="font-semibold text-gray-700">
                        {task.currentStage || 'N/A'}
                      </span>
                    </td>

                    <td className="p-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {getStatusBadge(task.status)}
                        <span className="text-[10px] text-gray-400 font-medium">
                          {task.lastCalledAt ? new Date(task.lastCalledAt).toLocaleDateString() : ''}
                        </span>
                      </div>
                    </td>

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