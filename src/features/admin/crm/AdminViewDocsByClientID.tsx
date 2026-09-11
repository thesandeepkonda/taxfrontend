// src/features/admin/crm/AdminViewDocsByClientID.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import {
  fetchClientDocumentsByClientId,
  clearClientDocuments,
  viewAdminDocument,
  approveDocument,
  rejectDocument,
  approveAllDocuments,
  rejectAllDocuments,
} from '../../../store/slices/adminCRMSlice';
import { useToast } from '../../../contexts/ToastContext';
import api from '../../../services/api'; // ✅ For direct API calls
import {
  Loader2,
  FileText,
  ArrowLeft,
  RefreshCw,
  Clock,
  AlertTriangle,
  Eye,
  CheckCircle2,
  XCircle,
  File,
  Check,
  X,
  Layers,
  Download, // ✅ For download button
  User, // ✅ For modal icons
  Calendar,
  Building2,
} from 'lucide-react';

const AdminViewDocsByClientID: React.FC = () => {
  const params = useParams<{ clientId?: string; clientID?: string }>();
  const rawClientId = params.clientId || params.clientID;

  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();

  const { clientDocuments, totalClientDocuments, loading, error } = useSelector(
    (state: RootState) => state.adminCRM
  );

  const [page, setPage] = useState(0);
  const size = 20;
  const [allDocs, setAllDocs] = useState<typeof clientDocuments>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const [viewingDocId, setViewingDocId] = useState<number | null>(null);
  const [processingDocId, setProcessingDocId] = useState<number | null>(null);

  // ============================================================
  // TAX ORGANIZER MODAL STATE (NEW)
  // ============================================================
  const [showTaxOrganizerModal, setShowTaxOrganizerModal] = useState(false);
  const [taxOrganizerData, setTaxOrganizerData] = useState<any>(null);
  const [loadingTaxOrg, setLoadingTaxOrg] = useState(false);
  const [taxOrgError, setTaxOrgError] = useState<string | null>(null);

  // ============================================================
  // State for Rejection Modals (Single & Bulk)
  // ============================================================
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [rejectionComment, setRejectionComment] = useState('');

  const [rejectAllModalOpen, setRejectAllModalOpen] = useState(false);
  const [rejectionAllComment, setRejectionAllComment] = useState('');

  // State for Bulk Approve
  const [approveAllModalOpen, setApproveAllModalOpen] = useState(false);

  const observerRef = useRef<IntersectionObserver | null>(null);

  // Synchronize Redux slice changes with accumulative infinite scroll state
  useEffect(() => {
    if (page === 0) {
      setAllDocs(clientDocuments);
    } else if (clientDocuments.length > 0) {
      setAllDocs((prev) => {
        const existingIds = new Set(prev.map((d) => d.documentId));
        const newUniqueDocs = clientDocuments.filter((d) => !existingIds.has(d.documentId));
        return [...prev, ...newUniqueDocs];
      });
    }

    if (totalClientDocuments > 0) {
      setHasMore(allDocs.length + clientDocuments.length < totalClientDocuments || clientDocuments.length === size);
    } else {
      setHasMore(clientDocuments.length === size);
    }
    setIsFetchingMore(false);
  }, [clientDocuments, totalClientDocuments, page]);

  // Fetch documents on initial load or page increment
  useEffect(() => {
    if (rawClientId) {
      const id = parseInt(rawClientId, 10);
      if (!isNaN(id)) {
        if (page > 0) setIsFetchingMore(true);
        dispatch(fetchClientDocumentsByClientId({ clientId: id, pageable: { page, size } }));
      } else {
        showToast('Invalid client ID', 'error');
      }
    }
  }, [dispatch, rawClientId, page]);

  // Clean-up on unmount
  useEffect(() => {
    return () => {
      dispatch(clearClientDocuments());
    };
  }, [dispatch]);

  // Infinite Scroll Trigger Ref
  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading || isFetchingMore) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [loading, isFetchingMore, hasMore]
  );

  const handleRefresh = () => {
    if (rawClientId) {
      const id = parseInt(rawClientId, 10);
      if (!isNaN(id)) {
        setAllDocs([]);
        setHasMore(true);
        if (page === 0) {
          dispatch(fetchClientDocumentsByClientId({ clientId: id, pageable: { page: 0, size } }));
        } else {
          setPage(0);
        }
      }
    }
  };

  const handleViewDocument = async (documentId: number) => {
    setViewingDocId(documentId);
    try {
      await viewAdminDocument(documentId);
    } catch (err: any) {
      showToast(err.message || 'Failed to open document', 'error');
    } finally {
      setViewingDocId(null);
    }
  };

  // ============================================================
  // SINGLE DOCUMENT ACTIONS
  // ============================================================
  const handleApprove = async (documentId: number) => {
    if (!rawClientId) return;
    const clientId = parseInt(rawClientId, 10);
    setProcessingDocId(documentId);
    try {
      await dispatch(approveDocument({ clientId, documentId })).unwrap();
      showToast('Document approved successfully!', 'success');
      handleRefresh();
    } catch (err: any) {
      showToast(err || 'Failed to approve document', 'error');
    } finally {
      setProcessingDocId(null);
    }
  };

  const openRejectModal = (documentId: number) => {
    setSelectedDocId(documentId);
    setRejectionComment('');
    setRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!rawClientId || !selectedDocId) return;
    if (!rejectionComment.trim()) {
      showToast('Please provide a rejection reason.', 'warning');
      return;
    }
    const clientId = parseInt(rawClientId, 10);
    setProcessingDocId(selectedDocId);
    try {
      await dispatch(
        rejectDocument({
          clientId,
          documentId: selectedDocId,
          comment: rejectionComment.trim(),
        })
      ).unwrap();
      showToast('Document rejected successfully.', 'info');
      setRejectModalOpen(false);
      setSelectedDocId(null);
      setRejectionComment('');
      handleRefresh();
    } catch (err: any) {
      showToast(err || 'Failed to reject document', 'error');
    } finally {
      setProcessingDocId(null);
    }
  };

  // ============================================================
  // BULK ACTIONS
  // ============================================================
  const handleApproveAll = async () => {
    if (!rawClientId) return;
    const clientId = parseInt(rawClientId, 10);
    setProcessingDocId(-1);
    try {
      await dispatch(approveAllDocuments(clientId)).unwrap();
      showToast('All documents approved successfully!', 'success');
      setApproveAllModalOpen(false);
      handleRefresh();
    } catch (err: any) {
      showToast(err || 'Failed to approve all documents', 'error');
    } finally {
      setProcessingDocId(null);
    }
  };

  const openRejectAllModal = () => {
    setRejectionAllComment('');
    setRejectAllModalOpen(true);
  };

  const handleRejectAll = async () => {
    if (!rawClientId) return;
    if (!rejectionAllComment.trim()) {
      showToast('Please provide a rejection reason for all documents.', 'warning');
      return;
    }
    const clientId = parseInt(rawClientId, 10);
    setProcessingDocId(-1);
    try {
      await dispatch(
        rejectAllDocuments({
          clientId,
          comment: rejectionAllComment.trim(),
        })
      ).unwrap();
      showToast('All documents rejected successfully.', 'info');
      setRejectAllModalOpen(false);
      setRejectionAllComment('');
      handleRefresh();
    } catch (err: any) {
      showToast(err || 'Failed to reject all documents', 'error');
    } finally {
      setProcessingDocId(null);
    }
  };

  // ============================================================
  // TAX ORGANIZER HANDLERS
  // ============================================================
  const fetchTaxOrganizer = async () => {
    if (!rawClientId) return;
    const clientId = parseInt(rawClientId, 10);
    setLoadingTaxOrg(true);
    setTaxOrgError(null);
    try {
      const response = await api.get(`/admin/clients/${clientId}/tax-organizer`);
      setTaxOrganizerData(response.data);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to load tax organizer data';
      setTaxOrgError(msg);
      showToast(msg, 'error');
    } finally {
      setLoadingTaxOrg(false);
    }
  };

  const handleDownloadTaxOrganizer = async () => {
    if (!rawClientId || !taxOrganizerData?.fileName) return;
    const clientId = parseInt(rawClientId, 10);
    try {
      const response = await api.get(`/admin/clients/${clientId}/tax-organizer/download`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', taxOrganizerData.fileName || 'Tax_Organizer.docx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showToast('Download started', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Download failed', 'error');
    }
  };

  const openTaxOrganizerModal = () => {
    setShowTaxOrganizerModal(true);
    fetchTaxOrganizer();
  };

  // ============================================================
  // HELPERS
  // ============================================================
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Submitted
          </span>
        );
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3 h-3" /> Verified
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const hasSubmittedDocs = allDocs.some((doc) => doc.status === 'SUBMITTED');

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 shrink-0 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 hover:text-[#5f41b2] transition cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-[#1b2559] tracking-tight leading-none flex items-center gap-3">
              <FileText className="w-7 h-7 text-[#5f41b2]" />
              Client Documents
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Client ID: #{rawClientId || 'N/A'} • {totalClientDocuments || allDocs.length} Document
              {(totalClientDocuments || allDocs.length) === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* ✅ NEW: Tax Organizer Button */}
          <button
            onClick={openTaxOrganizerModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition shadow-sm active:scale-95 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            Tax Organizer
          </button>

          {hasSubmittedDocs && (
            <>
              <button
                onClick={() => setApproveAllModalOpen(true)}
                disabled={!!processingDocId}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-4 h-4" /> Approve All
              </button>
              <button
                onClick={openRejectAllModal}
                disabled={!!processingDocId}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <X className="w-4 h-4" /> Reject All
              </button>
            </>
          )}

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#5f41b2]' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-2 [scrollbar-width:thin]">
          {loading && allDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 py-16">
              <Loader2 className="w-8 h-8 animate-spin text-[#5f41b2]" />
              <p className="text-sm font-semibold">Loading documents...</p>
            </div>
          ) : error && allDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-rose-500 gap-2 py-16">
              <AlertTriangle className="w-8 h-8" />
              <p className="text-sm font-semibold">Failed to load documents</p>
              <p className="text-xs text-slate-400">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition shadow-sm cursor-pointer"
              >
                Try Again
              </button>
            </div>
          ) : allDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 py-16">
              <FileText className="w-12 h-12 opacity-20" />
              <p className="text-sm font-semibold">No documents found for this client</p>
              <p className="text-xs text-slate-400">Client ID: #{rawClientId || 'N/A'}</p>
            </div>
          ) : (
            <>
              <table className="w-full text-left text-sm min-w-[1100px] border-collapse">
                <thead className="bg-slate-50/80 sticky top-0 z-10 border-b border-slate-100">
                  <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4 rounded-l-xl">Document Name</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">File Name</th>
                    <th className="py-3 px-3 text-center">Size</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-center">Uploaded At</th>
                    <th className="py-3 px-4 text-center rounded-r-xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {allDocs.map((doc) => {
                    const hasFile = Boolean(doc.fileName && doc.fileName !== '—');
                    const isSubmitted = doc.status === 'SUBMITTED';
                    const isProcessing = processingDocId === doc.documentId;

                    return (
                      <tr key={doc.documentId} className="hover:bg-blue-50/30 transition group">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-[#1b2559] text-sm">{doc.documentType}</p>
                          <p className="text-[10px] text-slate-400">Doc ID: #{doc.documentId}</p>
                        </td>
                        <td className="py-3.5 px-3 text-slate-600 text-sm">
                          {doc.documentType || '—'}
                        </td>
                        <td className="py-3.5 px-3 text-slate-600 text-sm">
                          <span className="flex items-center gap-1.5">
                            <File className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[200px]" title={doc.fileName || ''}>
                              {doc.fileName || '—'}
                            </span>
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center text-slate-600 text-sm font-medium">
                          {formatFileSize(doc.fileSize)}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          {getStatusBadge(doc.status)}
                        </td>
                        <td className="py-3.5 px-3 text-center text-slate-500 text-xs font-medium">
                          <span className="flex items-center justify-center gap-1.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {formatDate(doc.uploadedAt)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {hasFile ? (
                              <button
                                onClick={() => handleViewDocument(doc.documentId)}
                                disabled={viewingDocId === doc.documentId}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-lg text-xs font-bold transition shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
                                title="View document"
                              >
                                {viewingDocId === doc.documentId ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Eye className="w-3.5 h-3.5" />
                                )}
                                <span>View</span>
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 font-medium">Not uploaded</span>
                            )}

                            {isSubmitted && (
                              <>
                                <button
                                  onClick={() => handleApprove(doc.documentId)}
                                  disabled={isProcessing}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                                >
                                  {isProcessing ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Check className="w-3.5 h-3.5" />
                                  )}
                                  Approve
                                </button>
                                <button
                                  onClick={() => openRejectModal(doc.documentId)}
                                  disabled={isProcessing}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                                >
                                  {isProcessing ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <X className="w-3.5 h-3.5" />
                                  )}
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Infinite Scroll Trigger & Spinner */}
              <div ref={lastElementRef} className="w-full py-4 flex items-center justify-center">
                {isFetchingMore && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#5f41b2]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading more documents...</span>
                  </div>
                )}
                {!hasMore && allDocs.length > 0 && (
                  <span className="text-xs text-slate-400 font-medium">All documents loaded</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ============================================================
          SINGLE REJECT MODAL
          ============================================================ */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border-t-4 border-rose-500">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#1b2559] flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-500" />
                Reject Document
              </h3>
              <button
                onClick={() => {
                  setRejectModalOpen(false);
                  setSelectedDocId(null);
                  setRejectionComment('');
                }}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Please provide a reason for rejecting this document.
            </p>
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={rejectionComment}
                onChange={(e) => setRejectionComment(e.target.value)}
                rows={4}
                placeholder="Enter the reason for rejection..."
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setRejectModalOpen(false);
                  setSelectedDocId(null);
                  setRejectionComment('');
                }}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionComment.trim() || processingDocId === selectedDocId}
                className="px-5 py-2 flex items-center gap-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition shadow-sm disabled:opacity-50"
              >
                {processingDocId === selectedDocId ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          BULK REJECT MODAL
          ============================================================ */}
      {rejectAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border-t-4 border-rose-500">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#1b2559] flex items-center gap-2">
                <Layers className="w-5 h-5 text-rose-500" />
                Reject All Documents
              </h3>
              <button
                onClick={() => {
                  setRejectAllModalOpen(false);
                  setRejectionAllComment('');
                }}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              This will reject <strong>all submitted documents</strong> for this client.
            </p>
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={rejectionAllComment}
                onChange={(e) => setRejectionAllComment(e.target.value)}
                rows={4}
                placeholder="Enter the reason for rejecting all documents..."
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setRejectAllModalOpen(false);
                  setRejectionAllComment('');
                }}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectAll}
                disabled={!rejectionAllComment.trim() || processingDocId === -1}
                className="px-5 py-2 flex items-center gap-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition shadow-sm disabled:opacity-50"
              >
                {processingDocId === -1 ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                Confirm Reject All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          BULK APPROVE MODAL
          ============================================================ */}
      {approveAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border-t-4 border-emerald-500">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#1b2559] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Approve All Documents
              </h3>
              <button
                onClick={() => setApproveAllModalOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              This will approve <strong>all submitted documents</strong> for this client.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setApproveAllModalOpen(false)}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveAll}
                disabled={processingDocId === -1}
                className="px-5 py-2 flex items-center gap-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-sm disabled:opacity-50"
              >
                {processingDocId === -1 ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Confirm Approve All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          TAX ORGANIZER MODAL
          ============================================================ */}
      {showTaxOrganizerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-slate-50/80 shrink-0">
              <div>
                <h3 className="text-xl font-bold text-[#1b2559] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  Tax Organizer
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Client: {taxOrganizerData?.clientName || `ID #${rawClientId}`}
                  {taxOrganizerData?.status && (
                    <span className={`ml-2 px-2 py-0.5 rounded text-[10px] font-bold ${
                      taxOrganizerData.status === 'SUBMITTED' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {taxOrganizerData.status}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {taxOrganizerData?.fileName && (
                  <button
                    onClick={handleDownloadTaxOrganizer}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition shadow-sm active:scale-95 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download DOCX
                  </button>
                )}
                <button
                  onClick={() => setShowTaxOrganizerModal(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 [scrollbar-width:thin]">
              {loadingTaxOrg ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                  <p className="text-sm font-semibold">Loading tax organizer data...</p>
                </div>
              ) : taxOrgError ? (
                <div className="flex flex-col items-center justify-center h-48 text-rose-500 gap-2">
                  <AlertTriangle className="w-8 h-8" />
                  <p className="text-sm font-semibold">{taxOrgError}</p>
                </div>
              ) : taxOrganizerData ? (
                <div className="space-y-6">
                  {/* Personal Info */}
                  <div className="border-b border-slate-200 pb-4">
                    <h4 className="text-sm font-bold text-[#1b2559] mb-3">Personal Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div><span className="font-semibold">Name:</span> {taxOrganizerData.firstName} {taxOrganizerData.middleName || ''} {taxOrganizerData.lastName}</div>
                      <div><span className="font-semibold">Date of Birth:</span> {taxOrganizerData.dateOfBirth || '—'}</div>
                      <div><span className="font-semibold">SSN/ITIN:</span> {taxOrganizerData.ssnItin || '—'}</div>
                      <div><span className="font-semibold">Marital Status:</span> {taxOrganizerData.maritalStatus || '—'}</div>
                      <div><span className="font-semibold">Visa Status:</span> {taxOrganizerData.visaStatus || '—'}</div>
                      <div><span className="font-semibold">Visa Changed:</span> {taxOrganizerData.visaStatusChanged ? 'Yes' : 'No'}</div>
                      <div className="md:col-span-2"><span className="font-semibold">Address:</span> {taxOrganizerData.currentAddress || '—'}</div>
                      <div><span className="font-semibold">Email:</span> {taxOrganizerData.emailAddress || '—'}</div>
                      <div><span className="font-semibold">Phone:</span> {taxOrganizerData.phoneNumber || '—'}</div>
                      <div><span className="font-semibold">Occupation:</span> {taxOrganizerData.occupation || '—'}</div>
                      <div><span className="font-semibold">States Lived (2026):</span> {taxOrganizerData.statesLivedIn2026 || '—'}</div>
                    </div>
                  </div>

                  {/* Spouse */}
                  {taxOrganizerData.spouse && (
                    <div className="border-b border-slate-200 pb-4">
                      <h4 className="text-sm font-bold text-[#1b2559] mb-3">Spouse Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div><span className="font-semibold">Name:</span> {taxOrganizerData.spouse.firstName} {taxOrganizerData.spouse.middleName || ''} {taxOrganizerData.spouse.lastName}</div>
                        <div><span className="font-semibold">DOB:</span> {taxOrganizerData.spouse.dateOfBirth || '—'}</div>
                        <div><span className="font-semibold">SSN/ITIN:</span> {taxOrganizerData.spouse.ssnItin || '—'}</div>
                        <div><span className="font-semibold">Visa Status:</span> {taxOrganizerData.spouse.visaStatus || '—'}</div>
                        <div><span className="font-semibold">Visa Changed:</span> {taxOrganizerData.spouse.visaStatusChanged ? 'Yes' : 'No'}</div>
                        <div><span className="font-semibold">Occupation:</span> {taxOrganizerData.spouse.occupation || '—'}</div>
                        <div><span className="font-semibold">Email:</span> {taxOrganizerData.spouse.email || '—'}</div>
                      </div>
                    </div>
                  )}

                  {/* Dependents */}
                  {taxOrganizerData.dependents && taxOrganizerData.dependents.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-[#1b2559] mb-3">Dependents ({taxOrganizerData.dependents.length})</h4>
                      <div className="space-y-3">
                        {taxOrganizerData.dependents.map((dep: any, idx: number) => (
                          <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              <div><span className="font-semibold">Name:</span> {dep.firstName} {dep.middleName || ''} {dep.lastName}</div>
                              <div><span className="font-semibold">DOB:</span> {dep.dateOfBirth || '—'}</div>
                              <div><span className="font-semibold">SSN/ITIN:</span> {dep.ssnItin || '—'}</div>
                              <div><span className="font-semibold">Relationship:</span> {dep.relationship || '—'}</div>
                              <div><span className="font-semibold">Months Lived:</span> {dep.monthsLivedWithYou || '—'}</div>
                              <div><span className="font-semibold">US Citizen/Resident:</span> {dep.usCitizenResident ? 'Yes' : 'No'}</div>
                              <div><span className="font-semibold">Child Care Expenses:</span> {dep.childCareExpenses ? 'Yes' : 'No'}</div>
                              <div><span className="font-semibold">SSN Status:</span> {dep.ssnStatus || '—'}</div>
                              <div><span className="font-semibold">ITIN Application Required:</span> {dep.itinApplicationRequired ? 'Yes' : 'No'}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
                  <FileText className="w-12 h-12 opacity-20" />
                  <p className="text-sm font-semibold">No tax organizer data found for this client.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setShowTaxOrganizerModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminViewDocsByClientID;