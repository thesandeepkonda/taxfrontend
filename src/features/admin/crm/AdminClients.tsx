// src/features/admin/crm/AdminClients.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import {
  fetchClients,
  fetchFollowUps,
  fetchNotLifted,
  fetchUnassignedClients,
  clearUnassignedClients,
  bulkAssignClients,
  AssignmentResponse,
} from '../../../store/slices/adminCRMSlice';
import { fetchUsers } from '../../../store/slices/usersSlice';
import { fetchTeams } from '../../../store/slices/teamsSlice';
import { useToast } from '../../../contexts/ToastContext';
import {
  Users,
  Search,
  Loader2,
  UserCheck,
  RefreshCw,
  X,
  Check,
  Clock,
  PhoneOff,
  Filter,
  FileText,
  MessageSquare,
  Mail,
  Phone,
  Calendar,
  Layers,
  History,
  Building2,
  FileCheck2,
  UserX,
  AlertTriangle as AlertTriangleIcon,
  ChevronDown,
  FolderKanban,
  PhoneOutgoing,
} from 'lucide-react';

export interface AssignmentHistoryItem {
  active: boolean;
  assignedAt: string;
  assignmentId: number;
  clientId: number;
  clientName: string;
  departmentName: string;
  employeeCode: string;
  employeeId: number;
  employeeName: string;
  endedAt: string | null;
  reason: string;
}

export interface AdminClientFullResponse {
  clientId: number;
  name: string;
  email: string | null;
  phone: string;
  status: string;
  currentStage: string;
  assignedEmployeeId: number | null;
  assignedEmployeeName: string | null;
  assignedAt: string | null;
  nextFollowUpAt: string | null;
  assignmentHistory?: AssignmentHistoryItem[];
}

const PAGE_SIZE = 10;
type TabType = 'ALL' | 'FOLLOW_UPS' | 'NOT_LIFTED' | 'UNASSIGNED';
type StageFilter = 'DOC' | 'PREP' | 'ALL';

