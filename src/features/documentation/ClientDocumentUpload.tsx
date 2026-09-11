// src/features/documentation/ClientDocumentUpload.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { fetchPublicDocuments } from '../../store/slices/docClientsSlice';
import { uploadDocument, submitDocuments } from '../../store/slices/documentSlice';
import logoImg from '../../assets/logo.png';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Send
} from 'lucide-react';

const ClientDocumentUpload: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestData, setRequestData] = useState<any>(null);

  // Track uploading & submitting states
  const [uploadingDocId, setUploadingDocId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (token) {
      dispatch(fetchPublicDocuments(token))
        .unwrap()
        .then((data) => {
          setRequestData(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err || 'Link is invalid or has expired.');
          setLoading(false);
        });
    }
  }, [dispatch, token]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, documentId: number) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploadingDocId(documentId);
    try {
      // Trigger the real upload API
      const result = await dispatch(uploadDocument({ token, documentId, file })).unwrap();
      // Update local state with the actual API response
      setRequestData((prev: any) => ({
        ...prev,
        documents: prev.documents.map((doc: any) =>
          doc.documentId === documentId 
            ? result 
            : doc
        )
      }));
    } catch (err: any) {
      alert(err || 'Failed to upload document. Please try again.');
    } finally {
      setUploadingDocId(null);
    }
  };

  const handleSubmitAll = async () => {
    if (!token) return;
    setIsSubmitting(true);
    try {
      // Trigger the real submit API
      const result = await dispatch(submitDocuments(token)).unwrap();
      setRequestData(result);
    } catch (err: any) {
      alert(err || 'Failed to submit documents.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-[#5f41b2] animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Securing your connection & loading requested documents...</p>
      </div>
    );
  }

  if (error || !requestData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center border-t-4 border-rose-500">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">{error || 'This document request link is no longer active.'}</p>
          <p className="text-sm text-gray-400">Please contact your tax preparer for a new link.</p>
        </div>
      </div>
    );
  }

  const isExpired = new Date(requestData.expiresAt) < new Date();
  if (isExpired && !requestData.submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center border-t-4 border-amber-500">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Link Expired</h2>
          <p className="text-gray-600 mb-6">This document request link expired on {new Date(requestData.expiresAt).toLocaleString()}.</p>
          <p className="text-sm text-gray-400">Please contact your tax preparer for a new link.</p>
        </div>
      </div>
    );
  }

  // Updated condition check for all documents using `status` instead of boolean `uploaded`
  const allUploaded = requestData.documents.every((doc: any) => doc.status !== 'PENDING');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 py-4 px-6 flex justify-center sm:justify-start">
        <img src={logoImg} alt="Metrix Tax Filing" className="h-10 w-auto object-contain" />
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-8">
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 overflow-hidden">
          
          {/* Welcome Banner */}
          <div className="bg-[#5f41b2] p-6 sm:p-8 text-white text-center">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Secure Document Upload</h1>
            <p className="text-blue-100 text-sm sm:text-base">
              Welcome, <span className="font-bold text-white">{requestData.clientName}</span>. Please upload the requested files below.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-6 text-sm font-medium text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
              <ShieldCheck className="w-5 h-5" />
              Your uploads are end-to-end encrypted and sent directly to your tax preparer.
            </div>

            <h2 className="text-lg font-bold text-gray-800 mb-4">Required Documents</h2>
            
            <div className="space-y-4">
              {requestData.documents.map((doc: any) => {
                const isUploaded = doc.status !== 'PENDING';
                return (
                <div 
                  key={doc.documentId} 
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl transition ${
                    isUploaded 
                      ? 'border-emerald-200 bg-emerald-50/30' 
                      : 'border-gray-200 bg-gray-50 hover:border-[#5f41b2]/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3 sm:mb-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      isUploaded ? 'bg-emerald-100 text-emerald-600' : 'bg-white border border-gray-200 text-gray-400'
                    }`}>
                      {isUploaded ? <CheckCircle2 className="w-6 h-6" /> : <FileText className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#1b2559]">{doc.documentType}</p>
                      <p className="text-xs font-medium text-gray-500">
                        {isUploaded ? `Uploaded: ${doc.fileName || 'Success'}` : 'Format: PDF, JPG, PNG (Max 5MB)'}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 relative">
                    {isUploaded ? (
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-600 bg-emerald-100 px-3 py-1.5 rounded-lg w-full sm:w-auto justify-center">
                        <CheckCircle2 className="w-4 h-4" /> Received
                      </span>
                    ) : (
                      <>
                        <input
                          type="file"
                          id={`file-${doc.documentId}`}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={uploadingDocId === doc.documentId || requestData.submitted}
                          onChange={(e) => handleFileUpload(e, doc.documentId)}
                        />
                        <label 
                          htmlFor={`file-${doc.documentId}`}
                          className={`inline-flex items-center gap-2 justify-center w-full sm:w-auto px-4 py-2 text-sm font-bold rounded-lg transition border ${
                            uploadingDocId === doc.documentId 
                              ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-wait' 
                              : 'bg-white text-[#5f41b2] border-[#5f41b2] hover:bg-[#5f41b2] hover:text-white cursor-pointer'
                          }`}
                        >
                          {uploadingDocId === doc.documentId ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                          ) : (
                            <><UploadCloud className="w-4 h-4" /> Upload File</>
                          )}
                        </label>
                      </>
                    )}
                  </div>
                </div>
              )})}
            </div>

            {/* Submission Status & Action */}
            <div className="mt-8 border-t border-gray-100 pt-6">
              {requestData.submitted ? (
                <div className="bg-emerald-600 text-white rounded-xl p-5 text-center shadow-md">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
                  <h3 className="text-lg font-bold mb-1">All Documents Submitted!</h3>
                  <p className="text-sm text-emerald-100">Your tax preparer has been notified and will review your files shortly.</p>
                </div>
              ) : (
                <button
                  onClick={handleSubmitAll}
                  disabled={!allUploaded || isSubmitting}
                  className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl text-base font-bold transition shadow-sm ${
                    allUploaded
                      ? 'bg-[#5f41b2] hover:bg-[#4d3396] text-white shadow-[#5f41b2]/20'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
                  ) : (
                    <><Send className="w-5 h-5" /> Submit All Documents</>
                  )}
                </button>
              )}
              
              {!requestData.submitted && !allUploaded && (
                <p className="text-center text-xs text-gray-500 mt-3">
                  You must upload all requested documents before submitting.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClientDocumentUpload;