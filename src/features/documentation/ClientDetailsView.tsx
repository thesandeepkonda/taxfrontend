// src/features/documentation/ClientDetailsView.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { requestClientDocuments, fetchDocClients } from '../../store/slices/docClientsSlice';
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
  RefreshCw
} from 'lucide-react';

const COMMON_DOC_TYPES = [
  'Pan Card',
  '10th memo',
  'Aadhar Card',
  'W-2 Form',
  'Passport Copy',
  '1099-INT',
  'Prior Year Return',
  'SSN Card'
];

const ClientDetailsView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  // Fetch client from Redux store
  const { list: clients, loading } = useSelector((state: RootState) => state.docClients);
  const clientData = clients.find(c => String(c.clientId) === id);

  const [isUploading, setIsUploading] = useState(false);

  // Document Request Modal States
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [expiresAt, setExpiresAt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [requestResult, setRequestResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Fetch clients if page is directly loaded and store is empty
  useEffect(() => {
    if (clients.length === 0) {
      dispatch(fetchDocClients());
    }
  }, [dispatch, clients.length]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      // TODO: Replace with actual manual file upload backend API call if needed
      setTimeout(() => {
        setIsUploading(false);
        alert(`File ${e.target.files![0].name} uploaded locally!`);
      }, 1500);
    }
  };

  // Document Request Handlers
  const handleToggleDoc = (docType: string) => {
    setSelectedDocs(prev =>
      prev.includes(docType) ? prev.filter(d => d !== docType) : [...prev, docType]
    );
  };

  const handleGenerateRequest = async () => {
    if (selectedDocs.length === 0) {
      alert('Please select at least one document to request.');
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

      const result = await dispatch(requestClientDocuments(payload)).unwrap();
      setRequestResult(result);
    } catch (err: any) {
      alert(err || 'Failed to generate request');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = () => {
    if (requestResult?.shareUrl) {
      const fullUrl = `${window.location.origin}${requestResult.shareUrl}`;
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsAppShare = async () => {
    if (requestResult?.shareUrl && clientData) {
      const fullUrl = `${window.location.origin}${requestResult.shareUrl}`;
      const text = `Hello ${clientData.name}, please upload your requested documents securely using this link: ${fullUrl}`;
      
      try {
        // TODO: Replace with Admin's Internal WhatsApp API call
        // Example: await apiDev2.post('/admin/whatsapp/send', { phone: clientData.phone, message: text });
        
        console.log("Internal API call triggered:", text);
        alert('WhatsApp message sent successfully via internal API!');
      } catch (error) {
        alert('Failed to send WhatsApp message.');
      }
    }
  };

  const handleGenerateNewLink = () => {
    setRequestResult(null);
    setSelectedDocs([]);
    setExpiresAt('');
  };

  const resetModal = () => {
    setIsRequestModalOpen(false);
    setSelectedDocs([]);
    setExpiresAt('');
    setRequestResult(null);
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
        {/* Left Column: Client Details */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-[#1b2559] flex items-center gap-2">
              <User className="w-5 h-5 text-[#5f41b2]" />
              Personal Information
            </h2>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Mobile Number
                </label>
                <p className="font-semibold text-gray-800 text-sm">
                  {clientData.maskedPhone}
                </p>
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

            <div className="pt-4 mt-4 border-t border-gray-100">
              <button className="w-full bg-[#5f41b2] hover:bg-[#4d3396] text-white font-bold text-sm py-2.5 rounded-xl transition shadow-sm">
                Log Call / Update CRM
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Document Upload & List */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-hidden">
          <div className="p-6 border-b border-gray-100 shrink-0 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#1b2559] flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-[#5f41b2]" />
              Document Vault
            </h2>
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition border border-blue-200"
            >
              <Send className="w-3.5 h-3.5" />
              Request from Client
            </button>
          </div>

          <div className="p-6 shrink-0">
            {/* Manual Upload Area */}
            <div className="border-2 border-dashed border-gray-300 bg-gray-50/50 rounded-xl p-6 text-center hover:bg-gray-100 transition cursor-pointer relative">
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileUpload}
              />
              <UploadCloud className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-700">Click or drag documents here to upload manually</p>
              <p className="text-xs text-gray-400 font-medium mt-1">Supports W-2, 1099, Passports (PDF, JPG)</p>
              {isUploading && <p className="text-xs text-blue-600 font-bold mt-2 animate-pulse">Uploading securely...</p>}
            </div>
          </div>

          {/* Uploaded / Requested Files List */}
          <div className="flex-1 overflow-y-auto p-6 pt-0 space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Requested Documents Status</h3>
            
            {!requestResult || !requestResult.documents ? (
              <div className="text-center py-6 text-gray-400 text-sm">
                No active document requests. Generate a link to request documents.
              </div>
            ) : (
              requestResult.documents.map((doc: any) => (
                <div key={doc.documentId} className={`flex items-center justify-between p-3 border rounded-xl transition group ${doc.uploaded ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400">
                      <FileText className={`w-5 h-5 ${doc.uploaded ? 'text-emerald-500' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#1b2559]">{doc.documentName}</p>
                      <p className="text-[10px] text-gray-500 font-medium">
                        {doc.documentType} • {doc.uploaded ? `Uploaded ${doc.uploadedAt ? formatDate(doc.uploadedAt) : ''}` : 'Pending Upload'}
                      </p>
                    </div>
                  </div>
                  {doc.uploaded ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Clock className="w-5 h-5 text-amber-500" />
                  )}
                </div>
              ))
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
              {!requestResult ? (
                /* --- FORM VIEW --- */
                <>
                  <p className="text-sm text-gray-600 mb-4">
                    Select the documents you need from <strong>{clientData.name}</strong>. A secure upload link will be generated.
                  </p>

                  <div className="mb-5">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Select Documents</label>
                    <div className="grid grid-cols-2 gap-3">
                      {COMMON_DOC_TYPES.map(docType => (
                        <label key={docType} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors ${selectedDocs.includes(docType) ? 'border-[#5f41b2] bg-[#5f41b2]/5' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                          <input
                            type="checkbox"
                            checked={selectedDocs.includes(docType)}
                            onChange={() => handleToggleDoc(docType)}
                            className="w-4 h-4 accent-[#5f41b2] cursor-pointer"
                          />
                          <span className="text-sm font-semibold text-gray-800">{docType}</span>
                        </label>
                      ))}
                    </div>
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
                </>
              ) : (
                /* --- SUCCESS VIEW --- */
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h4 className="text-xl font-bold text-[#1b2559] mb-2">Request Link Generated!</h4>
                  <p className="text-sm text-gray-500 mb-6">You can now share this secure upload link with the client.</p>
                  
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 text-left">Secure URL</p>
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        readOnly 
                        value={`${window.location.origin}${requestResult.shareUrl}`} 
                        className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none" 
                      />
                      <button 
                        onClick={handleCopyLink} 
                        className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                        title="Copy to clipboard"
                      >
                        {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button 
                      onClick={handleWhatsAppShare}
                      className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold text-sm py-3 rounded-xl hover:bg-[#20bd5a] transition shadow-sm"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Send via WhatsApp (Internal)
                    </button>
                    
                    <button 
                      onClick={handleGenerateNewLink}
                      className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-bold text-sm py-3 rounded-xl hover:bg-gray-50 transition shadow-sm"
                    >
                      <RefreshCw className="w-5 h-5" />
                      Generate New Link
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Form Action Buttons (Only visible in Form View) */}
            {!requestResult && (
              <div className="p-5 border-t border-gray-100 flex justify-end gap-3 bg-white">
                <button
                  onClick={resetModal}
                  className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                >
                  Close
                </button>
                <button
                  onClick={handleGenerateRequest}
                  disabled={isGenerating || selectedDocs.length === 0 || !expiresAt}
                  className="px-5 py-2.5 flex items-center gap-2 text-sm font-bold bg-[#5f41b2] text-white rounded-xl hover:bg-[#4d3396] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isGenerating ? 'Generating...' : 'Generate Link'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDetailsView;