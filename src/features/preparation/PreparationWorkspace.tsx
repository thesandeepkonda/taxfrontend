// src/features/preparation/PreparationWorkspace.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../store';
import { 
  fetchPrepClients, 
  fetchReadyForReviewClients, 
  fetchClientDrafts, 
  PrepClient, 
  PrepDocument, 
  PrepDraft 
} from '../../store/slices/prepSlice';
import api from '../../services/api';
import {
  Search,
  Filter,
  Clock,
  CheckSquare,
  Calculator,
  Loader2,
  X,
  Eye,
  FileText
} from 'lucide-react';

const PreparationWorkspace: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation(); 
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const prepState = useSelector((state: any) => state.prep || { list: [], loading: false });
  const { list, loading } = prepState;
  const [searchQuery, setSearchQuery] = useState('');

  // Drafts Modal States
  const [draftsModalOpen, setDraftsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<PrepClient | null>(null);
  const [clientDrafts, setClientDrafts] = useState<PrepDraft[]>([]);
  const [isFetchingDrafts, setIsFetchingDrafts] = useState(false);

  // Draft Viewer States
  const [isViewingDraft, setIsViewingDraft] = useState(false);
  const [viewingDraftUrl, setViewingDraftUrl] = useState<string | null>(null);
  const [viewingDocLoadingId, setViewingDocLoadingId] = useState<number | null>(null);

  const safeClients = Array.isArray(list) ? list : (list as any)?.content || [];

  let pageConfig = { title: 'Preparation Queue', Icon: Calculator };

  if (location.pathname.includes('in-progress')) {
    pageConfig = { title: 'In Progress Returns', Icon: Clock };
  } else if (location.pathname.includes('review')) {
    pageConfig = { title: 'Ready for Review', Icon: CheckSquare };
  }

  useEffect(() => {
    if (location.pathname.includes('review')) {
      dispatch(fetchReadyForReviewClients({ page: 0, size: 10 }));
    } else {
      dispatch(fetchPrepClients({ page: 0, size: 50 }));
    }
  }, [dispatch, location.pathname]);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'PREPARATION_ASSIGNED':
      case 'NEW':
      case 'PENDING': return <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-100 text-blue-700">Pending Prep</span>;
      case 'IN_PROGRESS': return <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-700">In Progress</span>;
      case 'QUERY_RAISED': return <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-100 text-rose-700">Query Raised</span>;
      case 'DRAFT_READY':
      case 'REVIEW_READY':
      case 'SUBMITTED': return <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-700">Review Ready</span>;
      default: return <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  // Frontend filtering removed for statuses; displaying everything returned by the backend
  const filteredTasks = safeClients
    .filter((task: PrepClient) => 
        (task.clientName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        String(task.clientId || '').includes(searchQuery.toLowerCase())
    );

  const PageIcon = pageConfig.Icon;

  // Handles opening the drafts modal
  const handleOpenDrafts = async (client: PrepClient) => {
    setSelectedClient(client);
    setDraftsModalOpen(true);
    setIsFetchingDrafts(true);
    try {
      const data = await dispatch(fetchClientDrafts(client.clientId)).unwrap();
      setClientDrafts(data);
    } catch (err: any) {
      console.error('Failed to fetch client drafts:', err);
      setClientDrafts([]);
    } finally {
      setIsFetchingDrafts(false);
    }
  };

  // Handles viewing a specific draft
  const handleViewDraft = async (draftId: number) => {
    setViewingDocLoadingId(draftId);
    try {
      const response = await api.get(`/prep/drafts/${draftId}/view`, {
        responseType: 'blob',
        headers: { 'Accept': '*/*' }
      });
      
      const mimeType = response.headers['content-type'] || 'application/pdf';
      const blob = new Blob([response.data], { type: mimeType });
      let fileUrl = window.URL.createObjectURL(blob);
      
      if (mimeType.includes('pdf')) {
          fileUrl += '#toolbar=0';
      }

      setViewingDraftUrl(fileUrl);
      setIsViewingDraft(true);
    } catch (error) {
      console.error('View draft error:', error);
      alert('Failed to load draft for viewing');
    } finally {
      setViewingDocLoadingId(null);
    }
  };

  const closeDraftViewer = () => {
    setIsViewingDraft(false);
    if (viewingDraftUrl) {
      const cleanUrl = viewingDraftUrl.split('#')[0];
      window.URL.revokeObjectURL(cleanUrl);
    }
    setViewingDraftUrl(null);
  };

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
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#5f41b2]" />
              <p className="text-sm font-semibold">Loading assignments...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
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
                {filteredTasks.map((task: PrepClient) => (
                  <tr key={task.assignmentId} className="hover:bg-blue-50/30 transition group">
                    <td className="p-3">
                      <p className="font-bold text-[#1b2559]">{task.clientName}</p>
                      <p className="text-[11px] text-gray-500">ID: {task.clientId}</p>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1.5">
                        {task.documents?.slice(0, 3).map((doc: PrepDocument, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-bold border bg-gray-50 text-gray-600 border-gray-200 truncate max-w-[120px]" title={doc.documentType}>
                            {doc.documentType}
                          </span>
                        ))}
                        {task.documents?.length > 3 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-gray-50 text-gray-600 border-gray-200">
                            +{task.documents.length - 3}
                          </span>
                        )}
                        {(!task.documents || task.documents.length === 0) && (
                           <span className="text-[10px] text-gray-400 italic">No docs available</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {getStatusBadge(task.status)}
                        <span className="text-[10px] text-gray-400 font-medium">
                          Assigned: {task.assignedAt ? new Date(task.assignedAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      {location.pathname.includes('review') ? (
                        <button 
                          onClick={() => handleOpenDrafts(task)}
                          className="text-xs font-bold bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition shadow-sm"
                        >
                          View Drafts
                        </button>
                      ) : (
                        <button 
                          onClick={() => navigate(`/prep/detail/${task.assignmentId}`)}
                          className="text-xs font-bold bg-[#5f41b2] text-white px-4 py-2 rounded-lg hover:bg-[#4d3396] transition"
                        >
                          Start Prep
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

      {/* --- Drafts List Modal --- */}
      {draftsModalOpen && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-[#1b2559] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#5f41b2]" />
                Drafts for {selectedClient.clientName}
              </h3>
              <button onClick={() => setDraftsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {isFetchingDrafts ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-[#5f41b2]" />
                  <p className="text-sm font-semibold">Loading drafts...</p>
                </div>
              ) : clientDrafts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
                  <FileText className="w-12 h-12 opacity-20" />
                  <p className="text-sm font-semibold">No drafts found for this client.</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50/50">
                    <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <th className="p-3 rounded-tl-lg">Version</th>
                      <th className="p-3">File Name</th>
                      <th className="p-3">Uploaded On</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right rounded-tr-lg">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {clientDrafts.map((draft) => (
                      <tr key={draft.draftId} className="hover:bg-blue-50/30 transition">
                        <td className="p-3 font-bold text-[#1b2559]">
                          v{draft.draftVersion}
                        </td>
                        <td className="p-3 font-medium text-gray-700">
                          {draft.fileName || 'Unnamed Draft'}
                          {draft.prepRemarks && <p className="text-[10px] text-gray-500 mt-1 italic max-w-xs truncate">"{draft.prepRemarks}"</p>}
                        </td>
                        <td className="p-3 text-gray-600 text-xs">
                          {draft.uploadedAt ? new Date(draft.uploadedAt).toLocaleString() : 'N/A'}
                          <p className="text-[10px] text-gray-400 mt-0.5">By {draft.prepEmployeeName}</p>
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-gray-100 text-gray-700">
                            {draft.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleViewDraft(draft.draftId)}
                            disabled={viewingDocLoadingId === draft.draftId}
                            className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition flex items-center gap-1 justify-end ml-auto disabled:opacity-50"
                          >
                            {viewingDocLoadingId === draft.draftId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                            View PDF
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
      )}

      {/* --- In-App Draft Viewer Modal --- */}
      {isViewingDraft && viewingDraftUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-8 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col overflow-hidden zoom-in-95">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <h3 className="text-lg font-bold text-[#1b2559] flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#5f41b2]" />
                Secure Draft Viewer
              </h3>
              <button 
                onClick={closeDraftViewer} 
                className="p-2 bg-white border border-gray-200 rounded-full hover:bg-rose-50 hover:text-rose-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 bg-gray-100 relative">
              <iframe
                src={viewingDraftUrl}
                className="w-full h-full border-none"
                title="Secure Draft Viewer"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PreparationWorkspace;