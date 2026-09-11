// src/features/admin/crm/AdminViewClientsByEmpID.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import { fetchClientsByEmployee } from '../../../store/slices/adminCRMSlice';
import { fetchUsers } from '../../../store/slices/usersSlice';
import { fetchTeams } from '../../../store/slices/teamsSlice';
import { bulkAssignToPreparation } from '../../../store/slices/prepSlice';
import { useToast } from '../../../contexts/ToastContext';
import {
  Loader2,
  Users,
  ArrowLeft,
  RefreshCw,
  Mail,
  Phone,
  Building2,
  Clock,
  AlertTriangle,
  User,
  Briefcase,
  UserCheck,
  FileText,
  MessageSquare,
  ArrowRightCircle,
  X,
  Check,
  Layers,
  Sparkles,
} from 'lucide-react';

const AdminViewClientsByEmpID: React.FC = () => {
  const { empID } = useParams<{ empID: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();

  // Redux state
  const { clients, totalClients, loading, error } = useSelector((state: RootState) => state.adminCRM);
  const { list: allUsers, loading: usersLoading } = useSelector((state: RootState) => state.users);
  const { list: allTeams } = useSelector((state: RootState) => state.teams);

  // Pagination & Infinite Scroll State
  const [page, setPage] = useState(0);
  const size = 20;
  const [allClientList, setAllClientList] = useState<typeof clients>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const observerRef = useRef<IntersectionObserver | null>(null);

  // Modal state for "Move to Prep"
  const [showPrepModal, setShowPrepModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<{ id: number; name: string } | null>(null);
  const [selectedPrepEmployeeId, setSelectedPrepEmployeeId] = useState<number | ''>('');
  const [isMoving, setIsMoving] = useState(false);

  // Read query parameters (employee info)
  const employeeName = searchParams.get('name') || 'Unknown';
  const employeeCode = searchParams.get('code') || '—';
  const employeeEmail = searchParams.get('email') || '—';
  const employeePhone = searchParams.get('phone') || '—';
  const department = searchParams.get('dept') || '—';
  const team = searchParams.get('team') || '—';
  const role = searchParams.get('role') || '—';
  const workMode = searchParams.get('workMode') || '—';

  // Fetch users and teams on mount if not already loaded
  useEffect(() => {
    if (allUsers.length === 0 && !usersLoading) {
      dispatch(fetchUsers());
    }
    if (allTeams.length === 0) {
      dispatch(fetchTeams());
    }
  }, [dispatch, allUsers.length, allTeams.length, usersLoading]);

  // Sync redux clients into accumulative infinite scroll list
  useEffect(() => {
    if (page === 0) {
      setAllClientList(clients);
    } else if (clients.length > 0) {
      setAllClientList((prev) => {
        const existingIds = new Set(prev.map((c) => c.clientId));
        const newUniqueClients = clients.filter((c) => !existingIds.has(c.clientId));
        return [...prev, ...newUniqueClients];
      });
    }

    if (totalClients > 0) {
      setHasMore(allClientList.length + clients.length < totalClients || clients.length === size);
    } else {
      setHasMore(clients.length === size);
    }
    setIsFetchingMore(false);
  }, [clients, totalClients, page]);

  // Fetch clients on empID mount or page change
  useEffect(() => {
    if (empID) {
      const employeeId = parseInt(empID, 10);
      if (!isNaN(employeeId)) {
        if (page > 0) setIsFetchingMore(true);
        dispatch(fetchClientsByEmployee({ employeeId, pageable: { page, size } }));
      } else {
        showToast('Invalid employee ID', 'error');
      }
    }
  }, [empID, dispatch, page, size, showToast]);

  // Infinite Scroll Trigger Callback
  const lastClientElementRef = useCallback(
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
    if (empID) {
      const employeeId = parseInt(empID, 10);
      if (!isNaN(employeeId)) {
        setAllClientList([]);
        setHasMore(true);
        if (page === 0) {
          dispatch(fetchClientsByEmployee({ employeeId, pageable: { page: 0, size } }));
        } else {
          setPage(0);
        }
      }
    }
  };

  // ============================================================
  // Open the modal (Move to Prep)
  // ============================================================
  const handleMoveToPrepClick = (clientId: number, clientName: string) => {
    setSelectedClient({ id: clientId, name: clientName });
    setSelectedPrepEmployeeId('');
    setShowPrepModal(true);
  };

  // ============================================================
  // Confirm move to Prep
  // ============================================================
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
          prepEmployeeId: selectedPrepEmployeeId,
        })
      ).unwrap();

      showToast(`Client "${selectedClient.name}" moved to Preparation Team successfully!`, 'success');
      handleRefresh();
      closePrepModal();
    } catch (err: any) {
      showToast(err || 'Failed to move client', 'error');
    } finally {
      setIsMoving(false);
    }
  };

  // ============================================================
  // Close modal
  // ============================================================
  const closePrepModal = () => {
    setShowPrepModal(false);
    setSelectedClient(null);
    setSelectedPrepEmployeeId('');
    setIsMoving(false);
  };

  const handleMoveToEstimationClick = (clientId: number, clientName: string) => {
    console.log('Move to Estimation button clicked', clientId, clientName);
  };

  const prepEmployees = allUsers.filter(
    (u) => u.active && u.departmentName?.toUpperCase() === 'PREPARATION'
  );

  const groupedByTeam: Record<string, typeof prepEmployees> = {};
  prepEmployees.forEach((emp) => {
    const key = emp.teamId ? String(emp.teamId) : 'unassigned';
    if (!groupedByTeam[key]) {
      groupedByTeam[key] = [];
    }
    groupedByTeam[key].push(emp);
  });

  const getTeamName = (teamId: number | null) => {
    if (teamId === null) return 'Unassigned';
    const team = allTeams.find((t) => t.id === teamId);
    return team ? team.name : 'Unknown Team';
  };

  // ============================================================
  // Helper
  // ============================================================
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="w-full min-h-0 flex-1 flex flex-col font-sans overflow-hidden bg-gray-50/60 p-0">
      {/* Re-designed Modern Header Card - Full Width */}
      <div className="bg-white border-b border-gray-200/90 px-4 py-3.5 shrink-0 mb-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => navigate(-1)}
              className="p-2 bg-gray-50 border border-gray-200 rounded-[5px] hover:bg-[#5f41b2] hover:text-white hover:border-[#5f41b2] transition-all cursor-pointer text-gray-600 shadow-2xs active:scale-95 shrink-0"
              title="Go back"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#5f41b2]/10 border border-[#5f41b2]/20 rounded-[5px]">
                <Users className="w-5 h-5 text-[#5f41b2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-extrabold text-[#0F172A] tracking-wider uppercase leading-none">
                    Assigned Clients
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-[#5f41b2] border border-purple-100 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {totalClients || allClientList.length} {(totalClients || allClientList.length) === 1 ? 'Client' : 'Clients'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Overview and operations for assigned pipeline clients
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            className="self-end lg:self-auto flex items-center gap-2 px-3.5 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-[5px] text-xs font-bold text-gray-700 transition shadow-2xs active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#5f41b2]' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Employee Summary Pills */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50/80 border border-purple-100 rounded-[5px] font-bold text-[#5f41b2]">
            <User className="w-3.5 h-3.5 text-[#5f41b2]" />
            {employeeName}
            <span className="text-gray-400 font-medium">({employeeCode})</span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-[5px] text-gray-600 font-medium">
            <Mail className="w-3.5 h-3.5 text-gray-400" />
            {employeeEmail}
          </span>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-[5px] text-gray-600 font-medium">
            <Phone className="w-3.5 h-3.5 text-gray-400" />
            {employeePhone}
          </span>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-[5px] text-gray-600 font-medium">
            <Building2 className="w-3.5 h-3.5 text-gray-400" />
            {department}
          </span>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-[5px] text-gray-600 font-medium">
            <Users className="w-3.5 h-3.5 text-gray-400" />
            {team}
          </span>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-[5px] text-gray-600 font-medium">
            <Briefcase className="w-3.5 h-3.5 text-gray-400" />
            {role}
          </span>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-[5px] text-gray-600 font-medium">
            <UserCheck className="w-3.5 h-3.5 text-gray-400" />
            {workMode}
          </span>
        </div>
      </div>

      {/* Main Clients Cards Area: Infinite Scroll Container */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4">
        {loading && allClientList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#5f41b2]" />
            <p className="text-sm font-semibold">Loading clients...</p>
          </div>
        ) : error && allClientList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-rose-500 gap-2 py-16 bg-white border border-gray-200 rounded-[5px]">
            <AlertTriangle className="w-8 h-8" />
            <p className="text-sm font-semibold">Failed to load clients</p>
            <p className="text-xs text-slate-400">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-[5px] transition shadow-2xs cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : allClientList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 py-16 bg-white border border-gray-200/80 rounded-[5px]">
            <Users className="w-12 h-12 opacity-20" />
            <p className="text-sm font-semibold">No clients assigned to this employee</p>
          </div>
        ) : (
          <>
            {/* Box-shaped Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5 pb-4">
              {allClientList.map((client) => {
                const isPrep = client.currentStage?.toUpperCase() === 'PREP';

                return (
                  <div
                    key={client.clientId}
                    className="bg-white rounded-[5px] border border-gray-200/80 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between overflow-hidden"
                  >
                    {/* Card Header */}
                    <div className="p-4 border-b border-gray-100 flex items-start justify-between gap-3 bg-white">
                      <div>
                        <h3 className="font-extrabold text-[#0F172A] text-sm leading-snug">
                          {client.name}
                        </h3>
                        <p className="text-[11px] font-mono text-gray-400 font-bold mt-0.5">
                          ID: #{client.clientId}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
                            client.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : client.status === 'FOLLOW_UP'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : client.status === 'NOT_INTERESTED'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {client.status || 'NEW'}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200 uppercase">
                          Stage: {client.currentStage || '—'}
                        </span>
                      </div>
                    </div>

                    {/* Card Body - Contact Info & Assigned Date */}
                    <div className="p-4 space-y-3 flex-1 text-xs">
                      <div className="space-y-1.5 text-slate-600">
                        <div className="flex items-center gap-2 truncate" title={client.email || '—'}>
                          <Mail className="w-3.5 h-3.5 text-[#5f41b2] shrink-0" />
                          <span className="font-medium truncate">{client.email || '—'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-[#5f41b2] shrink-0" />
                          <span className="font-medium">{client.phone || '—'}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-gray-400 font-medium text-[11px]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          Assigned:
                        </span>
                        <span className="text-gray-600 font-semibold">{formatDate(client.assignedAt)}</span>
                      </div>
                    </div>

                    {/* Card Actions Toolbar */}
                    <div className="p-3 bg-gray-50/70 border-t border-gray-100 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => navigate(`/admin/crm/client-documents/${client.clientId}`)}
                        className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-blue-50/80 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-blue-600 rounded-[5px] text-xs font-bold transition shadow-2xs active:scale-95 cursor-pointer h-8 flex-1 min-w-[70px]"
                        title="View client documents"
                      >
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span>Docs</span>
                      </button>

                      <button
                        onClick={() => navigate(`/admin/crm/view-client-comments/${client.clientId}`)}
                        className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-purple-50/80 hover:bg-purple-600 text-purple-700 hover:text-white border border-purple-200 hover:border-purple-600 rounded-[5px] text-xs font-bold transition shadow-2xs active:scale-95 cursor-pointer h-8 flex-1 min-w-[85px]"
                        title="View client comments"
                      >
                        <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                        <span>Comments</span>
                      </button>

                      <button
                        onClick={() =>
                          navigate(
                            `/admin/crm/view-tax-organizer/${client.clientId}?name=${encodeURIComponent(client.name)}`
                          )
                        }
                        className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-fuchsia-50/80 hover:bg-fuchsia-600 text-fuchsia-800 hover:text-white border border-fuchsia-200 hover:border-fuchsia-600 rounded-[5px] text-xs font-bold transition shadow-2xs active:scale-95 cursor-pointer h-8 flex-1 min-w-[80px]"
                        title="View Tax Organizer form for this client"
                      >
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span>Tax Org</span>
                      </button>

                      {isPrep ? (
                        <>
                          <button
                            onClick={() => handleMoveToEstimationClick(client.clientId, client.name)}
                            className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-amber-50/80 hover:bg-amber-600 text-amber-800 hover:text-white border border-amber-200 hover:border-amber-600 rounded-[5px] text-xs font-bold transition shadow-2xs active:scale-95 cursor-pointer h-8 flex-1 min-w-[120px]"
                            title="Move this client to Estimation Team"
                          >
                            <ArrowRightCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>Move Estimation</span>
                          </button>

                          <button
                            onClick={() =>
                              navigate(
                                `/admin/crm/view-drafts/${client.clientId}?name=${encodeURIComponent(client.name)}`
                              )
                            }
                            className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-cyan-50/80 hover:bg-cyan-600 text-cyan-800 hover:text-white border border-cyan-200 hover:border-cyan-600 rounded-[5px] text-xs font-bold transition shadow-2xs active:scale-95 cursor-pointer h-8 flex-1 min-w-[70px]"
                            title="View tax drafts for this client"
                          >
                            <Layers className="w-3.5 h-3.5 shrink-0" />
                            <span>Drafts</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleMoveToPrepClick(client.clientId, client.name)}
                          className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-amber-50/80 hover:bg-amber-600 text-amber-800 hover:text-white border border-amber-200 hover:border-amber-600 rounded-[5px] text-xs font-bold transition shadow-2xs active:scale-95 cursor-pointer h-8 flex-1 min-w-[100px]"
                          title="Move this client to Preparation Team"
                        >
                          <ArrowRightCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Move Prep</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Infinite Scroll Trigger Sentinel & Loading state */}
            <div ref={lastClientElementRef} className="w-full py-4 flex items-center justify-center">
              {isFetchingMore && (
                <div className="flex items-center gap-2 text-xs font-semibold text-[#5f41b2]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading more clients...</span>
                </div>
              )}
              {!hasMore && allClientList.length > 0 && (
                <span className="text-xs text-slate-400 font-medium">All clients loaded</span>
              )}
            </div>
          </>
        )}
      </div>

      {/* MODAL: Select Preparation Employee */}
      {showPrepModal && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[5px] shadow-2xl w-full max-w-md p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[#1b2559] flex items-center gap-2">
                <div className="p-1.5 bg-amber-50 rounded-[5px] border border-amber-200">
                  <ArrowRightCircle className="w-5 h-5 text-amber-600" />
                </div>
                Move to Preparation
              </h3>
              <button
                onClick={closePrepModal}
                className="p-1.5 rounded-[5px] hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition cursor-pointer"
                disabled={isMoving}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              Select a <strong className="text-slate-800">Preparation Team</strong> employee to assign client{' '}
              <span className="font-bold text-[#1b2559]">"{selectedClient.name}"</span> (ID: #{selectedClient.id}).
            </p>

            {usersLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
              </div>
            ) : prepEmployees.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-[5px] p-4 text-sm text-amber-800">
                No active employees found in the Preparation department.
              </div>
            ) : (
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Select Preparation Employee
                </label>
                <div className="relative">
                  <select
                    value={selectedPrepEmployeeId}
                    onChange={(e) =>
                      setSelectedPrepEmployeeId(e.target.value ? Number(e.target.value) : '')
                    }
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-[5px] focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-sm font-medium text-slate-700 shadow-2xs"
                    disabled={isMoving}
                  >
                    <option value="">-- Choose an employee --</option>
                    {Object.entries(groupedByTeam).map(([teamKey, employees]) => {
                      const teamName = teamKey === 'unassigned' ? 'Unassigned' : getTeamName(Number(teamKey));
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
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={closePrepModal}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-[5px] transition cursor-pointer"
                disabled={isMoving}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMove}
                disabled={isMoving || !selectedPrepEmployeeId || prepEmployees.length === 0}
                className="px-5 py-2 flex items-center gap-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-[5px] transition shadow-xs disabled:opacity-50 cursor-pointer active:scale-95"
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

export default AdminViewClientsByEmpID;