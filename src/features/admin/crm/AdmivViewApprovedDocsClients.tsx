// src/features/admin/crm/AdmivViewApprovedDocsClients.tsx
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import { fetchVerifiedDocumentClients } from '../../../store/slices/adminDocumentsSlice';
import { bulkAssignToPreparation } from '../../../store/slices/prepSlice';
import { fetchUsers } from '../../../store/slices/usersSlice';
import { fetchTeams } from '../../../store/slices/teamsSlice';
import { useToast } from '../../../contexts/ToastContext';
import {
  ArrowLeft,
  RefreshCw,
  Loader2,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Mail,
  Phone,
  FileCheck2,
  Clock,
  Search,
  ShieldCheck,
  Eye,
  MessageSquare,
  Sparkles,
  ArrowRightCircle,
  Users,
  X,
  Check,
  Layers,
  Calculator, // ✅ NEW: for Estimation icon
} from 'lucide-react';

const PAGE_SIZE = 20;

const AdmivViewApprovedDocsClients: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();

  const { verifiedClients, verifiedTotal, loading, error } = useSelector(
    (state: RootState) => state.adminDocuments
  );
  const { list: allUsers, loading: usersLoading } = useSelector(
    (state: RootState) => state.users
  );
  const { list: allTeams } = useSelector((state: RootState) => state.teams);

  // Accumulative list for infinite scroll
  const [allClients, setAllClients] = useState<typeof verifiedClients>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ✅ Move-to-Prep modal state
  const [showPrepModal, setShowPrepModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<{ id: number; name: string } | null>(null);
  const [selectedPrepEmployeeId, setSelectedPrepEmployeeId] = useState<number | ''>('');
  const [isMoving, setIsMoving] = useState(false);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const allClientsRef = useRef<typeof verifiedClients>([]);

  // Keep ref in sync for stable hasMore checks
  useEffect(() => {
    allClientsRef.current = allClients;
  }, [allClients]);

  // ============================================================
  // Load users + teams once (needed for Move to Prep modal)
  // ============================================================
  useEffect(() => {
    if (allUsers.length === 0 && !usersLoading) {
      dispatch(fetchUsers());
    }
    if (allTeams.length === 0) {
      dispatch(fetchTeams());
    }
  }, [dispatch, allUsers.length, allTeams.length, usersLoading]);

  // ============================================================
  // Fetch when page changes
  // ============================================================
  useEffect(() => {
    if (page > 0) setIsFetchingMore(true);
    dispatch(fetchVerifiedDocumentClients({ page, size: PAGE_SIZE }));
  }, [dispatch, page]);

  // ============================================================
  // Sync redux slice into accumulative list
  // ============================================================
  useEffect(() => {
    const content = verifiedClients || [];

    if (page === 0) {
      setAllClients(content);
    } else if (content.length > 0) {
      setAllClients((prev) => {
        const existingIds = new Set(prev.map((c) => c.clientId));
        const newUnique = content.filter((c) => !existingIds.has(c.clientId));
        return [...prev, ...newUnique];
      });
    }

    setIsFetchingMore(false);

    const loadedCount = page === 0
      ? content.length
      : allClientsRef.current.length + content.length;

    const moreAvailable = content.length > 0 && loadedCount < verifiedTotal;
    setHasMore(moreAvailable);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verifiedClients, verifiedTotal]);

  // ============================================================
  // Infinite scroll observer
  // ============================================================
  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading || isFetchingMore) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !isFetchingMore) {
            setPage((prev) => prev + 1);
          }
        },
        { rootMargin: '120px' }
      );

      if (node) observerRef.current.observe(node);
    },
    [loading, isFetchingMore, hasMore]
  );

  // ============================================================
  // Refresh
  // ============================================================
  const handleRefresh = () => {
    setAllClients([]);
    setHasMore(true);
    if (page === 0) {
      dispatch(fetchVerifiedDocumentClients({ page: 0, size: PAGE_SIZE }));
    } else {
      setPage(0);
    }
  };

  // ============================================================
  // ✅ Move-to-Prep Handlers
  // ============================================================
  const handleMoveToPrepClick = (clientId: number, clientName: string) => {
    setSelectedClient({ id: clientId, name: clientName });
    setSelectedPrepEmployeeId('');
    setShowPrepModal(true);
  };

  const closePrepModal = () => {
    setShowPrepModal(false);
    setSelectedClient(null);
    setSelectedPrepEmployeeId('');
    setIsMoving(false);
  };

  const handleConfirmMove = async () => {
    if (!selectedClient) return;
    if (!selectedPrepEmployeeId) {
      showToast('Please select a Preparation employee', 'warning');
      return;
    }

    setIsMoving(true);
    try {
      await dispatch(
        bulkAssignToPreparation({
          clientIds: [selectedClient.id],
          prepEmployeeId: Number(selectedPrepEmployeeId),
        })
      ).unwrap();

      showToast(
        `Client "${selectedClient.name}" moved to Preparation Team successfully!`,
        'success'
      );
      closePrepModal();
      handleRefresh();
    } catch (err: any) {
      showToast(err || 'Failed to move client to Preparation', 'error');
    } finally {
      setIsMoving(false);
    }
  };

  // ============================================================
  // ✅ Drafts navigation handler
  // ============================================================
  const handleViewDraftsClick = (clientId: number, clientName: string) => {
    navigate(
      `/admin/crm/view-drafts/${clientId}?name=${encodeURIComponent(clientName)}`
    );
  };

  // ============================================================
  // ✅ NEW: Move to Estimation Handler
  // ============================================================
  const handleMoveToEstimationClick = (clientId: number, clientName: string) => {
    // TODO: Replace with your actual Move-to-Estimation flow/modal
    console.log('Move to Estimation clicked for:', clientId, clientName);
    showToast(
      `Move to Estimation for "${clientName}" — wire this to your estimation API.`,
      'info'
    );

    // Example: navigate to an estimation assignment page
    // navigate(`/admin/crm/move-to-estimation/${clientId}?name=${encodeURIComponent(clientName)}`);
  };

  // ============================================================
  // PREP employees list (grouped by team)
  // ============================================================
  const prepEmployees = useMemo(() => {
    return allUsers.filter(
      (u) => u.active && u.departmentName?.toUpperCase() === 'PREPARATION'
    );
  }, [allUsers]);

  const groupedPrepEmployees = useMemo(() => {
    const groups: Record<string, typeof prepEmployees> = {};
    prepEmployees.forEach((emp) => {
      const key = emp.teamId ? String(emp.teamId) : 'unassigned';
      if (!groups[key]) groups[key] = [];
      groups[key].push(emp);
    });
    return groups;
  }, [prepEmployees]);

  const getTeamName = (teamId: string) => {
    if (teamId === 'unassigned') return 'Unassigned';
    const team = allTeams.find((t) => t.id === Number(teamId));
    return team ? team.name : 'Unknown Team';
  };

  // ============================================================
  // Filter
  // ============================================================
  const filteredClients = allClients.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      String(c.clientId).includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q)) ||
      (c.documentStatus && c.documentStatus.toLowerCase().includes(q)) ||
      (c.currentStage && c.currentStage.toLowerCase().includes(q)) ||
      (c.status && c.status.toLowerCase().includes(q))
    );
  });

  // ============================================================
  // Badges
  // ============================================================
  const getDocStatusBadge = (status: string) => {
    const normalized = (status || '').toUpperCase();
    if (normalized === 'VERIFIED' || normalized === 'APPROVED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
          <ShieldCheck className="w-3 h-3" /> Verified
        </span>
      );
    }
    if (normalized === 'SUBMITTED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wide">
          <CheckCircle2 className="w-3 h-3" /> Submitted
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wide">
        <Clock className="w-3 h-3" /> {status || 'PENDING'}
      </span>
    );
  };

  const getClientStatusBadge = (status: string | null | undefined) => {
    const normalized = (status || 'NEW').toUpperCase();
    const styles: Record<string, string> = {
      NEW: 'bg-blue-50 text-blue-700 border-blue-200',
      COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      FOLLOW_UP: 'bg-amber-50 text-amber-700 border-amber-200',
      NOT_INTERESTED: 'bg-rose-50 text-rose-700 border-rose-200',
      PREPARATION_ASSIGNED: 'bg-purple-50 text-purple-700 border-purple-200',
      DRAFT_APPROVED: 'bg-cyan-50 text-cyan-700 border-cyan-200', // ✅ NEW: nice color
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ${
          styles[normalized] || 'bg-slate-100 text-slate-700 border-slate-200'
        }`}
      >
        {normalized.replace(/_/g, ' ')}
      </span>
    );
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden">
      {/* Header Card */}
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
              <div className="p-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
                <FileCheck2 className="w-5 h-5 text-emerald-600" />
              </div>
              <h1 className="text-xl font-extrabold text-[#1b2559] tracking-tight leading-none">
                Approved Documents Clients
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {verifiedTotal || allClients.length} Total
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Clients whose documents have been verified/approved
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#5f41b2] w-64 shadow-2xs text-slate-700"
            />
          </div>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#5f41b2]' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200/80 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {loading && allClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 py-16">
              <Loader2 className="w-8 h-8 animate-spin text-[#5f41b2]" />
              <p className="text-sm font-semibold">Loading verified clients...</p>
            </div>
          ) : error && allClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-rose-500 gap-2 py-16">
              <AlertTriangle className="w-8 h-8" />
              <p className="text-sm font-semibold">Failed to load clients</p>
              <p className="text-xs text-slate-400">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition shadow-sm cursor-pointer"
              >
                Try Again
              </button>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 py-16">
              <FileCheck2 className="w-12 h-12 opacity-20" />
              <p className="text-sm font-semibold">
                {searchQuery ? 'No matching clients found' : 'No approved documents clients found'}
              </p>
            </div>
          ) : (
            <>
              <table className="w-full text-left text-sm border-collapse min-w-[1500px]">
                <thead className="bg-slate-50/90 sticky top-0 z-10 border-b border-slate-100 backdrop-blur-xs">
                  <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    <th className="py-3 px-4 rounded-l-xl min-w-[200px]">Client</th>
                    <th className="py-3 px-4 min-w-[220px]">Contact</th>
                    <th className="py-3 px-3 text-center min-w-[120px]">Total</th>
                    <th className="py-3 px-3 text-center min-w-[140px]">Submitted</th>
                    <th className="py-3 px-3 text-center min-w-[120px]">Pending</th>
                    <th className="py-3 px-3 text-center min-w-[130px]">Doc Status</th>
                    <th className="py-3 px-3 text-center min-w-[110px]">Stage</th>
                    <th className="py-3 px-3 text-center min-w-[120px]">Client Status</th>
                    <th className="py-3 px-4 text-center rounded-r-xl min-w-[420px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClients.map((client) => {
                    // ✅ Stage checks
                    const stage = (client.currentStage || '').toUpperCase();
                    const isDocStage = stage === 'DOC';
                    const isPrepStage = stage === 'PREP';

                    // ✅ Status checks
                    const clientStatus = (client.status || '').toUpperCase();
                    const isDraftApproved = clientStatus === 'DRAFT_APPROVED';

                    return (
                      <tr
                        key={client.clientId}
                        className="hover:bg-slate-50/70 transition group"
                      >
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <p className="font-bold text-[#1b2559] text-sm group-hover:text-[#5f41b2] transition-colors">
                            {client.name}
                          </p>
                          <p className="text-[11px] text-slate-400 font-medium">
                            ID: #{client.clientId}
                          </p>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="text-xs space-y-1">
                            <p className="text-slate-600 font-medium flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              {client.email || '—'}
                            </p>
                            <p className="text-slate-600 font-medium flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              {client.phone || '—'}
                            </p>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <span className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold">
                            <FileText className="w-3.5 h-3.5" />
                            {client.totalDocuments ?? 0}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <span className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {client.submittedDocuments ?? 0}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <span className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                            <Clock className="w-3.5 h-3.5" />
                            {client.pendingDocuments ?? 0}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          {getDocStatusBadge(client.documentStatus)}
                        </td>

                        {/* Current Stage */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wide">
                            {client.currentStage || '—'}
                          </span>
                        </td>

                        {/* Client Status */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          {getClientStatusBadge(client.status)}
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                            {/* View Docs */}
                            <button
                              onClick={() =>
                                navigate(`/admin/crm/client-documents/${client.clientId}`)
                              }
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50/80 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 hover:border-indigo-600 rounded-lg text-xs font-bold transition shadow-2xs active:scale-95 cursor-pointer h-8 whitespace-nowrap"
                              title="View client documents"
                            >
                              <Eye className="w-3.5 h-3.5 shrink-0" />
                              <span>View Docs</span>
                            </button>

                            {/* Comments */}
                            <button
                              onClick={() =>
                                navigate(`/admin/crm/view-client-comments/${client.clientId}`)
                              }
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-50/80 hover:bg-purple-600 text-purple-700 hover:text-white border border-purple-200 hover:border-purple-600 rounded-lg text-xs font-bold transition shadow-2xs active:scale-95 cursor-pointer h-8 whitespace-nowrap"
                              title="View client comments"
                            >
                              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                              <span>Comments</span>
                            </button>

                            {/* ✅ Move to Prep — only when currentStage === 'DOC' */}
                            {isDocStage && (
                              <button
                                onClick={() =>
                                  handleMoveToPrepClick(client.clientId, client.name)
                                }
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50/80 hover:bg-amber-600 text-amber-800 hover:text-white border border-amber-200 hover:border-amber-600 rounded-lg text-xs font-bold transition shadow-2xs active:scale-95 cursor-pointer h-8 whitespace-nowrap"
                                title="Move this client to Preparation Team"
                              >
                                <ArrowRightCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>Move to Prep</span>
                              </button>
                            )}

                            {/* ✅ Drafts — only when currentStage === 'PREP' */}
                            {isPrepStage && (
                              <button
                                onClick={() =>
                                  handleViewDraftsClick(client.clientId, client.name)
                                }
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50/80 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-blue-600 rounded-lg text-xs font-bold transition shadow-2xs active:scale-95 cursor-pointer h-8 whitespace-nowrap"
                                title="View tax drafts for this client"
                              >
                                <Layers className="w-3.5 h-3.5 shrink-0" />
                                <span>Drafts</span>
                              </button>
                            )}

                            {/* ✅ NEW: Move to Estimation — only when status === 'DRAFT_APPROVED' */}
                            {isDraftApproved && (
                              <button
                                onClick={() =>
                                  handleMoveToEstimationClick(client.clientId, client.name)
                                }
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-cyan-50/80 hover:bg-cyan-600 text-cyan-700 hover:text-white border border-cyan-200 hover:border-cyan-600 rounded-lg text-xs font-bold transition shadow-2xs active:scale-95 cursor-pointer h-8 whitespace-nowrap"
                                title="Move this client to Estimation Team"
                              >
                                <Calculator className="w-3.5 h-3.5 shrink-0" />
                                <span>Move to Estimation</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Infinite scroll sentinel */}
              <div
                ref={lastElementRef}
                className="w-full py-4 flex items-center justify-center"
              >
                {isFetchingMore && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#5f41b2]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading more clients...</span>
                  </div>
                )}
                {!hasMore && allClients.length > 0 && (
                  <span className="text-xs text-slate-400 font-medium">
                    All {allClients.length} clients loaded
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {filteredClients.length > 0 && (
          <div className="p-3.5 border-t border-slate-100 shrink-0 text-xs text-slate-500 flex justify-between items-center bg-slate-50/50">
            <span>
              Showing <span className="font-bold text-slate-700">{filteredClients.length}</span> of{' '}
              <span className="font-bold text-slate-700">{verifiedTotal || allClients.length}</span>{' '}
              verified clients
            </span>
            <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" /> Approved Docs
            </span>
          </div>
        )}
      </div>

      {/* ============================================================
          MOVE TO PREP MODAL
          ============================================================ */}
      {showPrepModal && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[#1b2559] flex items-center gap-2">
                <div className="p-1.5 bg-amber-50 rounded-[5px] border border-amber-200">
                  <ArrowRightCircle className="w-5 h-5 text-amber-600" />
                </div>
                Move to Preparation
              </h3>
              <button
                onClick={closePrepModal}
                disabled={isMoving}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <p className="text-sm text-slate-600 mb-4">
              Select a <strong className="text-slate-800">Preparation Team</strong> employee to
              assign client{' '}
              <span className="font-bold text-[#1b2559]">"{selectedClient.name}"</span>{' '}
              (ID: #{selectedClient.id}).
            </p>

            {usersLoading && allUsers.length === 0 ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
              </div>
            ) : prepEmployees.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                No active employees found in the Preparation department.
              </div>
            ) : (
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Select Preparation Employee
                </label>
                <select
                  value={selectedPrepEmployeeId}
                  onChange={(e) =>
                    setSelectedPrepEmployeeId(
                      e.target.value ? Number(e.target.value) : ''
                    )
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-sm font-medium text-slate-700 shadow-2xs cursor-pointer"
                  disabled={isMoving}
                >
                  <option value="">-- Choose an employee --</option>
                  {Object.entries(groupedPrepEmployees).map(([teamKey, employees]) => {
                    const teamName =
                      teamKey === 'unassigned' ? 'Unassigned' : getTeamName(teamKey);
                    return (
                      <optgroup key={teamKey} label={teamName}>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.firstName} {emp.lastName || ''} ({emp.employeeCode})
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={closePrepModal}
                disabled={isMoving}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMove}
                disabled={
                  isMoving || !selectedPrepEmployeeId || prepEmployees.length === 0
                }
                className="px-5 py-2 flex items-center gap-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95"
              >
                {isMoving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Moving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Move Client
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdmivViewApprovedDocsClients;