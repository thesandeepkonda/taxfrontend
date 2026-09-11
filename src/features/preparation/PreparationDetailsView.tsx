// src/features/preparation/PreparationDetailsView.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../store';
import { useToast } from '../../contexts/ToastContext';
import { fetchPrepClients, submitPrepDraft, PrepClient, PrepDocument } from '../../store/slices/prepSlice';
import api from '../../services/api';
import {
  ArrowLeft, User, Phone, Mail, ShieldAlert, FileText,
  CheckCircle2, MessageSquareWarning, Calculator, UploadCloud, Loader2, Eye, X, Download, Send
} from 'lucide-react';

const PreparationDetailsView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();

  const prepState = useSelector((state: any) => state.prep || { list: [], loading: false });
  const safeClients = Array.isArray(prepState.list) ? prepState.list : prepState.list?.content || [];
  const clientData: PrepClient | undefined = safeClients.find((c: any) => String(c.assignmentId) === id);

  const [draftFile, setDraftFile] = useState<File | null>(null);
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Document Viewer States
  const [docLoadingId, setDocLoadingId] = useState<number | null>(null);
  const [viewingDocUrl, setViewingDocUrl] = useState<string | null>(null);
  const [viewingDocType, setViewingDocType] = useState<string>('');
  const [isViewing, setIsViewing] = useState(false);
  const [downloadingDocId, setDownloadingDocId] = useState<number | null>(null);

  // Query Modal States
  const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);
  const [queryComment, setQueryComment] = useState('');
  const [isSubmittingQuery, setIsSubmittingQuery] = useState(false);

  const [checklist, setChecklist] = useState({
    docMatch: false,
    dataEntry: false,
    qualityReview: false
  });

  useEffect(() => {
    if (safeClients.length === 0) {
      dispatch(fetchPrepClients({ page: 0, size: 50 }));
    }
  }, [dispatch, safeClients.length]);

  const handleChecklist = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleViewDocument = async (documentId: number, contentType: string | null) => {
    if (!clientData?.assignmentId) return;
    setDocLoadingId(documentId);
    
    try {
      const response = await api.get(`/prep/clients/${clientData.assignmentId}/documents/${documentId}/view`, {
        responseType: 'blob',
        headers: {
          'Accept': '*/*'
        }
      });
      
      const mimeType = response.headers['content-type'] || contentType || 'application/pdf';
      const blob = new Blob([response.data], { type: mimeType });
      let fileUrl = window.URL.createObjectURL(blob);

      if (mimeType.includes('pdf')) {
          fileUrl += '#toolbar=0';
      }

      setViewingDocUrl(fileUrl);
      setViewingDocType(mimeType);
      setIsViewing(true);
    } catch (error) {
      console.error('View document error:', error);
      showToast('Failed to load document for viewing', 'error');
    } finally {
      setDocLoadingId(null);
    }
  };

  const handleDownloadDocument = async (documentId: number, fileName: string | null) => {
      if (!clientData?.assignmentId) return;
      setDownloadingDocId(documentId);
      
      try {
        const response = await api.get(`/prep/clients/${clientData.assignmentId}/documents/${documentId}/download`, {
          responseType: 'blob',
          headers: {
            'Accept': '*/*'
          }
        });
        
        const blob = new Blob([response.data], { type: response.headers['content-type'] });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        const contentDisposition = response.headers['content-disposition'];
        let downloadFileName = fileName || `document_${documentId}`;
        if (contentDisposition) {
            const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
            if (fileNameMatch && fileNameMatch.length === 2) {
                downloadFileName = fileNameMatch[1];
            }
        }
        
        link.setAttribute('download', downloadFileName);
        document.body.appendChild(link);
        link.click();
        
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
        
      } catch (error) {
        console.error('Download document error:', error);
        showToast('Failed to download document', 'error');
      } finally {
        setDownloadingDocId(null);
      }
    };

  const closeDocumentViewer = () => {
    setIsViewing(false);
    if (viewingDocUrl) {
      const cleanUrl = viewingDocUrl.split('#')[0];
      window.URL.revokeObjectURL(cleanUrl);
    }
    setViewingDocUrl(null);
    setViewingDocType('');
  };

  const handleSendForReview = async () => {
    if (!checklist.docMatch || !checklist.dataEntry || !checklist.qualityReview) {
      showToast('Please complete all checklist items before submitting.', 'warning');
      return;
    }

    if (!draftFile && !remarks.trim()) {
      showToast('Please upload the draft file or provide missing information remarks.', 'warning');
      return;
    }

    if (!clientData?.assignmentId) return;
    setIsSubmitting(true);

    try {
      await dispatch(submitPrepDraft({
        assignmentId: clientData.assignmentId,
        file: draftFile as File,
        remarks: remarks.trim() || undefined
      })).unwrap();
      
      showToast('Draft submitted successfully!', 'success');
      navigate('/prep/assigned');
    } catch (err: any) {
      showToast(err || 'Failed to submit draft', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitQuery = async () => {
    if (!queryComment.trim()) {
      showToast('Please enter a comment before submitting.', 'warning');
      return;
    }

    if (!clientData?.assignmentId) return;
    
    setIsSubmittingQuery(true);
    try {
      await api.post(`/prep/assignments/${clientData.assignmentId}/comments`, {
        comment: queryComment.trim()
      });
      showToast('Query raised successfully!', 'success');
      setIsQueryModalOpen(false);
      setQueryComment('');
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to raise query', 'error');
    } finally {
      setIsSubmittingQuery(false);
    }
  };

  const maskPhone = (phone?: string) => {
    if (!phone) return 'N/A';
    return phone.replace(/(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?/, '+1 (***) ***-');
  };

  const maskSSN = (ssn?: string) => {
    if (!ssn) return 'N/A';
    return ssn.replace(/^\d{3}-\d{2}-/, 'XXX-XX-');
  };

  const maskEmail = (email?: string) => {
    if (!email) return 'N/A';
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    const [name, domain] = parts;
    const maskedName = name.length > 2 
        ? name.substring(0, 2) + '***' + name.substring(name.length - 1) 
        : name.substring(0, 1) + '***';
    return `${maskedName}@${domain}`;
  };

  if (prepState.loading && !clientData) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center font-sans">
        <Loader2 className="w-8 h-8 text-[#5f41b2] animate-spin mb-4" />
        <p className="text-gray-500 font-semibold">Loading client details...</p>
      </div>
    );
  }

  if (!clientData) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center font-sans">
        <p className="text-rose-500 font-bold text-lg mb-2">Client Not Found</p>
        <button onClick={() => navigate(-1)} className="text-[#5f41b2] hover:underline font-semibold">Go Back</button>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden">
      <div className="flex items-center gap-4 shrink-0 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 hover:text-[#5f41b2] transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-[#1b2559] tracking-tight leading-none flex items-center gap-3">
            Tax Preparation: {clientData.clientName}
            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-700 uppercase">
              {clientData.status}
            </span>
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Task ID: {clientData.assignmentId} | Client ID: {clientData.clientId}
          </p>
        </div>
      </div>
      
      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
        
        {/* Left Column: Client Data & Documents */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-y-auto p-6">
          <h2 className="text-lg font-bold text-[#1b2559] flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
            <User className="w-5 h-5 text-[#5f41b2]" /> Client Profile
          </h2>
          
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Phone className="w-3 h-3" /> Mobile Number</label>
                <p className="font-semibold text-gray-800 text-sm">{maskPhone(clientData.phone)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Mail className="w-3 h-3" /> Email Address</label>
                <p className="font-semibold text-gray-800 text-sm truncate">{maskEmail(clientData.email)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-rose-50 p-3 rounded-xl border border-rose-100">
                <label className="block text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1 flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> SSN / ITIN</label>
                <p className="font-bold text-rose-700 text-sm tracking-widest">{maskSSN(clientData.ssn)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Visa Status</label>
                <p className="font-semibold text-gray-800 text-sm">{clientData.visaStatus || 'N/A'}</p>
              </div>
            </div>
          </div>

          <h2 className="text-lg font-bold text-[#1b2559] flex items-center gap-2 mt-8 mb-4 border-b border-gray-100 pb-4">
            <FileText className="w-5 h-5 text-[#5f41b2]" /> Source Documents
          </h2>
          
          <div className="space-y-3">
            {clientData.documents?.map((doc: PrepDocument) => (
              <div key={doc.documentId} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-gray-50 hover:border-[#5f41b2] transition group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400 group-hover:text-[#5f41b2]">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1b2559] group-hover:text-[#5f41b2]">{doc.documentType}</p>
                    <p className="text-[10px] text-gray-500 font-medium">
                      {doc.fileName || 'Pending File'} &bull; {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                {doc.fileName && (
                  <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleViewDocument(doc.documentId, doc.contentType)}
                        disabled={docLoadingId === doc.documentId}
                        className="p-2 text-gray-400 hover:text-[#5f41b2] hover:bg-purple-50 rounded-lg transition disabled:opacity-50"
                        title="View Document"
                      >
                        {docLoadingId === doc.documentId ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDownloadDocument(doc.documentId, doc.fileName)}
                        disabled={downloadingDocId === doc.documentId}
                        className="p-2 text-gray-400 hover:text-[#5f41b2] hover:bg-purple-50 rounded-lg transition disabled:opacity-50"
                        title="Download Document"
                      >
                        {downloadingDocId === doc.documentId ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Download className="w-5 h-5" />
                        )}
                      </button>
                  </div>
                )}
              </div>
            ))}
            
            {(!clientData.documents || clientData.documents.length === 0) && (
              <p className="text-sm text-gray-500 italic py-4 text-center">No source documents available.</p>
            )}
          </div>
        </div>

        {/* Right Column: Tax Prep Checklist & Actions */}
        <div className="flex-[0.8] bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-hidden">
          <div className="p-6 border-b border-gray-100 shrink-0">
            <h2 className="text-lg font-bold text-[#1b2559] flex items-center gap-2 mb-2">
              <Calculator className="w-5 h-5 text-[#5f41b2]" /> Prep Checklist
            </h2>
            <p className="text-xs text-gray-500">Complete the checklist before sending for review.</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <label className="flex items-center gap-3 p-4 border border-gray-100 rounded-xl cursor-pointer hover:bg-gray-50 transition">
              <input type="checkbox" className="w-5 h-5 accent-[#5f41b2] cursor-pointer rounded" checked={checklist.docMatch} onChange={() => handleChecklist('docMatch')} />
              <div>
                <p className="text-sm font-bold text-[#1b2559]">Document-to-Return Matching</p>
                <p className="text-xs text-gray-500">Verified all source documents.</p>
              </div>
            </label>
            
            <label className="flex items-center gap-3 p-4 border border-gray-100 rounded-xl cursor-pointer hover:bg-gray-50 transition">
              <input type="checkbox" className="w-5 h-5 accent-[#5f41b2] cursor-pointer rounded" checked={checklist.dataEntry} onChange={() => handleChecklist('dataEntry')} />
              <div>
                <p className="text-sm font-bold text-[#1b2559]">Data Entry Complete</p>
                <p className="text-xs text-gray-500">Form data entered accurately.</p>
              </div>
            </label>
            
            <label className="flex items-center gap-3 p-4 border border-gray-100 rounded-xl cursor-pointer hover:bg-gray-50 transition">
              <input type="checkbox" className="w-5 h-5 accent-[#5f41b2] cursor-pointer rounded" checked={checklist.qualityReview} onChange={() => handleChecklist('qualityReview')} />
              <div>
                <p className="text-sm font-bold text-[#1b2559]">Self Quality Review</p>
                <p className="text-xs text-gray-500">Checked for errors before submission.</p>
              </div>
            </label>
            
            <div className="mt-8">
              <label className="block text-xs font-bold text-gray-700 mb-2">Remarks / Missing Information?</label>
              <textarea 
                rows={3} 
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5f41b2] bg-gray-50" 
                placeholder="Describe missing documents or context here..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              ></textarea>
            </div>

            <div className="mt-4 border-t border-gray-100 pt-4">
              <label className="block text-xs font-bold text-[#1b2559] mb-2 flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-[#5f41b2]" />
                Upload Draft Return (PDF) <span className="text-rose-500">*</span>
              </label>
              <input 
                type="file" 
                accept=".pdf,.doc,.docx"
                onChange={(e) => setDraftFile(e.target.files?.[0] || null)}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#5f41b2]/10 file:text-[#5f41b2] hover:file:bg-[#5f41b2]/20 cursor-pointer transition-all"
              />
              {draftFile && <p className="text-[11px] text-emerald-600 font-bold mt-2 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Selected: {draftFile.name}</p>}
            </div>
          </div>

          <div className="p-6 border-t border-gray-100 shrink-0 grid grid-cols-2 gap-3">
             <button 
               onClick={() => setIsQueryModalOpen(true)}
               className="flex items-center justify-center gap-2 bg-rose-50 text-rose-600 font-bold text-sm py-3 rounded-xl hover:bg-rose-100 transition border border-rose-100"
             >
               <MessageSquareWarning className="w-4 h-4" /> Raise Query
             </button>
             
             <button 
                onClick={handleSendForReview}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 bg-[#5f41b2] text-white font-bold text-sm py-3 rounded-xl hover:bg-[#4d3396] transition shadow-sm disabled:opacity-50"
             >
               {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle2 className="w-4 h-4" />}
               {isSubmitting ? 'Submitting...' : 'Send for Review'}
             </button>
          </div>
        </div>
      </div>

      {/* --- In-App Document Viewer Modal --- */}
      {isViewing && viewingDocUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-8 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col overflow-hidden zoom-in-95">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <h3 className="text-lg font-bold text-[#1b2559] flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#5f41b2]" />
                Secure Document Viewer
              </h3>
              <button 
                 onClick={closeDocumentViewer} 
                 className="p-2 bg-white border border-gray-200 rounded-full hover:bg-rose-50 hover:text-rose-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {viewingDocType.startsWith('image/') ? (
              <div className="flex-1 bg-gray-100 flex items-center justify-center overflow-auto p-4 relative">
                <img 
                   src={viewingDocUrl} 
                   alt="Secure Client Document" 
                   className="max-w-full max-h-full object-contain rounded shadow-sm"
                />
              </div>
            ) : (
              <div className="flex-1 bg-gray-100 relative">
                <iframe
                  src={viewingDocUrl}
                  className="w-full h-full border-none"
                  title="Secure Client Document"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- Raise Query Modal --- */}
      {isQueryModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden zoom-in-95">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-[#1b2559] flex items-center gap-2">
                <MessageSquareWarning className="w-5 h-5 text-rose-500" />
                Raise a Query
              </h3>
              <button 
                onClick={() => setIsQueryModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600 transition p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <label className="block text-sm font-bold text-gray-700 mb-2">Query Details</label>
              <textarea
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-gray-50"
                rows={4}
                placeholder="Type your question or issue here..."
                value={queryComment}
                onChange={(e) => setQueryComment(e.target.value)}
              />
            </div>
            <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <button 
                onClick={() => setIsQueryModalOpen(false)}
                className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmitQuery}
                disabled={isSubmittingQuery}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition disabled:opacity-50"
              >
                {isSubmittingQuery ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Submit Query
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default PreparationDetailsView;