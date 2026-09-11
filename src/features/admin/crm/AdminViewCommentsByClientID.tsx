// src/features/admin/crm/AdminViewCommentsByClientID.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import {
  fetchClientComments,
  deleteComment,
  editComment,
  clearAdminCRM,
} from '../../../store/slices/adminCRMSlice';
import { useToast } from '../../../contexts/ToastContext';
import {
  Loader2,
  ArrowLeft,
  RefreshCw,
  Clock,
  AlertTriangle,
  Trash2,
  SquarePen,
  Check,
  X,
  MessageSquare,
  User,
  Calendar,
  FileText,
} from 'lucide-react';

interface Comment {
  id: number;
  clientId: number;
  employeeId: number;
  employeeName: string;
  comment: string;
  commentType: string;
  createdAt: string;
}

const AdminViewCommentsByClientID: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();

  const { comments, loading, error } = useSelector(
    (state: RootState) => state.adminCRM
  );

  // Local state for editing
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState<string>('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (clientId) {
      const id = parseInt(clientId, 10);
      if (!isNaN(id)) {
        dispatch(fetchClientComments(id));
      } else {
        showToast('Invalid client ID', 'error');
      }
    }

    return () => {
      dispatch(clearAdminCRM());
    };
  }, [dispatch, clientId, showToast]);

  const handleRefresh = () => {
    if (clientId) {
      const id = parseInt(clientId, 10);
      if (!isNaN(id)) {
        dispatch(fetchClientComments(id));
      }
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    setDeletingId(commentId);
    try {
      await dispatch(deleteComment(commentId)).unwrap();
      showToast('Comment deleted successfully', 'success');
    } catch (err: any) {
      showToast(err || 'Failed to delete comment', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditText(comment.comment);
  };

  const handleSaveEdit = async (commentId: number) => {
    if (!editText.trim()) {
      showToast('Comment cannot be empty', 'error');
      return;
    }
    try {
      await dispatch(editComment({ commentId, comment: editText.trim() })).unwrap();
      showToast('Comment updated successfully', 'success');
      setEditingId(null);
      setEditText('');
    } catch (err: any) {
      showToast(err || 'Failed to update comment', 'error');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getCommentTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      GENERAL: 'bg-gray-100 text-gray-700',
      STATUS_UPDATE: 'bg-blue-100 text-blue-700',
      FOLLOW_UP: 'bg-yellow-100 text-yellow-700',
      DOCUMENT_REJECTED: 'bg-red-100 text-red-700',
      DOCUMENT_VERIFIED: 'bg-green-100 text-green-700',
      REMARKS: 'bg-purple-100 text-purple-700',
    };
    const color = colors[type] || colors.GENERAL;
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${color}`}>
        {type || 'GENERAL'}
      </span>
    );
  };

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
              <MessageSquare className="w-7 h-7 text-[#5f41b2]" />
              Client Comments
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Client ID: #{clientId || 'N/A'} • {comments.length} Comment
              {comments.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3 shrink-0 mb-4">
        <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Comments</p>
          <p className="text-xl font-extrabold text-[#1b2559]">{comments.length}</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Client ID</p>
          <p className="text-xl font-extrabold text-[#5f41b2]">#{clientId || 'N/A'}</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Updated</p>
          <p className="text-sm font-semibold text-[#1b2559]">
            {comments.length > 0 ? formatDate(comments[0].createdAt) : '—'}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 [scrollbar-width:thin]">
          {loading && comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 py-16">
              <Loader2 className="w-8 h-8 animate-spin text-[#5f41b2]" />
              <p className="text-sm font-semibold">Loading comments...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-rose-500 gap-2 py-16">
              <AlertTriangle className="w-8 h-8" />
              <p className="text-sm font-semibold">Failed to load comments</p>
              <p className="text-xs text-slate-400">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition shadow-sm cursor-pointer"
              >
                Try Again
              </button>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 py-16">
              <MessageSquare className="w-12 h-12 opacity-20" />
              <p className="text-sm font-semibold">No comments found for this client</p>
              <p className="text-xs text-slate-400">Client ID: #{clientId || 'N/A'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-slate-50/60 rounded-xl p-4 border border-slate-100 hover:border-indigo-200 transition group"
                >
                  {/* Comment Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span className="flex items-center gap-1.5 text-sm font-bold text-[#1b2559]">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {comment.employeeName || 'Unknown'}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {formatDate(comment.createdAt)}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        {getCommentTypeBadge(comment.commentType)}
                      </div>

                      {/* Comment Text - Editable */}
                      {editingId === comment.id ? (
                        <div className="flex items-start gap-2 mt-2">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="flex-1 p-2 border border-indigo-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none min-h-[60px] bg-white"
                            placeholder="Edit comment..."
                            autoFocus
                          />
                          <div className="flex gap-1.5 pt-1">
                            <button
                              onClick={() => handleSaveEdit(comment.id)}
                              className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition shadow-sm"
                              title="Save"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition shadow-sm"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
                          {comment.comment}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {editingId !== comment.id && (
                      <div className="flex gap-1.5 shrink-0">
                        {/* ✅ Changed from Edit2 to SquarePen */}
                        <button
                          onClick={() => handleEdit(comment)}
                          className="p-1.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-lg transition shadow-sm"
                          title="Edit comment"
                        >
                          <SquarePen className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(comment.id)}
                          disabled={deletingId === comment.id}
                          className="p-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-lg transition shadow-sm disabled:opacity-50"
                          title="Delete comment"
                        >
                          {deletingId === comment.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {comments.length > 0 && (
          <div className="p-3.5 border-t border-slate-100 shrink-0 text-xs text-slate-500 flex justify-between items-center bg-slate-50/40">
            <span>Total {comments.length} comment{comments.length === 1 ? '' : 's'}</span>
            <div className="flex items-center gap-3">
              <span className="text-slate-400">Client ID: #{clientId}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminViewCommentsByClientID;