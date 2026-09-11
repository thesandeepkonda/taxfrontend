// src/features/admin/crm/AdminViewDraftsByClientID.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../../store';
import { fetchClientDrafts, reviewTaxDraft } from '../../../store/slices/prepSlice';
import { useToast } from '../../../contexts/ToastContext';
import api from '../../../services/api';
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
  User,
  Calendar,
  Check,
  X,
  MessageSquareText,
} from 'lucide-react';

interface DraftResponse {
  draftId: number;
  draftVersion: number;
  fileName: string | null;
  prepRemarks: string | null;
  adminFeedback: string | null;
  status: string; // PENDING, APPROVED, REJECTED
  uploadedAt: string;
  prepEmployeeName: string;
}

const AdminViewDraftsByClientID: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();

  // Read client name from query param
  const clientName = searchParams.get('name') || 'Unknown Client';

  const [drafts, setDrafts] = useState<DraftResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingDraftId, setViewingDraftId] = useState<number | null>(null);
  const [processingDraftId, setProcessingDraftId] = useState<number | null>(null);

  // ============================================================
  // REJECT MODAL STATE
  // ============================================================
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectDraftId, setRejectDraftId] = useState<number | null>(null);
  const [rejectFeedback, setRejectFeedback] = useState('');

  // ============================================================
  // FEEDBACK VIEWER MODAL STATE
  // ============================================================
  const [viewFeedbackModal, setViewFeedbackModal] = useState<{
    version: number;
    feedback: string;
  } | null>(null);

  const fetchDrafts = async () => {
    if (!clientId) return;
    const id = parseInt(clientId, 10);
    if (isNaN(id)) {
      showToast('Invalid client ID', 'error');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await dispatch(fetchClientDrafts(id)).unwrap();
      setDrafts(data || []);
    } catch (err: any) {
      setError(err || 'Failed to fetch drafts');
      showToast(err || 'Failed to fetch drafts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, [clientId]);

  // ============================================================
  // VIEW DRAFT (PDF)
  // ============================================================
  const handleViewDraft = async (draftId: number) => {
    setViewingDraftId(draftId);
    try {
      const response = await api.get(`/prep/drafts/${draftId}/view`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err: any) {
      showToast(err || 'Failed to view draft', 'error');
    } finally {
      setViewingDraftId(null);
    }
  };

  // ============================================================
  // APPROVE DRAFT
  // ============================================================
  const handleApproveDraft = async (draftId: number) => {
    setProcessingDraftId(draftId);
    try {
      await dispatch(reviewTaxDraft({ draftId, isApproved: true, feedback: '' })).unwrap();
      showToast('Draft approved successfully!', 'success');
      fetchDrafts();
    } catch (err: any) {
      showToast(err || 'Failed to approve draft', 'error');
    } finally {
      setProcessingDraftId(null);
    }
  };

  // ============================================================
  // REJECT DRAFT (Opens Modal)
  // ============================================================
  const openRejectModal = (draftId: number) => {
    setRejectDraftId(draftId);
    setRejectFeedback('');
    setShowRejectModal(true);
  };

  const handleRejectDraft = async () => {
    if (!rejectDraftId) return;
    if (!rejectFeedback.trim()) {
      showToast('Please provide a rejection reason.', 'warning');
      return;
    }

    setProcessingDraftId(rejectDraftId);
    try {
      await dispatch(
        reviewTaxDraft({
          draftId: rejectDraftId,
          isApproved: false,
          feedback: rejectFeedback.trim(),
        })
      ).unwrap();
      showToast('Draft rejected successfully.', 'info');
      setShowRejectModal(false);
      setRejectDraftId(null);
      setRejectFeedback('');
      fetchDrafts();
    } catch (err: any) {
      showToast(err || 'Failed to reject draft', 'error');
    } finally {
      setProcessingDraftId(null);
    }
  };

  // ============================================================
  // HELPERS
  // ============================================================
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Approved
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

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 shrink-0 mb-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 hover:text-[#5f41b2] transition cursor-pointer text-slate-600 shadow-2xs"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-[#5f41b2]/10 rounded-lg">
                <FileText className="w-5 h-5 text-[#5f41b2]" />
              </div>
              <h1 className="text-xl font-extrabold text-[#1b2559] tracking-tight leading-none">
                Tax Drafts
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                {drafts.length} {drafts.length === 1 ? 'Draft' : 'Drafts'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Client: <span className="font-bold text-[#1b2559]">{clientName}</span> (ID: #{clientId || 'N/A'})
            </p>
          </div>
        </div>

        <button
          onClick={fetchDrafts}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#5f41b2]' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Main Table Content */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200/80 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-x-auto overflow-y-auto p-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 py-16">
              <Loader2 className="w-8 h-8 animate-spin text-[#5f41b2]" />
              <p className="text-sm font-semibold">Loading drafts...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-rose-500 gap-2 py-16">
              <AlertTriangle className="w-8 h-8" />
              <p className="text-sm font-semibold">Failed to load drafts</p>
              <p className="text-xs text-slate-400">{error}</p>
              <button
                onClick={fetchDrafts}
                className="mt-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition shadow-sm cursor-pointer"
              >
                Try Again
              </button>
            </div>
          ) : drafts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 py-16">
              <FileText className="w-12 h-12 opacity-20" />
              <p className="text-sm font-semibold">No drafts found for {clientName}</p>
              <p className="text-xs text-slate-400">Client ID: #{clientId || 'N/A'}</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm border-collapse min-w-[1250px]">
              <thead className="bg-slate-50/90 sticky top-0 z-10 border-b border-slate-100 backdrop-blur-xs">
                <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  <th className="py-3 px-4 rounded-l-xl min-w-[120px]">Version</th>
                  <th className="py-3 px-3 min-w-[220px]">File Name</th>
                  <th className="py-3 px-3 min-w-[140px]">Uploaded By</th>
                  <th className="py-3 px-3 text-center min-w-[110px]">Status</th>
                  <th className="py-3 px-4 min-w-[280px]">Admin Feedback</th>
                  <th className="py-3 px-3 text-center min-w-[160px]">Uploaded At</th>
                  <th className="py-3 px-4 text-center rounded-r-xl min-w-[260px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {drafts.map((draft) => {
                  const isPending = draft.status === 'PENDING';
                  const isProcessing = processingDraftId === draft.draftId;
                  const feedbackText = draft.adminFeedback || '';
                  const isLongFeedback = feedbackText.length > 45;

                  return (
                    <tr key={draft.draftId} className="hover:bg-slate-50/70 transition group">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-bold text-[#1b2559] text-sm group-hover:text-[#5f41b2] transition-colors">
                          Draft v{draft.draftVersion}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium">ID: #{draft.draftId}</p>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="truncate block max-w-[240px] text-slate-700 font-medium text-xs" title={draft.fileName || ''}>
                          {draft.fileName || '—'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {draft.prepEmployeeName || 'Unknown'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {getStatusBadge(draft.status)}
                      </td>

                      {/* Admin Feedback with ...more Trigger */}
                      <td className="py-3.5 px-4 text-xs">
                        {feedbackText ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-700 font-normal">
                              {isLongFeedback ? `${feedbackText.slice(0, 45)}...` : feedbackText}
                            </span>
                            {isLongFeedback && (
                              <button
                                onClick={() =>
                                  setViewFeedbackModal({
                                    version: draft.draftVersion,
                                    feedback: feedbackText,
                                  })
                                }
                                className="text-[#5f41b2] hover:text-[#452b8c] font-bold underline cursor-pointer shrink-0 transition"
                                title="Click to view full feedback"
                              >
                                ...more
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic font-medium">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center text-slate-500 text-xs font-medium whitespace-nowrap">
                        <span className="flex items-center justify-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {formatDate(draft.uploadedAt)}
                        </span>
                      </td>

                      {/* Actions in a Single Horizontal Row */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                          {/* View PDF Button */}
                          <button
                            onClick={() => handleViewDraft(draft.draftId)}
                            disabled={viewingDraftId === draft.draftId}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white border border-emerald-200 hover:border-emerald-600 rounded-lg text-xs font-bold transition shadow-2xs active:scale-95 cursor-pointer disabled:opacity-50 h-8 whitespace-nowrap"
                            title="View draft PDF"
                          >
                            {viewingDraftId === draft.draftId ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Eye className="w-3.5 h-3.5 shrink-0" />
                            )}
                            <span>View</span>
                          </button>

                          {/* Approve/Reject Buttons inline next to view */}
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleApproveDraft(draft.draftId)}
                                disabled={isProcessing}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer h-8 whitespace-nowrap"
                              >
                                {isProcessing ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 shrink-0" />
                                )}
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => openRejectModal(draft.draftId)}
                                disabled={isProcessing}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer h-8 whitespace-nowrap"
                              >
                                {isProcessing ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <X className="w-3.5 h-3.5 shrink-0" />
                                )}
                                <span>Reject</span>
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
          )}
        </div>

        {/* Footer */}
        {drafts.length > 0 && (
          <div className="p-3.5 border-t border-slate-100 shrink-0 text-xs text-slate-500 flex justify-between items-center bg-slate-50/50">
            <span>
              Total <span className="font-bold text-slate-700">{drafts.length}</span> draft{drafts.length === 1 ? '' : 's'}
            </span>
            <span>
              Client: <span className="font-semibold text-slate-700">{clientName}</span> (ID: #{clientId})
            </span>
          </div>
        )}
      </div>

      {/* ============================================================
          FEEDBACK DETAIL POPUP MODAL (...more click)
          ============================================================ */}
      {viewFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#1b2559] flex items-center gap-2">
                <div className="p-1.5 bg-purple-50 text-[#5f41b2] rounded-lg border border-purple-100">
                  <MessageSquareText className="w-5 h-5" />
                </div>
                Admin Feedback (Draft v{viewFeedbackModal.version})
              </h3>
              <button
                onClick={() => setViewFeedbackModal(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 max-h-[350px] overflow-y-auto">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {viewFeedbackModal.feedback}
              </p>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setViewFeedbackModal(null)}
                className="px-5 py-2 bg-[#5f41b2] hover:bg-[#4d3396] text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          REJECT MODAL
          ============================================================ */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border-t-4 border-rose-500">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#1b2559] flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-500" />
                Reject Draft
              </h3>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectDraftId(null);
                  setRejectFeedback('');
                }}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              Please provide a reason for rejecting this draft.
            </p>

            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={rejectFeedback}
                onChange={(e) => setRejectFeedback(e.target.value)}
                rows={4}
                placeholder="Enter the reason for rejection..."
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectDraftId(null);
                  setRejectFeedback('');
                }}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectDraft}
                disabled={!rejectFeedback.trim() || processingDraftId === rejectDraftId}
                className="px-5 py-2 flex items-center gap-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition shadow-sm disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {processingDraftId === rejectDraftId ? (
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
    </div>
  );
};

export default AdminViewDraftsByClientID;