const AdminClients: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();
  const { list: users } = useSelector((state: RootState) => state.users);
  const { list: teams } = useSelector((state: RootState) => state.teams);

  const {
    unassignedClients: reduxUnassigned,
    unassignedTotal: reduxUnassignedTotal,
  } = useSelector((state: RootState) => state.adminCRM);

  const getTabFromUrl = (): TabType => {
    const tabParam = searchParams.get('tab')?.toLowerCase();
    if (tabParam === 'followup' || tabParam === 'follow_ups' || tabParam === 'followups') return 'FOLLOW_UPS';
    if (tabParam === 'notlifted' || tabParam === 'not_lifted') return 'NOT_LIFTED';
    if (tabParam === 'unassigned') return 'UNASSIGNED';
    return 'ALL';
  };

  const getStageFromUrl = (): StageFilter => {
    const s = searchParams.get('stage')?.toUpperCase();
    if (s === 'PREP') return 'PREP';
    if (s === 'ALL') return 'ALL';
    return 'DOC';
  };

  const [activeTab, setActiveTab] = useState<TabType>(getTabFromUrl);
  const [stageFilter, setStageFilter] = useState<StageFilter>(getStageFromUrl);

  useEffect(() => {
    const currentTab = getTabFromUrl();
    const currentStage = getStageFromUrl();
    setActiveTab(currentTab);
    setStageFilter(currentStage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleTabChange = (newTab: TabType) => {
    setActiveTab(newTab);
    if (newTab === 'FOLLOW_UPS') {
      setSearchParams({ tab: 'followup' });
    } else if (newTab === 'NOT_LIFTED') {
      setSearchParams({ tab: 'notLifted' });
    } else if (newTab === 'UNASSIGNED') {
      setSearchParams({ tab: 'unassigned' });
    } else {
      const currentStage = searchParams.get('stage');
      if (currentStage === 'PREP' || currentStage === 'ALL') {
        setSearchParams({ stage: currentStage });
      } else {
        setSearchParams({});
      }
    }
  };

  const handleStageChange = (newStage: StageFilter) => {
    setStageFilter(newStage);
    const newParams = new URLSearchParams(searchParams);
    if (newStage === 'DOC') {
      newParams.delete('stage');
    } else {
      newParams.set('stage', newStage);
    }
    setSearchParams(newParams);
  };

  const [clientList, setClientList] = useState<AdminClientFullResponse[]>([]);
  const [assignmentsList, setAssignmentsList] = useState<AssignmentResponse[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const [expectedCount, setExpectedCount] = useState<string>('');

  const pageRef = useRef<number>(0);
  const isFetchingRef = useRef<boolean>(false);
  const hasMoreRef = useRef<boolean>(true);
  const observerTargetRef = useRef<HTMLDivElement | null>(null);

  const unassignedPageRef = useRef<number>(0);
  const unassignedHasMoreRef = useRef<boolean>(true);

  const [showBulkAssign, setShowBulkAssign] = useState<boolean>(false);
  const [bulkEmployeeId, setBulkEmployeeId] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [showReassign, setShowReassign] = useState<boolean>(false);
  const [targetClientId, setTargetClientId] = useState<number | null>(null);
  const [targetClientName, setTargetClientName] = useState<string>('');
  const [reassignNewEmployeeId, setReassignNewEmployeeId] = useState<number | ''>('');

  const [selectedHistoryClient, setSelectedHistoryClient] = useState<AdminClientFullResponse | null>(null);

  const formatEmployeeName = (name: string | null | undefined) => {
    if (!name) return '';
    const cleaned = name.replace(/\bnull\b/gi, '').replace(/\bundefined\b/gi, '').trim();
    return cleaned || name;
  };

  const docEmployees = useMemo(() => {
    return users.filter(
      (u) => u.active && u.departmentName?.toUpperCase() === 'DOCUMENTATION DEPARTMENT'
    );
  }, [users]);

  const groupedDocEmployees = useMemo(() => {
    const groups: Record<string, typeof docEmployees> = {};
    docEmployees.forEach((emp) => {
      const key = emp.teamId ? String(emp.teamId) : 'unassigned';
      if (!groups[key]) groups[key] = [];
      groups[key].push(emp);
    });
    return groups;
  }, [docEmployees]);

  const getTeamName = (teamId: string) => {
    if (teamId === 'unassigned') return 'Unassigned';
    const team = teams.find((t) => t.id === Number(teamId));
    return team ? team.name : 'Unknown Team';
  };

  const loadClientBatch = useCallback(
    async (pageNum: number, isReset: boolean = false) => {
      if (isFetchingRef.current) return;
      if (!isReset && !hasMoreRef.current) return;

      isFetchingRef.current = true;
      setIsLoading(true);

      try {
        const stageParam = stageFilter === 'ALL' ? undefined : stageFilter;

        const response: any = await dispatch(
          fetchClients({ page: pageNum, size: PAGE_SIZE, stage: stageParam })
        ).unwrap();

        const newContent: AdminClientFullResponse[] = response?.content || [];
        const totalElements: number = response?.totalElements || 0;

        setTotalCount(totalElements);

        setClientList((prev) => {
          const combined = isReset ? newContent : [...prev, ...newContent];
          const unique = Array.from(new Map(combined.map((c) => [c.clientId, c])).values());
          const moreAvailable = unique.length < totalElements;

          hasMoreRef.current = moreAvailable;
          setHasMore(moreAvailable);
          return unique;
        });

        pageRef.current = pageNum;
      } catch (err: any) {
        showToast(err || 'Failed to load clients', 'error');
      } finally {
        isFetchingRef.current = false;
        setIsLoading(false);
      }
    },
    [dispatch, showToast, stageFilter]
  );

  const loadUnassignedBatch = useCallback(
    async (pageNum: number, isReset: boolean = false) => {
      if (isFetchingRef.current) return;
      if (!isReset && !unassignedHasMoreRef.current) return;

      isFetchingRef.current = true;
      setIsLoading(true);

      try {
        await dispatch(
          fetchUnassignedClients({ page: pageNum, size: PAGE_SIZE, append: !isReset })
        ).unwrap();

        unassignedPageRef.current = pageNum;
      } catch (err: any) {
        showToast(err || 'Failed to load unassigned clients', 'error');
      } finally {
        isFetchingRef.current = false;
        setIsLoading(false);
      }
    },
    [dispatch, showToast]
  );

  useEffect(() => {
    if (activeTab !== 'UNASSIGNED') return;
    const total = reduxUnassignedTotal || 0;
    const loaded = reduxUnassigned.length;
    const more = loaded < total;
    unassignedHasMoreRef.current = more;
    setHasMore(more);
    setTotalCount(total);
  }, [reduxUnassigned, reduxUnassignedTotal, activeTab]);

  const loadTabData = useCallback(
    async (tab: TabType) => {
      setSelectedIds(new Set());
      if (tab === 'ALL') {
        pageRef.current = 0;
        hasMoreRef.current = true;
        loadClientBatch(0, true);
      } else if (tab === 'FOLLOW_UPS') {
        setIsLoading(true);
        try {
          const data: any = await dispatch(fetchFollowUps()).unwrap();
          setAssignmentsList(data || []);
          setTotalCount(data?.length || 0);
          setHasMore(false);
        } catch (err: any) {
          showToast(err || 'Failed to load follow ups', 'error');
        } finally {
          setIsLoading(false);
        }
      } else if (tab === 'NOT_LIFTED') {
        setIsLoading(true);
        try {
          const data: any = await dispatch(fetchNotLifted()).unwrap();
          setAssignmentsList(data || []);
          setTotalCount(data?.length || 0);
          setHasMore(false);
        } catch (err: any) {
          showToast(err || 'Failed to load not-lifted clients', 'error');
        } finally {
          setIsLoading(false);
        }
      } else if (tab === 'UNASSIGNED') {
        dispatch(clearUnassignedClients());
        unassignedPageRef.current = 0;
        unassignedHasMoreRef.current = true;
        await loadUnassignedBatch(0, true);
      }
    },
    [dispatch, loadClientBatch, loadUnassignedBatch, showToast]
  );

  useEffect(() => {
    loadTabData(activeTab);
    dispatch(fetchUsers());
    dispatch(fetchTeams());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, stageFilter, dispatch]);

  useEffect(() => {
    if (activeTab !== 'ALL' && activeTab !== 'UNASSIGNED') return;

    const target = observerTargetRef.current;
    if (!target) return;

    const currentLoaded =
      activeTab === 'ALL' ? clientList.length : reduxUnassigned.length;
    if (currentLoaded === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry.isIntersecting) return;
        if (isFetchingRef.current) return;

        if (activeTab === 'ALL' && hasMoreRef.current) {
          loadClientBatch(pageRef.current + 1, false);
        } else if (activeTab === 'UNASSIGNED' && unassignedHasMoreRef.current) {
          loadUnassignedBatch(unassignedPageRef.current + 1, false);
        }
      },
      { threshold: 0.5, rootMargin: '0px' }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [
    activeTab,
    loadClientBatch,
    loadUnassignedBatch,
    clientList.length,
    reduxUnassigned.length,
    isLoading,
  ]);

  const toggleSelect = (clientId: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(clientId)) newSet.delete(clientId);
    else newSet.add(clientId);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (activeTab === 'ALL' || activeTab === 'UNASSIGNED') {
      const source = activeTab === 'ALL' ? clientList : reduxUnassigned;
      if (selectedIds.size === source.length) {
        setSelectedIds(new Set());
      } else {
        setSelectedIds(new Set(source.map((c) => c.clientId)));
      }
    } else {
      if (selectedIds.size === assignmentsList.length) {
        setSelectedIds(new Set());
      } else {
        setSelectedIds(new Set(assignmentsList.map((a) => a.clientId)));
      }
    }
  };

  const handleBulkAssign = async () => {
    if (!bulkEmployeeId) {
      showToast('Please select an employee', 'warning');
      return;
    }
    if (selectedIds.size === 0) {
      showToast('Please select at least one client', 'warning');
      return;
    }
    setIsSubmitting(true);
    try {
      await dispatch(
        bulkAssignClients({
          clientIds: Array.from(selectedIds),
          employeeId: Number(bulkEmployeeId),
          reason: 'Bulk assignment by admin',
        })
      ).unwrap();
      showToast('Clients assigned successfully!', 'success');
      setSelectedIds(new Set());
      setShowBulkAssign(false);
      setExpectedCount('');
      loadTabData(activeTab);
    } catch (err: any) {
      showToast(err || 'Failed to assign clients', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSingleReassign = async () => {
    if (!targetClientId || !reassignNewEmployeeId) {
      showToast('Please select an employee', 'warning');
      return;
    }
    setIsSubmitting(true);
    try {
      await dispatch(
        bulkAssignClients({
          clientIds: [targetClientId],
          employeeId: Number(reassignNewEmployeeId),
          reason: 'Reassign by admin',
        })
      ).unwrap();
      showToast('Client reassigned successfully!', 'success');
      setShowReassign(false);
      setTargetClientId(null);
      setReassignNewEmployeeId('');
      loadTabData(activeTab);
    } catch (err: any) {
      showToast(err || 'Failed to reassign client', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openReassignModal = (clientId: number, clientName: string) => {
    setTargetClientId(clientId);
    setTargetClientName(clientName);
    setReassignNewEmployeeId('');
    setShowReassign(true);
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString();
  };

  const getStatusBadge = (status: string | null | undefined) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
            Completed
          </span>
        );
      case 'FOLLOW_UP':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wide">
            Follow Up
          </span>
        );
      case 'NOT_INTERESTED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wide">
            Not Interested
          </span>
        );
      case 'PREPARATION_ASSIGNED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 uppercase tracking-wide">
            Prep Assigned
          </span>
        );
      case 'DRAFT_APPROVED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 uppercase tracking-wide">
            Draft Approved
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wide">
            {status || 'NEW'}
          </span>
        );
    }
  };

  const filteredClients = clientList.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(c.clientId).includes(searchQuery) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.currentStage && c.currentStage.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredUnassigned = reduxUnassigned.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(c.clientId).includes(searchQuery) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.phone && c.phone.includes(searchQuery))
  );

  // ============================================================
  // Expected count logic
  // ============================================================
  const expectedNum = Number(expectedCount);
  const hasExpectedInput =
    expectedCount.trim() !== '' && !isNaN(expectedNum) && expectedNum > 0;

  const actualLoadedCount = reduxUnassigned.length;
  const selectedCount = selectedIds.size;

  const unassignedStatus: 'idle' | 'matched' | 'less' = useMemo(() => {
    if (!hasExpectedInput) return 'idle';
    if (actualLoadedCount >= expectedNum) return 'matched';
    return 'less';
  }, [hasExpectedInput, actualLoadedCount, expectedNum]);

  // ✅ NEW: Selection vs expected comparison
  const selectionStatus: 'idle' | 'matched' | 'less' | 'more' = useMemo(() => {
    if (!hasExpectedInput || selectedCount === 0) return 'idle';
    if (selectedCount === expectedNum) return 'matched';
    if (selectedCount < expectedNum) return 'less';
    return 'more';
  }, [hasExpectedInput, selectedCount, expectedNum]);

  useEffect(() => {
    if (activeTab !== 'UNASSIGNED') {
      setExpectedCount('');
    }
  }, [activeTab]);

  const filteredAssignments = assignmentsList.filter(
    (a) =>
      a.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(a.clientId).includes(searchQuery) ||
      (a.employeeName && a.employeeName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const currentTabList =
    activeTab === 'ALL'
      ? clientList
      : activeTab === 'UNASSIGNED'
      ? reduxUnassigned
      : [];

  const stageLabel = (s: StageFilter) => {
    if (s === 'DOC') return 'Documentation (DOC)';
    if (s === 'PREP') return 'Preparation (PREP)';
    return 'All Stages';
  };

  const handleMarkFirstN = () => {
    if (!hasExpectedInput) return;
    const toSelect = reduxUnassigned
      .slice(0, expectedNum)
      .map((c) => c.clientId);
    setSelectedIds(new Set(toSelect));
    showToast(`Selected first ${toSelect.length} clients`, 'success');
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
    showToast('Selection cleared', 'info');
  };

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 mb-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-[#1b2559] tracking-tight leading-none flex items-center gap-2.5">
            <div className="p-1.5 bg-[#5f41b2]/10 rounded-lg">
              <Users className="w-5 h-5 text-[#5f41b2]" />
            </div>
            Client Management
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              {totalCount} Total
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage and assign clients across all stages
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/admin/crm/view-docs-approved-clients')}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-2xs active:scale-95 cursor-pointer"
            title="View clients with approved documents"
          >
            <FileCheck2 className="w-4 h-4" />
            View Docs Approved
          </button>

          {selectedIds.size > 0 && (
            <>
              <button
                onClick={() => setShowBulkAssign(true)}
                className="flex items-center gap-1.5 bg-[#5f41b2] text-white px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-[#4e3596] transition shadow-2xs active:scale-95 cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                Bulk Assign ({selectedIds.size})
              </button>
              <button
                onClick={handleClearSelection}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition shadow-2xs active:scale-95 cursor-pointer"
                title="Clear all selected clients"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            </>
          )}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#5f41b2] w-60 shadow-2xs text-slate-700"
            />
          </div>
          <button
            onClick={() => loadTabData(activeTab)}
            title="Refresh List"
            className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition cursor-pointer shadow-2xs active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#5f41b2]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs + Stage Dropdown */}
      <div className="flex items-center gap-2 mb-3.5 shrink-0 flex-wrap">
        <button
          onClick={() => handleTabChange('ALL')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'ALL'
              ? 'bg-[#5f41b2] text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Filter className="w-3.5 h-3.5" /> All Clients
        </button>
        <button
          onClick={() => handleTabChange('FOLLOW_UPS')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'FOLLOW_UPS'
              ? 'bg-[#5f41b2] text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" /> Follow-ups Queue
        </button>
        <button
          onClick={() => handleTabChange('NOT_LIFTED')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'NOT_LIFTED'
              ? 'bg-[#5f41b2] text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <PhoneOff className="w-3.5 h-3.5" /> Not Lifted
        </button>

        {/* Unassigned Tab + Expected Count Input */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleTabChange('UNASSIGNED')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'UNASSIGNED'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <UserX className="w-3.5 h-3.5" /> Unassigned
            {activeTab === 'UNASSIGNED' && actualLoadedCount > 0 && (
              <span className="ml-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-white text-rose-600">
                {actualLoadedCount}
              </span>
            )}
          </button>

          {activeTab === 'UNASSIGNED' && (
            <div className="relative flex items-center">
              <input
                type="number"
                min="1"
                value={expectedCount}
                onChange={(e) => setExpectedCount(e.target.value)}
                placeholder="Expected count"
                title="Enter the number of records you want to mark"
                className={`w-36 px-3 py-1.5 text-xs font-semibold rounded-xl border outline-none transition pr-8 ${
                  unassignedStatus === 'matched'
                    ? 'border-green-400 bg-green-50 text-green-700 focus:ring-2 focus:ring-green-400'
                    : unassignedStatus === 'less'
                    ? 'border-amber-400 bg-amber-50 text-amber-700 focus:ring-2 focus:ring-amber-400'
                    : 'border-slate-200 bg-slate-50 text-slate-700 focus:ring-2 focus:ring-rose-400'
                }`}
              />

              {hasExpectedInput && (
                <span
                  className={`absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                    unassignedStatus === 'matched'
                      ? 'bg-green-500 text-white'
                      : 'bg-amber-500 text-white'
                  }`}
                  title={
                    unassignedStatus === 'matched'
                      ? `Matched! ${actualLoadedCount} loaded (expected ${expectedNum})`
                      : `Loaded ${actualLoadedCount} of ${expectedNum}`
                  }
                >
                  {unassignedStatus === 'matched' ? '✓' : '!'}
                </span>
              )}
            </div>
          )}

          {/* ✅ NEW: Live Selected Count Badge */}
          {activeTab === 'UNASSIGNED' && selectedCount > 0 && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border shadow-2xs transition-all ${
                selectionStatus === 'matched'
                  ? 'bg-green-50 text-green-700 border-green-300'
                  : selectionStatus === 'more'
                  ? 'bg-rose-50 text-rose-700 border-rose-300'
                  : 'bg-blue-50 text-blue-700 border-blue-300'
              }`}
              title={
                hasExpectedInput
                  ? selectionStatus === 'matched'
                    ? 'Selected count matches expected!'
                    : selectionStatus === 'more'
                    ? `Selected ${selectedCount}, more than expected ${expectedNum}`
                    : `Selected ${selectedCount} of ${expectedNum}`
                  : 'Total manually selected'
              }
            >
              <Check className="w-3.5 h-3.5" />
              Selected: {selectedCount}
              {hasExpectedInput && (
                <span className="text-[10px] font-semibold opacity-80">
                  / {expectedNum}
                </span>
              )}
            </div>
          )}

          {/* ✅ Mark First N */}
          {activeTab === 'UNASSIGNED' && unassignedStatus === 'matched' && (
            <button
              onClick={handleMarkFirstN}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition shadow-2xs active:scale-95 cursor-pointer"
              title={`Select only first ${expectedNum} clients (you can still toggle individual checkboxes)`}
            >
              <Check className="w-3.5 h-3.5" />
              Mark First {expectedNum}
            </button>
          )}
        </div>

        {activeTab === 'ALL' && (
          <div className="relative ml-auto">
            <FolderKanban className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#5f41b2] pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={stageFilter}
              onChange={(e) => handleStageChange(e.target.value as StageFilter)}
              className="appearance-none pl-9 pr-9 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#5f41b2] cursor-pointer shadow-2xs min-w-[190px]"
              title="Filter clients by stage"
            >
              <option value="DOC">Documentation (DOC)</option>
              <option value="PREP">Preparation (PREP)</option>
              <option value="ALL">All Stages</option>
            </select>
          </div>
        )}
      </div>

      {activeTab === 'ALL' && (
        <div className="mb-3 px-3.5 py-2 bg-purple-50/70 border border-purple-200 rounded-xl text-xs font-bold text-[#5f41b2] flex items-center gap-2 shrink-0">
          <Filter className="w-3.5 h-3.5" />
          Showing: <span className="font-extrabold">{stageLabel(stageFilter)}</span>
          <span className="text-slate-400 font-medium">
            ({clientList.length} loaded / {totalCount} total)
          </span>
        </div>
      )}

      {/* Table Section */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200/80 flex flex-col min-h-0 overflow-hidden">
        {/* ✅ Indicator: green when loaded >= expected */}
        {activeTab === 'UNASSIGNED' && hasExpectedInput && (
          <div
            className={`mx-3 mt-3 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border ${
              unassignedStatus === 'matched'
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {unassignedStatus === 'matched' ? (
              <>
                <Check className="w-4 h-4" />
                Matched! Loaded {actualLoadedCount} records (expected {expectedNum}). You can click "Mark First {expectedNum}" or select any checkboxes manually.
              </>
            ) : (
              <>
                <AlertTriangleIcon className="w-4 h-4" />
                Loaded {actualLoadedCount} so far, expected {expectedNum}. Scroll down to load more.
              </>
            )}
          </div>
        )}

        {/* ✅ NEW: Selection Status Indicator */}
        {activeTab === 'UNASSIGNED' && selectedCount > 0 && (
          <div
            className={`mx-3 mt-3 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border ${
              selectionStatus === 'matched'
                ? 'bg-green-50 text-green-700 border-green-200'
                : selectionStatus === 'more'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}
          >
            <Check className="w-4 h-4" />
            {hasExpectedInput ? (
              selectionStatus === 'matched' ? (
                <>Selected exactly {selectedCount} clients — matches expected ({expectedNum})! Ready to Bulk Assign.</>
              ) : selectionStatus === 'more' ? (
                <>Selected {selectedCount} clients — {selectedCount - expectedNum} more than expected ({expectedNum}). You can deselect some.</>
              ) : (
                <>Selected {selectedCount} of {expectedNum}. Select {expectedNum - selectedCount} more.</>
              )
            ) : (
              <>Selected {selectedCount} clients. Click Bulk Assign to proceed.</>
            )}
          </div>
        )}

        <div className="flex-1 overflow-x-auto overflow-y-auto p-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {isLoading &&
          clientList.length === 0 &&
          assignmentsList.length === 0 &&
          reduxUnassigned.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 py-16">
              <Loader2 className="w-8 h-8 animate-spin text-[#5f41b2]" />
              <p className="text-sm font-semibold">Loading data...</p>
            </div>
          ) : (activeTab === 'ALL'
              ? filteredClients.length === 0
              : activeTab === 'UNASSIGNED'
              ? filteredUnassigned.length === 0
              : filteredAssignments.length === 0) ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 py-16">
              {activeTab === 'UNASSIGNED' ? (
                <>
                  <UserX className="w-12 h-12 opacity-20" />
                  <p className="text-sm font-semibold">No unassigned clients found</p>
                  <p className="text-xs text-slate-400">All clients have been assigned to employees.</p>
                </>
              ) : activeTab === 'ALL' ? (
                <>
                  <Filter className="w-12 h-12 opacity-20" />
                  <p className="text-sm font-semibold">
                    No clients found in <span className="font-extrabold">{stageLabel(stageFilter)}</span>
                  </p>
                  <p className="text-xs text-slate-400">
                    Try switching the stage filter to "All Stages" or select a different stage.
                  </p>
                </>
              ) : (
                <>
                  <Users className="w-12 h-12 opacity-20" />
                  <p className="text-sm font-semibold">No records found</p>
                </>
              )}
            </div>
          ) : activeTab === 'ALL' || activeTab === 'UNASSIGNED' ? (
            <table className="w-full text-left text-sm border-collapse min-w-[1600px]">
              <thead className="bg-slate-50/90 sticky top-0 z-10 border-b border-slate-100 backdrop-blur-xs">
                <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  <th className="py-3 px-3 w-10 rounded-l-xl">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.size === currentTabList.length && currentTabList.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="w-4 h-4 accent-[#5f41b2] cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4 min-w-[200px]">Client</th>
                  <th className="py-3 px-4 min-w-[220px]">Contact</th>
                  <th className="py-3 px-3 min-w-[130px]">Status</th>
                  <th className="py-3 px-3 min-w-[100px]">Stage</th>
                  <th className="py-3 px-4 min-w-[180px]">Assigned Employee</th>
                  <th className="py-3 px-4 min-w-[160px]">Assigned At</th>
                  <th className="py-3 px-4 min-w-[160px]">Follow-up</th>
                  <th className="py-3 px-4 text-center rounded-r-xl min-w-[460px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(activeTab === 'ALL' ? filteredClients : filteredUnassigned).map((client) => {
                  const cleanedEmployeeName = formatEmployeeName(client.assignedEmployeeName);
                  const hasHistory = Boolean(
                    client.assignmentHistory && client.assignmentHistory.length > 0
                  );

                  return (
                    <tr key={client.clientId} className="hover:bg-slate-50/70 transition group">
                      <td className="py-3.5 px-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(client.clientId)}
                          onChange={() => toggleSelect(client.clientId)}
                          className="w-4 h-4 accent-[#5f41b2] cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-bold text-[#1b2559] text-sm group-hover:text-[#5f41b2] transition-colors whitespace-nowrap">
                          {client.name}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium">
                          ID: #{client.clientId}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-xs space-y-1">
                          <p className="text-slate-600 font-medium flex items-center gap-1.5 whitespace-nowrap">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {client.email || '—'}
                          </p>
                          <p className="text-slate-600 font-medium flex items-center gap-1.5 whitespace-nowrap">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {client.phone}
                          </p>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {getStatusBadge(client.status)}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {client.currentStage || '—'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {cleanedEmployeeName ? (
                          <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-[#5f41b2] shrink-0" />
                            {cleanedEmployeeName}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic font-medium">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs font-medium whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {formatDate(client.assignedAt)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs font-medium whitespace-nowrap">
                        {client.nextFollowUpAt ? (
                          <span className="flex items-center gap-1.5 text-amber-700">
                            <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            {formatDate(client.nextFollowUpAt)}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                          <button
                            onClick={() => openReassignModal(client.clientId, client.name)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-[#5f41b2] hover:text-white text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs h-8 whitespace-nowrap active:scale-95"
                          >
                            {client.assignedEmployeeName ? 'Reassign' : 'Assign'}
                          </button>

                          {hasHistory && (
                            <button
                              onClick={() => setSelectedHistoryClient(client)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50/80 hover:bg-amber-600 text-amber-800 hover:text-white border border-amber-200 hover:border-amber-600 rounded-lg text-xs font-bold transition shadow-2xs active:scale-95 cursor-pointer h-8 whitespace-nowrap"
                              title="View assignment history logs"
                            >
                              <History className="w-3.5 h-3.5 shrink-0" />
                              <span>History</span>
                            </button>
                          )}

                          <button
                            onClick={() =>
                              navigate(`/admin/crm/client-documents/${client.clientId}`)
                            }
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50/80 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 hover:border-indigo-600 rounded-lg text-xs font-bold transition shadow-2xs active:scale-95 cursor-pointer h-8 whitespace-nowrap"
                            title="View client documents"
                          >
                            <FileText className="w-3.5 h-3.5 shrink-0" />
                            <span>Docs</span>
                          </button>

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

                          <button
                            onClick={() =>
                              navigate(
                                `/admin/crm/view-call-log/${client.clientId}?name=${encodeURIComponent(client.name)}`
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-cyan-50/80 hover:bg-cyan-600 text-cyan-700 hover:text-white border border-cyan-200 hover:border-cyan-600 rounded-lg text-xs font-bold transition shadow-2xs active:scale-95 cursor-pointer h-8 whitespace-nowrap"
                            title="View call history logs"
                          >
                            <PhoneOutgoing className="w-3.5 h-3.5 shrink-0" />
                            <span>Calls</span>
                          </button>

                          {client.currentStage?.toUpperCase() === 'PREP' && (
                            <button
                              onClick={() =>
                                navigate(
                                  `/admin/crm/view-drafts/${client.clientId}?name=${encodeURIComponent(client.name)}`
                                )
                              }
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50/80 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-blue-600 rounded-lg text-xs font-bold transition shadow-2xs active:scale-95 cursor-pointer h-8 whitespace-nowrap"
                              title="View tax drafts for this client"
                            >
                              <Layers className="w-3.5 h-3.5 shrink-0" />
                              <span>Drafts</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-sm border-collapse min-w-[1250px]">
              <thead className="bg-slate-50/90 sticky top-0 z-10 border-b border-slate-100 backdrop-blur-xs">
                <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  <th className="py-3 px-3 w-10 rounded-l-xl">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.size === assignmentsList.length &&
                        assignmentsList.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="w-4 h-4 accent-[#5f41b2] cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4 min-w-[200px]">Client</th>
                  <th className="py-3 px-4 min-w-[200px]">Assigned Employee</th>
                  <th className="py-3 px-4 min-w-[160px]">Assigned Date</th>
                  <th className="py-3 px-4 min-w-[240px]">Reason</th>
                  <th className="py-3 px-4 text-center rounded-r-xl min-w-[360px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssignments.map((assignment) => {
                  const cleanedAssignmentEmpName = formatEmployeeName(assignment.employeeName);

                  return (
                    <tr
                      key={assignment.assignmentId}
                      className="hover:bg-slate-50/70 transition group"
                    >
                      <td className="py-3.5 px-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(assignment.clientId)}
                          onChange={() => toggleSelect(assignment.clientId)}
                          className="w-4 h-4 accent-[#5f41b2] cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-bold text-[#1b2559] text-sm group-hover:text-[#5f41b2] transition-colors whitespace-nowrap">
                          {assignment.clientName}
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium">
                          ID: #{assignment.clientId}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-[#5f41b2] shrink-0" />
                          {cleanedAssignmentEmpName} ({assignment.employeeCode})
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 font-medium whitespace-nowrap">
                        {formatDate(assignment.assignedAt)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 italic">
                        {assignment.reason || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                          <button
                            onClick={() =>
                              openReassignModal(assignment.clientId, assignment.clientName)
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-[#5f41b2] hover:text-white text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs h-8 whitespace-nowrap active:scale-95"
                          >
                            Reassign
                          </button>

                          <button
                            onClick={() =>
                              navigate(`/admin/crm/client-documents/${assignment.clientId}`)
                            }
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50/80 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200 hover:border-indigo-600 rounded-lg text-xs font-bold transition shadow-2xs active:scale-95 cursor-pointer h-8 whitespace-nowrap"
                            title="View client documents"
                          >
                            <FileText className="w-3.5 h-3.5 shrink-0" />
                            <span>Docs</span>
                          </button>

                          <button
                            onClick={() =>
                              navigate(`/admin/crm/view-client-comments/${assignment.clientId}`)
                            }
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-50/80 hover:bg-purple-600 text-purple-700 hover:text-white border border-purple-200 hover:border-purple-600 rounded-lg text-xs font-bold transition shadow-2xs active:scale-95 cursor-pointer h-8 whitespace-nowrap"
                            title="View client comments"
                          >
                            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                            <span>Comments</span>
                          </button>

                          <button
                            onClick={() =>
                              navigate(
                                `/admin/crm/view-call-log/${assignment.clientId}?name=${encodeURIComponent(assignment.clientName)}`
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-cyan-50/80 hover:bg-cyan-600 text-cyan-700 hover:text-white border border-cyan-200 hover:border-cyan-600 rounded-lg text-xs font-bold transition shadow-2xs active:scale-95 cursor-pointer h-8 whitespace-nowrap"
                            title="View call history logs"
                          >
                            <PhoneOutgoing className="w-3.5 h-3.5 shrink-0" />
                            <span>Calls</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {(activeTab === 'ALL' || activeTab === 'UNASSIGNED') && (
            <div ref={observerTargetRef} className="h-10 w-full" />
          )}

          {activeTab === 'ALL' && isLoading && clientList.length > 0 && (
            <div className="py-4 flex items-center justify-center gap-2 text-xs font-semibold text-[#5f41b2] bg-purple-50/50 rounded-xl my-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#5f41b2]" />
              <span>Loading next {PAGE_SIZE} clients...</span>
            </div>
          )}

          {activeTab === 'UNASSIGNED' && isLoading && reduxUnassigned.length > 0 && (
            <div className="py-4 flex items-center justify-center gap-2 text-xs font-semibold text-rose-600 bg-rose-50/50 rounded-xl my-2">
              <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
              <span>Loading next {PAGE_SIZE} unassigned clients... (loaded {reduxUnassigned.length})</span>
            </div>
          )}

          {activeTab === 'ALL' && !hasMore && clientList.length > 0 && (
            <div className="py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider border-t border-slate-100 mt-2">
              Loaded all {clientList.length} of {totalCount} clients ({stageLabel(stageFilter)})
            </div>
          )}

          {activeTab === 'UNASSIGNED' && !hasMore && reduxUnassigned.length > 0 && (
            <div className="py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider border-t border-slate-100 mt-2">
              All {reduxUnassigned.length} unassigned clients loaded
            </div>
          )}
        </div>
      </div>

      {/* ============================================================
          ASSIGNMENT HISTORY MODAL
          ============================================================ */}
      {selectedHistoryClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 border border-slate-200 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1b2559]">Assignment History</h3>
                  <p className="text-xs text-slate-400">
                    Client:{' '}
                    <span className="font-semibold text-slate-700">
                      {selectedHistoryClient.name}
                    </span>{' '}
                    (ID: #{selectedHistoryClient.clientId})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedHistoryClient(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-3 [scrollbar-width:thin]">
              {selectedHistoryClient.assignmentHistory?.map((hist) => (
                <div
                  key={hist.assignmentId}
                  className={`p-3.5 rounded-xl border ${
                    hist.active
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-bold text-sm text-[#1b2559] flex items-center gap-2">
                      <UserCheck
                        className={`w-4 h-4 ${hist.active ? 'text-emerald-600' : 'text-slate-400'}`}
                      />
                      {formatEmployeeName(hist.employeeName)}
                      <span className="text-xs text-slate-400 font-normal">
                        ({hist.employeeCode})
                      </span>
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border ${
                        hist.active
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-slate-200 text-slate-600 border-slate-300'
                      }`}
                    >
                      {hist.active ? 'Active' : 'Ended'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                    <p className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{hist.departmentName || '—'}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Assigned: {formatDate(hist.assignedAt)}</span>
                    </p>
                    {hist.endedAt && (
                      <p className="flex items-center gap-1.5 sm:col-span-2 text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>Ended: {formatDate(hist.endedAt)}</span>
                      </p>
                    )}
                    {hist.reason && (
                      <p className="sm:col-span-2 text-slate-500 italic">
                        Reason: "{hist.reason}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 mt-2">
              <button
                onClick={() => setSelectedHistoryClient(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          BULK ASSIGN MODAL
          ============================================================ */}
      {showBulkAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#1b2559]">Bulk Assign Clients</h3>
              <button
                onClick={() => setShowBulkAssign(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Assign <strong>{selectedIds.size}</strong> selected client(s) to a DOC employee.
            </p>
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                DOC Employee
              </label>
              {docEmployees.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                  No active DOC employees found.
                </div>
              ) : (
                <select
                  value={bulkEmployeeId}
                  onChange={(e) =>
                    setBulkEmployeeId(e.target.value ? Number(e.target.value) : '')
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#5f41b2] focus:outline-none text-sm bg-white font-medium text-slate-700"
                >
                  <option value="">Select Employee</option>
                  {Object.entries(groupedDocEmployees).map(([teamKey, emps]) => {
                    const teamName = getTeamName(teamKey);
                    return (
                      <optgroup key={teamKey} label={teamName}>
                        {emps.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.firstName} {emp.lastName || ''} ({emp.employeeCode})
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowBulkAssign(false)}
                className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkAssign}
                disabled={isSubmitting || !bulkEmployeeId || docEmployees.length === 0}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-[#5f41b2] rounded-xl hover:bg-[#4e3596] transition disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {isSubmitting ? 'Assigning...' : 'Assign All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          SINGLE REASSIGN MODAL
          ============================================================ */}
      {showReassign && targetClientId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#1b2559]">Assign / Reassign Client</h3>
              <button
                onClick={() => {
                  setShowReassign(false);
                  setTargetClientId(null);
                }}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Select a DOC employee for <strong>{targetClientName}</strong> (ID: #{targetClientId}).
            </p>
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                DOC Employee
              </label>
              {docEmployees.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                  No active DOC employees found.
                </div>
              ) : (
                <select
                  value={reassignNewEmployeeId}
                  onChange={(e) =>
                    setReassignNewEmployeeId(e.target.value ? Number(e.target.value) : '')
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#5f41b2] focus:outline-none text-sm bg-white font-medium text-slate-700"
                >
                  <option value="">Select Employee</option>
                  {Object.entries(groupedDocEmployees).map(([teamKey, emps]) => {
                    const teamName = getTeamName(teamKey);
                    return (
                      <optgroup key={teamKey} label={teamName}>
                        {emps.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.firstName} {emp.lastName || ''} ({emp.employeeCode})
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowReassign(false);
                  setTargetClientId(null);
                }}
                className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSingleReassign}
                disabled={isSubmitting || !reassignNewEmployeeId || docEmployees.length === 0}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-[#5f41b2] rounded-xl hover:bg-[#4e3596] transition disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {isSubmitting ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminClients;