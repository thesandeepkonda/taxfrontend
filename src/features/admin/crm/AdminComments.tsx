// src/features/admin/crm/AdminComments.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import {
  fetchClients,
  fetchClientComments,
  deleteComment,
  editComment,                // ✅ NEW: edit comment thunk
  AdminClientResponse,
} from '../../../store/slices/adminCRMSlice';
import { useToast } from '../../../contexts/ToastContext';
import {
  MessageSquare,
  Loader2,
  Trash2,
  RefreshCw,
  User,
  Clock,
  ChevronDown,
  Search,
  Check,
  Edit,                      // ✅ NEW: edit icon
  X,                         // Already used for close, but we use for cancel as well
} from 'lucide-react';

const PAGE_SIZE = 10;

const AdminComments: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();
  const { comments, loading: commentsLoading } = useSelector((state: RootState) => state.adminCRM);

  // Pagination & Client State
  const [clientList, setClientList] = useState<AdminClientResponse[]>([]);
  const [page, setPage] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loadingClients, setLoadingClients] = useState<boolean>(false);

  // Dropdown UI State
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClientId, setSelectedClientId] = useState<number | ''>('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // ✅ NEW: Edit comment states
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState<string>('');

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownListRef = useRef<HTMLDivElement>(null);

  // Floating Dropdown Coordinates
  const [dropdownCoords, setDropdownCoords] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0,
  });

  // Calculate button position on open/resize
  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownCoords({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  const toggleDropdown = () => {
    if (!isDropdownOpen) {
      updatePosition();
    }
    setIsDropdownOpen((prev) => !prev);
  };

  // Load clients paginated
  const loadClientBatch = useCallback(async (pageNum: number) => {
    if (loadingClients) return;
    setLoadingClients(true);

    try {
      const response: any = await dispatch(
        fetchClients({ page: pageNum, size: PAGE_SIZE })
      ).unwrap();

      const newContent: AdminClientResponse[] = response?.content || [];
      const totalElements: number = response?.totalElements || 0;

      setClientList((prev) => {
        const combined = pageNum === 0 ? newContent : [...prev, ...newContent];
        const unique = Array.from(new Map(combined.map((c) => [c.clientId, c])).values());
        setHasMore(unique.length < totalElements);
        return unique;
      });
      setPage(pageNum);
    } catch (err: any) {
      showToast(err || 'Failed to load clients', 'error');
    } finally {
      setLoadingClients(false);
    }
  }, [dispatch, loadingClients, showToast]);

  // Initial Load (Page 0)
  useEffect(() => {
    loadClientBatch(0);
  }, []);

  // Fetch comments when selected
  useEffect(() => {
    if (selectedClientId) {
      dispatch(fetchClientComments(Number(selectedClientId)));
    }
  }, [selectedClientId, dispatch]);

  // Handle outside click & window resize/scroll
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      if (isDropdownOpen) {
        updatePosition();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isDropdownOpen, updatePosition]);

  // Infinite Scroll Trigger inside dropdown
  const handleDropdownScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 25;

    if (isAtBottom && hasMore && !loadingClients) {
      loadClientBatch(page + 1);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    setDeletingId(commentId);
    try {
      await dispatch(deleteComment(commentId)).unwrap();
      showToast('Comment deleted successfully', 'success');
      if (selectedClientId) {
        dispatch(fetchClientComments(Number(selectedClientId)));
      }
    } catch (err: any) {
      showToast(err || 'Failed to delete comment', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // ✅ NEW: Edit comment handler
  const handleEditComment = async (commentId: number) => {
    if (!editCommentText.trim()) {
      showToast('Comment cannot be empty', 'warning');
      return;
    }
    try {
      await dispatch(editComment({ commentId, comment: editCommentText.trim() })).unwrap();
      showToast('Comment updated successfully', 'success');
      setEditingCommentId(null);
      setEditCommentText('');
      if (selectedClientId) {
        dispatch(fetchClientComments(Number(selectedClientId)));
      }
    } catch (err: any) {
      showToast(err || 'Failed to update comment', 'error');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const selectedClient = clientList.find((c) => c.clientId === selectedClientId);

  const filteredClients = clientList.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(c.clientId).includes(searchQuery)
  );

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1b2559] tracking-tight leading-none flex items-center gap-3">
            <MessageSquare className="w-7 h-7 text-[#5f41b2]" />
            Client Comments
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">View and manage client comments</p>
        </div>
      </div>

      {/* Top Filter Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 shrink-0 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[300px] max-w-lg">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Select Client
              </label>
              {loadingClients && (
                <span className="text-[11px] font-semibold text-[#5f41b2] flex items-center gap-1 animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Fetching records...
                </span>
              )}
            </div>

            {/* Custom Trigger Button */}
            <button
              ref={buttonRef}
              type="button"
              onClick={toggleDropdown}
              className={`w-full px-4 py-3 bg-slate-50/70 hover:bg-white border rounded-xl flex items-center justify-between text-left text-sm transition-all duration-150 cursor-pointer shadow-xs ${
                isDropdownOpen
                  ? 'border-[#5f41b2] ring-4 ring-[#5f41b2]/10 bg-white'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {selectedClient ? (
                  <div className="w-6 h-6 rounded-full bg-[#5f41b2]/10 text-[#5f41b2] font-bold text-xs flex items-center justify-center shrink-0">
                    {selectedClient.name.charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <span className={`truncate font-medium ${selectedClient ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>
                  {selectedClient ? `${selectedClient.name} (ID: ${selectedClient.clientId})` : 'Choose a client to view comments...'}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {loadingClients && <Loader2 className="w-4 h-4 text-[#5f41b2] animate-spin" />}
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-[#5f41b2]' : ''}`} />
              </div>
            </button>
          </div>

          {selectedClientId && (
            <button
              onClick={() => dispatch(fetchClientComments(Number(selectedClientId)))}
              className="min-h-[44px] px-4 flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-sm cursor-pointer shadow-2xs active:scale-95"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          )}
        </div>
      </div>

      {/* PORTAL DROPDOWN (Cannot be cut off by ANY parent container) */}
      {isDropdownOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: `${dropdownCoords.top}px`,
              left: `${dropdownCoords.left}px`,
              width: `${dropdownCoords.width}px`,
              zIndex: 99999,
            }}
            className="bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
          >
            {/* Search Header */}
            <div className="p-2.5 border-b border-slate-100 bg-slate-50/90 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5f41b2] font-medium"
                  autoFocus
                />
              </div>
            </div>

            {/* Scrollable Items with Fixed Height */}
            <div
              ref={dropdownListRef}
              onScroll={handleDropdownScroll}
              className="max-h-[220px] overflow-y-auto divide-y divide-slate-50 text-sm select-none"
            >
              {filteredClients.length === 0 && !loadingClients && (
                <div className="py-6 text-center text-xs text-slate-400 font-medium">
                  No matching clients found.
                </div>
              )}

              {filteredClients.map((client) => {
                const isSelected = selectedClientId === client.clientId;
                return (
                  <div
                    key={client.clientId}
                    onClick={() => {
                      setSelectedClientId(client.clientId);
                      setIsDropdownOpen(false);
                      setSearchQuery('');
                    }}
                    className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#5f41b2]/10 text-[#5f41b2] font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected ? 'bg-[#5f41b2] text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-800">{client.name}</p>
                        <p className="text-[10px] text-slate-400">ID: #{client.clientId}</p>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-[#5f41b2]/10 flex items-center justify-center text-[#5f41b2] shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </span>
                    )}
                  </div>
                );
              })}

              {/* Crystal Clear Infinite Scroll Loader */}
              {loadingClients && (
                <div className="p-3 flex items-center justify-center gap-2 text-xs font-semibold text-[#5f41b2] bg-purple-50/80 border-t border-purple-100">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading next 10 clients...</span>
                </div>
              )}

              {!hasMore && filteredClients.length > 0 && (
                <div className="py-2 text-center text-[10px] font-bold text-slate-400 bg-slate-50 uppercase tracking-wider">
                  All {clientList.length} clients loaded
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* Comments List View */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col min-h-0 overflow-hidden">
        <div className="p-4.5 border-b border-slate-100 shrink-0 flex items-center justify-between bg-slate-50/40">
          <h2 className="text-base font-bold text-[#1b2559]">
            {selectedClient ? (
              <>Comments for <span className="text-[#5f41b2]">{selectedClient.name}</span></>
            ) : (
              'Select a client above to view comments'
            )}
          </h2>
          {commentsLoading && <Loader2 className="w-5 h-5 text-[#5f41b2] animate-spin" />}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {commentsLoading && comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#5f41b2]" />
              <p className="text-sm font-semibold">Loading comments...</p>
            </div>
          ) : !selectedClientId ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
              <MessageSquare className="w-12 h-12 opacity-20" />
              <p className="text-sm font-semibold">Please select a client from the dropdown</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
              <MessageSquare className="w-12 h-12 opacity-20" />
              <p className="text-sm font-semibold">No comments logged for this client</p>
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="border border-slate-100 rounded-2xl p-4 hover:border-blue-200 transition bg-white shadow-xs"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
                          <User className="w-3.5 h-3.5" />
                          {comment.employeeName}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
                          <Clock className="w-3 h-3" />
                          {formatDate(comment.createdAt)}
                        </span>
                        {comment.commentType && (
                          <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full border border-purple-200">
                            {comment.commentType}
                          </span>
                        )}
                      </div>

                      {/* ✅ Edit mode vs View mode */}
                      {editingCommentId === comment.id ? (
                        <div className="mt-2 space-y-2">
                          <textarea
                            value={editCommentText}
                            onChange={(e) => setEditCommentText(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#5f41b2] focus:border-transparent"
                            rows={3}
                            autoFocus
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditComment(comment.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition"
                            >
                              <Check className="w-4 h-4" /> Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingCommentId(null);
                                setEditCommentText('');
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-lg transition"
                            >
                              <X className="w-4 h-4" /> Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{comment.comment}</p>
                      )}
                    </div>

                    {/* Action Buttons – only if not in edit mode */}
                    {editingCommentId !== comment.id && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            setEditingCommentId(comment.id);
                            setEditCommentText(comment.comment);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                          title="Edit Comment"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={deletingId === comment.id}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition shrink-0 disabled:opacity-50 cursor-pointer"
                          title="Delete Comment"
                        >
                          {deletingId === comment.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
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
      </div>
    </div>
  );
};

export default AdminComments;