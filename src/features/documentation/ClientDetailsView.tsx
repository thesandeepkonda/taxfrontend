// src/features/documentation/ClientDetailsView.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import {
    requestClientDocuments,
    fetchDocClients,
    fetchMyDocumentRequests,
    fetchClientComments,
    fetchClientCallHippoHistory
  } from '../../store/slices/docClientsSlice';
import TaxOrganizerModal from './TaxOrganizerModal';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  Send,
  Copy,
  MessageCircle,
  X,
  UploadCloud,
  Clock,
  Activity,
  CalendarDays,
  RefreshCw,
  Plus,
  FolderClock,
  PhoneCall,
  PhoneOutgoing,
  PhoneOff,
  Loader2,
  XCircle
} from 'lucide-react';

const ClientDetailsView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  // Fetch clients, requests, comments and call history from Redux store
  const { list: clients, myRequests, comments, loading, clientCallHistory, isClientCallHistoryLoading } = useSelector((state: RootState) => state.docClients);
  const clientData = clients.find(c => String(c.clientId) === id);

  // Get the active document request for this specific client from Redux
  const clientRequest = myRequests.find(req => String(req.clientId) === id);

  // Document Request Modal States
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [customDoc, setCustomDoc] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // NEW: Tax Organizer & Call History Modal States
  const [organizerModalOpen, setOrganizerModalOpen] = useState(false);
  const [isCallHistoryModalOpen, setIsCallHistoryModalOpen] = useState(false);

  // Fetch clients, document requests, and comments on mount
  useEffect(() => {
    if (clients.length === 0) {
      dispatch(fetchDocClients());
    }
    // Always fetch latest requests to check submission status
    dispatch(fetchMyDocumentRequests());
    
    // Fetch comments for this client
    if (id) {
      dispatch(fetchClientComments(Number(id)));
    }
  }, [dispatch, clients.length, id]);

  const handleRefreshStatus = () => {
    dispatch(fetchMyDocumentRequests());
    if (id) {
      dispatch(fetchClientComments(Number(id)));
    }
  };

  const handleOpenCallHistory = () => {
    if (id) {
      dispatch(fetchClientCallHippoHistory(Number(id)));
      setIsCallHistoryModalOpen(true);
    }
  };

  // Custom Document Request Handlers
  const handleAddCustomDoc = () => {
    if (customDoc.trim() && !selectedDocs.includes(customDoc.trim())) {
      setSelectedDocs([...selectedDocs, customDoc.trim()]);
      setCustomDoc('');
    }
  };

  const handleRemoveDoc = (docToRemove: string) => {
    setSelectedDocs(selectedDocs.filter(doc => doc !== docToRemove));
  };

  const handleGenerateRequest = async () => {
    if (selectedDocs.length === 0) {
      alert('Please add at least one document to request.');
      return;
    }
    if (!expiresAt) {
      alert('Please select an expiry date.');
      return;
    }

    try {
      setIsGenerating(true);
      const clientIdNum = !isNaN(Number(id)) ? Number(id) : 1; 

      const payload = {
        clientId: clientIdNum,
        expiresAt: new Date(expiresAt).toISOString(),
        documentTypes: selectedDocs
      };
      
      // API call updates Redux `myRequests` directly
      await dispatch(requestClientDocuments(payload)).unwrap();
      
      // Reset and close modal
      setIsRequestModalOpen(false);
      setSelectedDocs([]);
      setExpiresAt('');
      setCustomDoc('');
    } catch (err: any) {
      alert(err || 'Failed to generate request');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = (shareUrl: string) => {
    if (shareUrl) {
      const fullUrl = `${window.location.origin}${shareUrl}`;
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsAppShare = async (shareUrl: string) => {
    if (shareUrl && clientData) {
      const fullUrl = `${window.location.origin}${shareUrl}`;
      const text = `Hello ${clientData.name}, please upload your requested documents securely using this link: ${fullUrl}`;
      
      try {
        // TODO: Replace with Admin's Internal WhatsApp API call
        console.log("Internal API call triggered:", text);
        alert('WhatsApp message sent successfully via internal API!');
      } catch (error) {
        alert('Failed to send WhatsApp message.');
      }
    }
  };

  const resetModal = () => {
    setIsRequestModalOpen(false);
    setSelectedDocs([]);
    setExpiresAt('');
    setCustomDoc('');
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString();
  };

  if (loading && !clientData) {
    return <div className="p-8 text-center text-gray-500">Loading client data...</div>;
  }

  if (!clientData) {
    return <div className="p-8 text-center text-rose-500 font-bold">Client not found!</div>;
  }

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 shrink-0 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 hover:text-[#5f41b2] transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-[#1b2559] tracking-tight leading-none flex items-center gap-3">
            {clientData.name}
            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-100 text-blue-700 uppercase">
              {clientData.status}
            </span>
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Client ID: {clientData.clientId} | Assignment ID: {clientData.assignmentId}
          </p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
        {/* Left Column: Client Details & Comments */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-[#1b2559] flex items-center gap-2">
              <User className="w-5 h-5 text-[#5f41b2]" />
              Personal Information
            </h2>
            <button 
              onClick={() => setOrganizerModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5f41b2] text-white rounded-lg text-xs font-bold hover:bg-[#4d3396] transition shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" /> View / Fill Organizer
            </button>
          </div>
          
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 relative group">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Mobile Number
                </label>
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-gray-800 text-sm">
                    {clientData.maskedPhone}
                  </p>
                  <button 
                    onClick={handleOpenCallHistory}
                    className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition shadow-sm flex items-center gap-1"
                  >
                    <PhoneCall className="w-3 h-3" /> Call Logs
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Email Address
                </label>
                <p className="font-semibold text-gray-800 text-sm truncate">
                  {clientData.maskedEmail}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                <label className="block text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Activity className="w-3 h-3" /> Current Stage
                </label>
                <p className="font-bold text-blue-700 text-sm">
                  {clientData.currentStage || 'N/A'}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" /> Last Contacted
                </label>
                <p className="font-semibold text-gray-800 text-sm">
                  {formatDate(clientData.lastCalledAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="mt-8 border-t border-gray-100 pt-6">
            <h2 className="text-lg font-bold text-[#1b2559] flex items-center gap-2 mb-4">
              <MessageCircle className="w-5 h-5 text-[#5f41b2]" />
              Client Comments & Remarks
            </h2>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {comments && comments.length > 0 ? (
                comments.map((c) => (
                  <div key={c.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-[#5f41b2]/30 transition">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-bold text-sm text-[#1b2559] block">{c.employeeName}</span>
                        <span className="inline-block px-2 py-0.5 mt-1 rounded bg-purple-100 text-purple-700 text-[10px] font-bold uppercase">
                          {c.commentType}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(c.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{c.comment}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
                  <MessageCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 font-medium">No comments found for this client.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Document List & Request Data */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-hidden">
          <div className="p-6 border-b border-gray-100 shrink-0 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#1b2559] flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-[#5f41b2]" />
              Document Vault
            </h2>
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition border border-blue-200 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              {clientRequest ? 'Request New Docs' : 'Request from Client'}
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Requested Documents Status</h3>
              <button onClick={handleRefreshStatus} title="Refresh Live Status" className="flex items-center gap-1 text-[10px] font-bold text-blue-500 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-md transition-colors">
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>
            
            {!clientRequest ? (
              <div className="text-center py-12 flex flex-col items-center">
                <FolderClock className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm font-semibold">No active document requests.</p>
                <p className="text-gray-400 text-xs mt-1">Generate a link to request documents from the client.</p>
              </div>
            ) : (
              <>
                {/* Status Banner */}
                <div className={`p-4 rounded-xl border flex items-center justify-between shadow-sm ${
                  clientRequest.submitted 
                    ? 'bg-emerald-50 border-emerald-200' 
                    : 'bg-amber-50 border-amber-200'
                }`}>
                  <div>
                    <p className={`text-sm font-extrabold ${clientRequest.submitted ? 'text-emerald-800' : 'text-amber-800'}`}>
                      {clientRequest.submitted ? 'Documents Submitted!' : 'Awaiting Client Submission'}
                    </p>
                    <p className={`text-xs font-medium ${clientRequest.submitted ? 'text-emerald-600' : 'text-amber-600'} mt-0.5`}>
                      {clientRequest.submitted 
                        ? 'The client has completed the document upload process.' 
                        : 'The client has not yet submitted the documents.'}
                    </p>
                  </div>
                  {clientRequest.submitted ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
                  ) : (
                    <Clock className="w-8 h-8 text-amber-500 animate-pulse shrink-0" />
                  )}
                </div>

                {/* Link Info */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                   <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Secure URL</p>
                   <div className="flex items-center gap-2">
                     <input 
                       type="text" 
                       readOnly 
                       value={`${window.location.origin}${clientRequest.shareUrl}`} 
                       className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 outline-none" 
                     />
                     <button 
                       onClick={() => handleCopyLink(clientRequest.shareUrl)}
                       className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                       title="Copy to clipboard"
                     >
                       {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                     </button>
                   </div>
                   <div className="mt-3">
                     <button 
                         onClick={() => handleWhatsAppShare(clientRequest.shareUrl)}
                         className="w-full bg-[#25D366] text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#20bd5a] transition shadow-sm"
                     >
                       <MessageCircle className="w-4 h-4" /> Send Link via WhatsApp
                     </button>
                   </div>
                </div>

                {/* Document List (Viewing disabled for employees) */}
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 pt-2">Document Checklist</h4>
                <div className="space-y-2">
                  {clientRequest.documents.map((doc: any) => {
                    const isUploaded = doc.status !== 'PENDING';
                    return (
                    <div key={doc.documentId} className={`flex items-center justify-between p-3 border rounded-xl transition ${isUploaded ? 'border-emerald-200 bg-emerald-50/40' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isUploaded ? 'bg-emerald-100 text-emerald-600' : 'bg-white border border-gray-200 text-gray-400'}`}>
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#1b2559] truncate">{doc.documentType}</p>
                          <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                             {isUploaded ? 'File Uploaded' : 'Pending Upload'}
                          </p>
                        </div>
                      </div>
                      {isUploaded ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Clock className="w-5 h-5 text-gray-300" />
                      )}
                    </div>
                  )})}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* --- Request Documents Modal --- */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-[#1b2559] flex items-center gap-2">
                <Send className="w-5 h-5 text-[#5f41b2]" />
                Request Documents
              </h3>
              <button onClick={resetModal} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <p className="text-sm text-gray-600 mb-4">
                Type the documents you need from <strong>{clientData.name}</strong> and add them to the list. A secure upload link will be generated.
              </p>
              
              <div className="mb-5">
                <label className="block text-sm font-bold text-gray-700 mb-2">Required Document Name</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={customDoc}
                    onChange={(e) => setCustomDoc(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomDoc()}
                    placeholder="e.g. 1099-INT, W-2 Form"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5f41b2] text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomDoc}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition flex items-center gap-1 text-sm"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
                
                {selectedDocs.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border border-gray-100 rounded-lg">
                    {selectedDocs.map((doc, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 bg-[#5f41b2]/10 text-[#5f41b2] px-3 py-1.5 rounded-lg text-sm font-semibold border border-[#5f41b2]/20">
                        {doc}
                        <button type="button" onClick={() => handleRemoveDoc(doc)} className="text-[#5f41b2]/50 hover:text-rose-500 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Link Expiry Date & Time</label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5f41b2]"
                />
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-white">
              <button
                onClick={resetModal}
                className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateRequest}
                disabled={isGenerating || selectedDocs.length === 0 || !expiresAt}
                className="px-5 py-2.5 flex items-center gap-2 text-sm font-bold bg-[#5f41b2] text-white rounded-xl hover:bg-[#4d3396] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isGenerating ? 'Generating...' : 'Generate Link'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CallHippo Client History Modal --- */}
      {isCallHistoryModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
           <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col overflow-hidden zoom-in-95 max-h-[85vh]">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                 <h3 className="text-lg font-bold text-[#1b2559] flex items-center gap-2">
                   <PhoneOutgoing className="w-5 h-5 text-blue-500" />
                   Call Log - {clientData.name}
                 </h3>
                 <button onClick={() => setIsCallHistoryModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition p-1 rounded-lg hover:bg-gray-100">
                   <X className="w-5 h-5" />
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto p-0">
                 {isClientCallHistoryLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-3">
                       <Loader2 className="w-8 h-8 animate-spin text-[#5f41b2]" />
                       <p className="text-sm font-semibold">Fetching call logs...</p>
                    </div>
                 ) : clientCallHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
                       <PhoneOff className="w-12 h-12 opacity-20 mb-2" />
                       <p className="text-sm font-semibold">No call records found for this client.</p>
                    </div>
                 ) : (
                    <table className="w-full text-left text-sm">
                       <thead className="bg-gray-50/80 sticky top-0 z-10">
                          <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                             <th className="p-4">Date & Time</th>
                             <th className="p-4">Agent Code</th>
                             <th className="p-4">Type</th>
                             <th className="p-4 text-center">Duration</th>
                             <th className="p-4 text-center">Status</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-50">
                          {clientCallHistory.map((call, idx) => (
                             <tr key={idx} className="hover:bg-blue-50/30 transition">
                                <td className="p-4 font-medium text-gray-700">
                                   {new Date(call.callTime).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'})}
                                </td>
                                <td className="p-4 text-gray-600 font-semibold">{call.employeeCode}</td>
                                <td className="p-4 text-gray-600">{call.callType || 'Outgoing'}</td>
                                <td className="p-4 text-center text-gray-600 font-medium">
                                   {call.durationSeconds ? `${Math.floor(call.durationSeconds / 60)}m ${call.durationSeconds % 60}s` : '-'}
                                </td>
                                <td className="p-4 text-center">
                                   {call.status === 'SUCCESS' || call.status === 'ANSWERED' ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100"><CheckCircle2 className="w-3 h-3" /> {call.status}</span>
                                   ) : call.status === 'FAILED' || call.status === 'MISSED' ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded border border-rose-100"><XCircle className="w-3 h-3" /> {call.status}</span>
                                   ) : (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100"><Clock className="w-3 h-3" /> {call.status}</span>
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
      )}

      {/* Tax Organizer Modal rendered when triggered from Client Details */}
      <TaxOrganizerModal 
        isOpen={organizerModalOpen} 
        onClose={() => setOrganizerModalOpen(false)} 
        clientId={Number(id)}
        clientName={clientData.name}
      />
    </div>
  );
};

export default ClientDetailsView;