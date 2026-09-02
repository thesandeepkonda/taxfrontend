// src/features/documentation/DocumentationWorkspace.tsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../../store';
import { 
  fetchDocClients, 
  fetchFollowUpClients, 
  fetchNotLiftedClients, 
  startClientCall, 
  endClientCall, 
  updateClientStatus, 
  postClientComment,
  DocClient 
} from '../../store/slices/docClientsSlice';
import {
  Phone,
  Mail,
  MessageCircle,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Loader2,
  PhoneOff,
  X
} from 'lucide-react';

const DocumentationWorkspace: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { list: clients, loading, activeCall } = useSelector((state: RootState) => state.docClients);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state for Follow Up & Call Back updates
  const [statusModal, setStatusModal] = useState({ isOpen: false, client: null as DocClient | null, newStatus: '' });
  const [updatePayload, setUpdatePayload] = useState({ remarks: '', nextFollowUpAt: '' });

  // Modal state for Call & Comments
  const [callModal, setCallModal] = useState({ isOpen: false, client: null as DocClient | null, comment: '', commentType: 'Follow up' });
  const [endingCall, setEndingCall] = useState(false);

  useEffect(() => {
    if (location.pathname.includes('follow-ups')) {
      dispatch(fetchFollowUpClients());
    } else if (location.pathname.includes('not-lifted')) {
      dispatch(fetchNotLiftedClients());
    } else {
      dispatch(fetchDocClients()); 
    }
  }, [dispatch, location.pathname]);

  // Adjust filtering logic so assigned tasks show all statuses
  let pageConfig = { title: 'Assigned Leads', filterStatuses: [], showAll: true, Icon: Users };
  if (location.pathname.includes('follow-ups')) {
    pageConfig = { title: 'Follow-ups Queue', filterStatuses: ['FOLLOW_UP', 'CALL_BACK'], showAll: false, Icon: Clock };
  } else if (location.pathname.includes('not-lifted')) {
    pageConfig = { title: 'Not Lifted Queue', filterStatuses: ['NOT_LIFTED'], showAll: false, Icon: PhoneOff };
  } else if (location.pathname.includes('completed')) {
    pageConfig = { title: 'Completed / Docs OK', filterStatuses: ['COMPLETED', 'DOCUMENTS_RECEIVED'], showAll: false, Icon: CheckCircle2 };
  } else if (location.pathname.includes('rejected')) {
    pageConfig = { title: 'Not Interested Leads', filterStatuses: ['NOT_INTERESTED'], showAll: false, Icon: XCircle };
  }

  const handlePhoneClick = async (client: DocClient) => {
    if (client.callInProgress) {
      // Re-open modal if they accidentally closed it while the call is still active
      setCallModal({ isOpen: true, client, comment: '', commentType: 'Follow up' });
    } else {
      try {
        await dispatch(startClientCall({
          clientId: client.clientId,
          providerCallId: `prov-${client.clientId}-${Date.now()}`
        })).unwrap();
        showToast(`Call started with ${client.name}`, 'info');
        setCallModal({ isOpen: true, client, comment: '', commentType: 'Follow up' });
      } catch (err: any) {
        showToast(err || 'Failed to start call', 'error');
      }
    }
  };

  const handleEndCallSubmit = async () => {
    if (!callModal.client) return;
    setEndingCall(true);

    try {
      // Submit comment if one was entered
      if (callModal.comment.trim()) {
        await dispatch(postClientComment({
          clientId: callModal.client.clientId,
          assignmentId: callModal.client.assignmentId,
          comment: callModal.comment,
          commentType: callModal.commentType
        })).unwrap();
        showToast('Comment saved successfully', 'success');
      }

      // End Call
      if (activeCall) {
        await dispatch(endClientCall({
          callId: activeCall.callId,
          payload: {
            providerCallId: `prov-${callModal.client.clientId}-${Date.now()}`,
            answered: true,
            recordingUrl: 'https://example.com/rec.mp3'
          }
        })).unwrap();
      }

      showToast(`Call ended with ${callModal.client.name}`, 'success');
      setCallModal({ isOpen: false, client: null, comment: '', commentType: 'Follow up' });
    } catch (err: any) {
      showToast(err || 'Failed to process call and comments', 'error');
    } finally {
      setEndingCall(false);
    }
  };

  const handleStatusChangeClick = (client: DocClient, newStatus: string) => {
    if (newStatus === 'FOLLOW_UP' || newStatus === 'CALL_BACK') {
      setStatusModal({ isOpen: true, client, newStatus });
      setUpdatePayload({ remarks: '', nextFollowUpAt: '' });
    } else {
      executeStatusUpdate(client.clientId, newStatus, null, null);
    }
  };

  const executeStatusUpdate = async (id: number, status: string, remarks: string | null, date: string | null) => {
    try {
      const isoDate = date ? new Date(date).toISOString() : null;
      await dispatch(updateClientStatus({ clientId: id, payload: { status, remarks, nextFollowUpAt: isoDate } })).unwrap();
      showToast('Status updated successfully', 'success');
      setStatusModal({ isOpen: false, client: null, newStatus: '' });
    } catch (e: any) {
      showToast(e || 'Failed to update status', 'error');
    }
  };

  const filteredClients = clients
    .filter(client => pageConfig.showAll || pageConfig.filterStatuses.includes(client.status))
    .filter(client =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(client.clientId).includes(searchQuery.toLowerCase())
    );

  const PageIcon = pageConfig.Icon;

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden relative">
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

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center shrink-0 bg-gray-50/50">
          <h2 className="text-lg font-bold text-[#1b2559] flex items-center gap-2">
            <PageIcon className="w-5 h-5 text-[#5f41b2]" />
            Queue ({filteredClients.length})
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#5f41b2]" />
              <p className="text-sm font-semibold">Loading client data...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
              <PageIcon className="w-12 h-12 opacity-20" />
              <p className="text-sm font-semibold">No leads found in this section.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 sticky top-0 z-10">
                <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="p-3">Client Details</th>
                  <th className="p-3">Contact Info</th>
                  <th className="p-3 text-center">Communication</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredClients.map((client) => (
                  <tr key={client.clientId} className="hover:bg-blue-50/30 transition group">
                    <td className="p-3">
                      <p className="font-bold text-[#1b2559]">{client.name}</p>
                      <p className="text-[11px] text-gray-500">ID: {client.clientId}</p>
                    </td>
                    <td className="p-3 font-medium text-gray-600">
                      <p className="text-xs">{client.maskedPhone}</p>
                      <p className="text-[11px] text-gray-400">{client.maskedEmail}</p>
                    </td>

                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          title={client.callInProgress ? "Call Active - Add Notes" : "Start Call"}
                          onClick={() => handlePhoneClick(client)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm ${
                            client.callInProgress 
                              ? 'bg-rose-500 text-white animate-pulse' 
                              : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'
                          }`}
                        >
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

                    <td className="p-3 text-center">
                      <select
                        value={client.status}
                        onChange={(e) => handleStatusChangeClick(client, e.target.value)}
                        className="text-xs font-bold border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#5f41b2] cursor-pointer bg-white"
                      >
                        <option value="NEW">New</option>
                        <option value="INTERESTED">Interested</option>
                        <option value="NOT_INTERESTED">Not Interested</option>
                        <option value="FOLLOW_UP">Follow Up</option>
                        <option value="NOT_LIFTED">Not Lifted</option>
                        <option value="CALL_BACK">Call Back</option>
                        <option value="DOCUMENTS_PENDING">Docs Pending</option>
                        <option value="DOCUMENTS_RECEIVED">Docs Received</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                    </td>

                    <td className="p-3 text-right">
                      <button
                        onClick={() => navigate(`/leads/detail/${client.clientId}`)}
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

      {/* Follow-up Modal */}
      {statusModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-[#1b2559] mb-4">Set Follow Up Details</h3>
            <p className="text-sm text-gray-500 mb-4">Scheduling follow up for {statusModal.client?.name}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Date & Time</label>
                <input 
                  type="datetime-local" 
                  value={updatePayload.nextFollowUpAt}
                  onChange={(e) => setUpdatePayload({...updatePayload, nextFollowUpAt: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5f41b2]" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Remarks</label>
                <textarea 
                  rows={3}
                  value={updatePayload.remarks}
                  onChange={(e) => setUpdatePayload({...updatePayload, remarks: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5f41b2] resize-none"
                  placeholder="Enter context for this follow up..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button 
                onClick={() => setStatusModal({ isOpen: false, client: null, newStatus: '' })}
                className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition"
              >
                Cancel
              </button>
              <button 
                onClick={() => executeStatusUpdate(statusModal.client!.clientId, statusModal.newStatus, updatePayload.remarks, updatePayload.nextFollowUpAt)}
                disabled={!updatePayload.nextFollowUpAt}
                className="px-4 py-2 text-sm font-bold bg-[#5f41b2] text-white rounded-lg hover:bg-[#4d3396] transition disabled:opacity-50"
              >
                Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call & Comments Modal */}
      {callModal.isOpen && callModal.client && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border-t-4 border-[#5f41b2]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-[#1b2559] flex items-center gap-2">
                  <Phone className="w-5 h-5 text-[#5f41b2] animate-pulse" />
                  Active Call
                </h3>
                <p className="text-sm text-gray-500 mt-1">Speaking with {callModal.client.name}</p>
              </div>
              <button
                onClick={() => setCallModal({ ...callModal, isOpen: false })}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Comment Type</label>
                <select
                  value={callModal.commentType}
                  onChange={(e) => setCallModal({ ...callModal, commentType: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5f41b2] bg-white text-sm"
                >
                  <option value="Follow up">Follow up</option>
                  <option value="Not Lifted">Not Lifted</option>
                  <option value="Interested">Interested</option>
                  <option value="Not Interested">Not Interested</option>
                  <option value="Docs Requested">Docs Requested</option>
                  <option value="General">General Comment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Call Notes / Comments</label>
                <textarea
                  rows={4}
                  value={callModal.comment}
                  onChange={(e) => setCallModal({ ...callModal, comment: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5f41b2] resize-none text-sm"
                  placeholder="Enter details discussed during the call..."
                />
              </div>
            </div>

            <button
              onClick={handleEndCallSubmit}
              disabled={endingCall}
              className="w-full py-3 text-sm font-bold bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition flex justify-center items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {endingCall ? <Loader2 className="w-5 h-5 animate-spin" /> : <PhoneOff className="w-5 h-5" />}
              {endingCall ? 'Saving & Ending...' : 'End Call & Save Comment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentationWorkspace;