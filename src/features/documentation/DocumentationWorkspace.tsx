// src/features/documentation/DocumentationWorkspace.tsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../../store';
import { apiDev2 } from '../../services/api';

// FIX: Separated Type import to solve Vite Initialization Error
import type { DocClient } from '../../store/slices/docClientsSlice';
import { 
  fetchDocClients,
  fetchClientsByStatuses,
  startClientCall, 
  updateClientStatus, 
  postClientComment,
  createCallReminder,
  fetchCallHistory,
  clearDocClientsSearch,
  setCallHippoStatus
} from '../../store/slices/docClientsSlice';

import DocGlobalSearch from './DocGlobalSearch';
import TaxOrganizerModal from './TaxOrganizerModal';
import {
  Phone, Mail, MessageCircle, Clock, 
  CheckCircle2, XCircle, Users, Loader2, PhoneOff, X, FileText
} from 'lucide-react';

const DocumentationWorkspace: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { 
    list: clients, 
    loading, 
    activeCall, 
    callHistory, 
    searchResults, 
    searchActive, 
    isSearching,
    isCallHippoAvailable,
    isCallHippoStatusLoading,
    isSettingReminder
  } = useSelector((state: RootState) => state.docClients);

  const [statusModal, setStatusModal] = useState({ isOpen: false, client: null as DocClient | null, newStatus: '' });
  const [updatePayload, setUpdatePayload] = useState({ remarks: '', nextFollowUpAt: '' });
  const [callModal, setCallModal] = useState({ isOpen: false, client: null as DocClient | null, comment: '', commentType: 'Follow up', reminderTime: 0 });
  const [savingComment, setSavingComment] = useState(false);

  // Pagination states
  const [clientPage, setClientPage] = useState(0);
  const [hasMoreClients, setHasMoreClients] = useState(true);

  // Tax Organizer Modal States
  const [organizerModal, setOrganizerModal] = useState({ isOpen: false, clientId: 0, clientName: '' });

  // Checking user team for Call Feature Visibility
  const teamString = String(user?.departmentName || user?.teamName || user?.team || '').toUpperCase();
  const isCallEnabled = teamString.includes('DOC') || teamString.includes('ESTIM');

  // Determine routing configuration based on current pathname
  let pageConfig = { title: 'Assigned Leads', filterStatuses: [] as string[], isAssigned: true, Icon: Users };
  const path = location.pathname;
  if (path.includes('not-interested')) {
    pageConfig = { title: 'Not Interested Leads', filterStatuses: ['NOT_INTERESTED'], isAssigned: false, Icon: XCircle };
  } else if (path.includes('interested')) {
    pageConfig = { title: 'Interested Leads', filterStatuses: ['INTERESTED'], isAssigned: false, Icon: CheckCircle2 };
  } else if (path.includes('follow-ups')) {
    pageConfig = { title: 'Follow-ups Queue', filterStatuses: ['FOLLOW_UP'], isAssigned: false, Icon: Clock };
  } else if (path.includes('call-back')) {
    pageConfig = { title: 'Call Back Queue', filterStatuses: ['CALL_BACK'], isAssigned: false, Icon: Phone };
  } else if (path.includes('not-lifted')) {
    pageConfig = { title: 'Not Lifted Queue', filterStatuses: ['NOT_LIFTED'], isAssigned: false, Icon: PhoneOff };
  } else if (path.includes('completed')) {
    pageConfig = { title: 'Completed / Docs OK', filterStatuses: ['COMPLETED'], isAssigned: false, Icon: CheckCircle2 };
  }

  useEffect(() => {
    dispatch(clearDocClientsSearch());
    setClientPage(0);
    setHasMoreClients(true);
    
    if (pageConfig.isAssigned) {
      dispatch(fetchDocClients({ page: 0, size: 20, append: false }))
        .unwrap()
        .then((res: any) => {
           const data = res?.data || res;
           const content = Array.isArray(data) ? data : (data?.content || []);
           setHasMoreClients(data.last !== undefined ? !data.last : content.length >= 20);
        }).catch(() => setHasMoreClients(false));
    } else {
      dispatch(fetchClientsByStatuses({ statuses: pageConfig.filterStatuses, page: 0, size: 20, append: false }))
        .unwrap()
        .then((res: any) => {
           const data = res?.data || res;
           const content = Array.isArray(data) ? data : (data?.content || []);
           setHasMoreClients(data.last !== undefined ? !data.last : content.length >= 20);
        }).catch(() => setHasMoreClients(false));
    }
    dispatch(fetchCallHistory());
  }, [dispatch, location.pathname]);

  const handleClientScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop - target.clientHeight < 50) {
      if (!loading && !isSearching && hasMoreClients && !searchActive) {
        const nextPage = clientPage + 1;
        setClientPage(nextPage);
        
        if (pageConfig.isAssigned) {
          dispatch(fetchDocClients({ page: nextPage, size: 20, append: true }))
            .unwrap()
            .then((res: any) => {
              const data = res?.data || res;
              const content = Array.isArray(data) ? data : (data?.content || []);
              setHasMoreClients(data.last !== undefined ? !data.last : content.length > 0);
            }).catch(() => setHasMoreClients(false));
        } else {
          dispatch(fetchClientsByStatuses({ statuses: pageConfig.filterStatuses, page: nextPage, size: 20, append: true }))
            .unwrap()
            .then((res: any) => {
              const data = res?.data || res;
              const content = Array.isArray(data) ? data : (data?.content || []);
              setHasMoreClients(data.last !== undefined ? !data.last : content.length > 0);
            }).catch(() => setHasMoreClients(false));
        }
      }
    }
  };

  const handleCallHippoToggle = async () => {
    const newStatus = !isCallHippoAvailable;
    try {
      await dispatch(setCallHippoStatus(newStatus)).unwrap();
      showToast(`CallHippo status changed to ${newStatus ? 'Available' : 'Offline'}`, 'success');
    } catch (err: any) {
      showToast(err || 'Failed to update CallHippo status', 'error');
    }
  };

  const handlePhoneClick = async (client: DocClient) => {
    if (client.callInProgress) {
      setCallModal({ isOpen: true, client, comment: '', commentType: 'Follow up', reminderTime: 0 });
    } else {
      if (!isCallHippoAvailable) {
        showToast('Please set your CallHippo status to Available before making a call.', 'warning');
        return;
      }
      try {
        await dispatch(startClientCall(client.clientId)).unwrap(); 
        showToast(`Call initiated with ${client.name}`, 'info');
        setCallModal({ isOpen: true, client, comment: '', commentType: 'Follow up', reminderTime: 0 });
        dispatch(fetchCallHistory());
      } catch (err: any) {
        showToast(err || 'Failed to start call', 'error');
      }
    }
  };

  const handleWhatsAppClick = async (client: DocClient) => {
    try {
      showToast('Opening secure WhatsApp chat...', 'info');
      const response = await apiDev2.get(`/callhippo/whatsapp/${client.clientId}`);
      
      if (response.data && response.data.success && response.data.url) {
        const url = response.data.url;
        
        const match = url.match(/\d+$/);
        const cleanPhone = match ? match[0] : null;

        if (cleanPhone) {
          const appUrl = `whatsapp://send?phone=${cleanPhone}`;
          const webUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}`;

          window.location.href = appUrl;

          let appOpened = false;
          const onBlur = () => { appOpened = true; };
          window.addEventListener('blur', onBlur);

          setTimeout(() => {
            window.removeEventListener('blur', onBlur);
            if (!appOpened) {
              window.open(webUrl, '_blank');
            }
          }, 1500);

        } else {
          window.open(url, '_blank');
        }
      } else {
        showToast('WhatsApp link not available for this client.', 'warning');
      }
    } catch (err: any) {
      showToast('Failed to fetch WhatsApp link.', 'error');
    }
  };

  const handleSaveComment = async () => {
    if (!callModal.client) return;
    setSavingComment(true);
    
    try {
      if (callModal.comment.trim()) {
        await dispatch(postClientComment({
          clientId: callModal.client.clientId, 
          assignmentId: callModal.client.assignmentId,
          comment: callModal.comment,
          commentType: callModal.commentType
        })).unwrap();
        showToast('Comment saved successfully', 'success');
      }

      if (callModal.reminderTime > 0) {
        await dispatch(createCallReminder({
          clientId: callModal.client.clientId,
          reminderTime: Number(callModal.reminderTime) 
        })).unwrap();
        showToast(`Reminder set for ${callModal.reminderTime} minutes`, 'success');
      }

      setCallModal({ isOpen: false, client: null, comment: '', commentType: 'Follow up', reminderTime: 0 });
      
      if (!searchActive) {
        setClientPage(0);
        setHasMoreClients(true);
        if (pageConfig.isAssigned) {
          dispatch(fetchDocClients({ page: 0, size: 20, append: false }));
        } else {
          dispatch(fetchClientsByStatuses({ statuses: pageConfig.filterStatuses, page: 0, size: 20, append: false }));
        }
      }
      dispatch(fetchCallHistory());
    } catch (err: any) {
      showToast(err || 'Failed to process actions', 'error');
    } finally {
      setSavingComment(false);
    }
  };

  const handleStatusChangeClick = (client: DocClient, newStatus: string) => {
    if (newStatus === 'FOLLOW_UP' || newStatus === 'CALL_BACK') {
      setStatusModal({ isOpen: true, client, newStatus });
      setUpdatePayload({ remarks: '', nextFollowUpAt: '' });
    } else {
      executeStatusUpdate(client.assignmentId, newStatus, null, null);
    }
  };

  const executeStatusUpdate = async (assignmentId: number, status: string, remarks: string | null, date: string | null) => {
    try {
      const isoDate = date ? new Date(date).toISOString() : null;
      await dispatch(updateClientStatus({ clientId: assignmentId, payload: { status, remarks, nextFollowUpAt: isoDate } })).unwrap();
      showToast('Status updated successfully', 'success');
      setStatusModal({ isOpen: false, client: null, newStatus: '' });
      
      if (!searchActive) {
        setClientPage(0);
        setHasMoreClients(true);
        if (pageConfig.isAssigned) {
          dispatch(fetchDocClients({ page: 0, size: 20, append: false }));
        } else {
          dispatch(fetchClientsByStatuses({ statuses: pageConfig.filterStatuses, page: 0, size: 20, append: false }));
        }
      }
    } catch (e: any) {
      showToast(e || 'Failed to update status', 'error');
    }
  };

  const sourceList = searchActive ? searchResults : clients;
  const filteredClients = sourceList.filter(client => {
    if (pageConfig.isAssigned) return true;
    return pageConfig.filterStatuses.includes(client.status);
  });

  const PageIcon = pageConfig.Icon;

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden relative">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between shrink-0 mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1b2559] tracking-tight leading-none">
            {pageConfig.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-2">
            <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
              Workspace: <span className="font-bold text-[#1b2559]">{user?.name}</span>
            </p>
            <div className="hidden sm:block w-px h-4 bg-gray-300"></div>
            
            {/* CallHippo Active/Inactive Toggle - Visible only for authorized teams */}
            {isCallEnabled && (
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                <span className="text-xs font-bold text-gray-600">CallHippo:</span>
                <button
                  onClick={handleCallHippoToggle}
                  disabled={isCallHippoStatusLoading}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 cursor-pointer ${isCallHippoAvailable ? 'bg-emerald-500' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isCallHippoAvailable ? 'translate-x-4.5' : 'translate-x-1'}`} />
                </button>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isCallHippoAvailable ? 'text-emerald-600' : 'text-gray-500'}`}>
                  {isCallHippoAvailable ? 'Available' : 'Offline'}
                </span>
              </div>
            )}
          </div>
        </div>
        <DocGlobalSearch />
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-2" onScroll={handleClientScroll}>
          {(loading && clientPage === 0) || isSearching ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#5f41b2]" />
              <p className="text-sm font-semibold">{isSearching ? 'Searching database...' : 'Loading client data...'}</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
              <PageIcon className="w-12 h-12 opacity-20" />
              <p className="text-sm font-semibold">
                {searchActive ? `No results found for this tab.` : 'No leads found in this section.'}
              </p>
            </div>
          ) : (
            <>
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
                          {isCallEnabled && (
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
                          )}
                          <button title="Email Client" className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white flex items-center justify-center transition-colors">
                            <Mail className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleWhatsAppClick(client)}
                            title="WhatsApp Client" 
                            className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-colors"
                          >
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
              {loading && clientPage > 0 && (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-[#5f41b2]" />
                </div>
              )}
            </>
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
                onClick={() => executeStatusUpdate(statusModal.client!.assignmentId, statusModal.newStatus, updatePayload.remarks, updatePayload.nextFollowUpAt)}
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
                  Active Client Options
                </h3>
                <p className="text-sm text-gray-500 mt-1">Manage details for {callModal.client.name}</p>
              </div>
              <button
                onClick={() => setCallModal({ ...callModal, isOpen: false })}
                className="text-gray-400 hover:text-gray-600 transition p-1 hover:bg-gray-100 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-blue-900">Tax Organizer</p>
                <p className="text-xs text-blue-700 mt-0.5">Collect client filing info</p>
              </div>
              <button 
                onClick={() => setOrganizerModal({ isOpen: true, clientId: callModal.client!.clientId, clientName: callModal.client!.name })}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition shadow-sm"
              >
                <FileText className="w-3.5 h-3.5" /> Fill Details
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-sm font-bold text-gray-700 mb-1">Remind In (Mins)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="E.g., 30"
                    value={callModal.reminderTime || ''}
                    onChange={(e) => setCallModal({ ...callModal, reminderTime: Number(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5f41b2] bg-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Call Notes / Comments</label>
                <textarea
                  rows={3}
                  value={callModal.comment}
                  onChange={(e) => setCallModal({ ...callModal, comment: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5f41b2] resize-none text-sm"
                  placeholder="Enter details discussed during the call..."
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setCallModal({ ...callModal, isOpen: false })}
                className="w-full py-3 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handleSaveComment}
                disabled={savingComment || isSettingReminder || (!callModal.comment.trim() && callModal.reminderTime === 0)}
                className="w-full py-3 text-sm font-bold bg-[#5f41b2] text-white rounded-xl hover:bg-[#4d3396] transition flex justify-center items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {(savingComment || isSettingReminder) ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                {(savingComment || isSettingReminder) ? 'Saving...' : 'Save & Remind'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tax Organizer Modal rendered when triggered */}
      <TaxOrganizerModal 
        isOpen={organizerModal.isOpen} 
        onClose={() => setOrganizerModal({ isOpen: false, clientId: 0, clientName: '' })} 
        clientId={organizerModal.clientId}
        clientName={organizerModal.clientName}
      />
    </div>
  );
};

export default DocumentationWorkspace;