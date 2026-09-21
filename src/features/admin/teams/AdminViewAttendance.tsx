// src/features/admin/teams/AdminViewAttendance.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { AppDispatch, RootState } from '../../../store';
import {
  fetchAttendancePolicies,
  createAttendancePolicy,
  activateAttendancePolicy,
  deactivateAttendancePolicy,
  fetchAttendancePoliciesByStatus,
  fetchDailySummary,
  clearDailySummary,
  AttendancePolicyResponse,
  DailySummaryResponse,
  AttendanceStatusEnum,
} from '../../../store/slices/attendanceSlice';
import { useToast } from '../../../contexts/ToastContext';
import {
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  Plus,
  Eye,
  Power,
  PowerOff,
  X,
  AlertTriangle,
  Save,
  RefreshCw,
  UserX,
  Mail,
  Phone,
  Building2,
  Users,
  Search,
  Download,
  CalendarDays,
  ClipboardList,
  Filter,
  ChevronDown,
  UserCheck,
  CalendarCheck2,
  CalendarClock,
  CircleSlash,
} from 'lucide-react';

// Helper to format time (HH:mm -> 12-hour format)
const formatTime = (time: string) => {
  if (!time) return '—';
  try {
    const [hour, minute] = time.split(':');
    const d = new Date();
    d.setHours(parseInt(hour, 10), parseInt(minute, 10));
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return time;
  }
};

// Helper: get today's date in YYYY-MM-DD
const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper: format ISO datetime -> HH:MM AM/PM
const formatDateTime = (iso: string | null | undefined) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
};

// Helper: minutes -> "Xh Ym"
const formatMinutes = (total: number | null | undefined) => {
  if (!total || total <= 0) return '0h 0m';
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h}h ${m}m`;
};

type TopTab = 'POLICIES' | 'ATTENDANCE';
type PolicyFilterTab = 'ALL' | 'ACTIVE' | 'INACTIVE';

// ✅ All status options (enums)
const STATUS_OPTIONS: { value: AttendanceStatusEnum; label: string; color: string }[] = [
  { value: 'PRESENT', label: 'Present', color: 'emerald' },
  { value: 'ABSENT', label: 'Absent', color: 'rose' },
  { value: 'HALF_DAY', label: 'Half Day', color: 'amber' },
  { value: 'ON_LEAVE', label: 'On Leave', color: 'purple' },
  { value: 'NOT_CHECKED_OUT', label: 'Not Checked Out', color: 'orange' },
];

// ✅ Helper: parse URL tab value → TopTab  (now uses 'attendance')
const parseTabFromUrl = (value: string | null): TopTab => {
  if (!value) return 'POLICIES';
  const normalized = value.toLowerCase().trim();
  if (
    normalized === 'attendance' ||
    normalized === 'attendances' ||
    normalized === 'daily-summary' ||
    normalized === 'absents' // legacy fallback so old links still work
  ) {
    return 'ATTENDANCE';
  }
  if (normalized === 'policy' || normalized === 'policies') {
    return 'POLICIES';
  }
  return 'POLICIES';
};

// ✅ Helper: TopTab → URL value
const tabToUrlValue = (tab: TopTab): string => {
  return tab === 'ATTENDANCE' ? 'attendance' : 'policies';
};

const AdminViewAttendance: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    list: policies,
    loading,
    error,
    dailySummary,
  } = useSelector((state: RootState) => state.attendance);

  // ---------- Top-level Tabs (init from URL) ----------
  const [topTab, setTopTab] = useState<TopTab>(() =>
    parseTabFromUrl(searchParams.get('tab'))
  );

  // Sync state if URL changes externally
  useEffect(() => {
    const urlTab = parseTabFromUrl(searchParams.get('tab'));
    setTopTab((prev) => (prev !== urlTab ? urlTab : prev));
  }, [searchParams]);

  // Handler: change tab + update URL
  const handleTabChange = (newTab: TopTab) => {
    setTopTab(newTab);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', tabToUrlValue(newTab));
    setSearchParams(newParams, { replace: true });
  };

  // ============================================================
  // POLICIES TAB STATE
  // ============================================================
  const [policyFilter, setPolicyFilter] = useState<PolicyFilterTab>('ALL');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [formName, setFormName] = useState('');
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndTime, setFormEndTime] = useState('18:00');
  const [formAllowedBreakMinutes, setFormAllowedBreakMinutes] = useState<number>(60);
  const [formWorkingDays, setFormWorkingDays] = useState('Mon - Fri');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [viewingPolicy, setViewingPolicy] = useState<AttendancePolicyResponse | null>(null);

  const [confirmAction, setConfirmAction] = useState<'activate' | 'deactivate' | null>(null);
  const [confirmPolicyId, setConfirmPolicyId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // ============================================================
  // ATTENDANCE TAB STATE
  // ============================================================
  const [attendanceDate, setAttendanceDate] = useState<string>(getTodayDateString());
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatusEnum>('PRESENT'); // ✅ default PRESENT
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [attendanceDeptFilter, setAttendanceDeptFilter] = useState<string>('ALL');
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);

  // ---------- Load Policies ----------
  const loadPolicies = (filter: PolicyFilterTab) => {
    if (filter === 'ALL') {
      dispatch(fetchAttendancePolicies());
    } else {
      const active = filter === 'ACTIVE';
      dispatch(fetchAttendancePoliciesByStatus(active));
    }
  };

  useEffect(() => {
    if (topTab === 'POLICIES') {
      loadPolicies(policyFilter);
    }
  }, [dispatch, policyFilter, topTab]);

  // ---------- Load Daily Summary ----------
  const loadDailySummary = async (
    date: string,
    status: AttendanceStatusEnum,
    forceRefresh = false
  ) => {
    // Avoid duplicate fetch if same filters and data already loaded
    if (!forceRefresh && dailySummary.length > 0) {
      // still fine to refetch, but for safety leave fetch
    }
    setIsAttendanceLoading(true);
    try {
      await dispatch(fetchDailySummary({ date, status })).unwrap();
    } catch (err: any) {
      showToast(err || 'Failed to load daily summary', 'error');
    } finally {
      setIsAttendanceLoading(false);
    }
  };

  // ✅ Auto-load when ATTENDANCE tab opens (default PRESENT + today)
  useEffect(() => {
    if (topTab === 'ATTENDANCE') {
      // Reset previous data so UI doesn't show stale
      dispatch(clearDailySummary());
      loadDailySummary(attendanceDate, attendanceStatus);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topTab]);

  // ---------- Policies: Create Handlers ----------
  const resetForm = () => {
    setFormName('');
    setFormStartTime('09:00');
    setFormEndTime('18:00');
    setFormAllowedBreakMinutes(60);
    setFormWorkingDays('Mon - Fri');
    setIsSubmitting(false);
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    resetForm();
  };

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      showToast('Policy name is required', 'error');
      return;
    }
    if (!formStartTime || !formEndTime) {
      showToast('Start time and end time are required', 'error');
      return;
    }
    if (formStartTime >= formEndTime) {
      showToast('Start time must be before end time', 'error');
      return;
    }
    if (formAllowedBreakMinutes < 0) {
      showToast('Allowed break minutes cannot be negative', 'error');
      return;
    }
    if (!formWorkingDays.trim()) {
      showToast('Working days are required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formName.trim(),
        startTime: formStartTime,
        endTime: formEndTime,
        allowedBreakMinutes: formAllowedBreakMinutes,
        workingDays: formWorkingDays.trim(),
      };
      await dispatch(createAttendancePolicy(payload)).unwrap();
      showToast(`Policy "${formName}" created successfully!`, 'success');
      closeCreateModal();
      loadPolicies(policyFilter);
    } catch (err: any) {
      showToast(err || 'Failed to create policy', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openViewModal = (policy: AttendancePolicyResponse) => {
    setViewingPolicy(policy);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewingPolicy(null);
  };

  const openConfirm = (policyId: number, action: 'activate' | 'deactivate') => {
    setConfirmPolicyId(policyId);
    setConfirmAction(action);
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    if (!confirmPolicyId || !confirmAction) return;
    setTogglingId(confirmPolicyId);
    try {
      if (confirmAction === 'activate') {
        await dispatch(activateAttendancePolicy(confirmPolicyId)).unwrap();
        showToast('Policy activated successfully', 'success');
      } else {
        await dispatch(deactivateAttendancePolicy(confirmPolicyId)).unwrap();
        showToast('Policy deactivated successfully', 'info');
      }
      setShowConfirmModal(false);
      setConfirmPolicyId(null);
      setConfirmAction(null);
      loadPolicies(policyFilter);
    } catch (err: any) {
      showToast(err || `Failed to ${confirmAction} policy`, 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const getPolicyStatusBadge = (active: boolean) => {
    return active ? (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3" /> Active
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
        <XCircle className="w-3 h-3" /> Inactive
      </span>
    );
  };

  // ============================================================
  // ATTENDANCE TAB — Derived Data
  // ============================================================
  const uniqueDepartments = useMemo(() => {
    const set = new Set<string>();
    dailySummary.forEach((emp) => {
      if (emp.departmentName) set.add(emp.departmentName);
    });
    return Array.from(set).sort();
  }, [dailySummary]);

  const filteredAttendance = useMemo(() => {
    const q = attendanceSearch.toLowerCase().trim();
    return dailySummary.filter((emp) => {
      const matchesSearch =
        !q ||
        `${emp.firstName} ${emp.lastName || ''}`.toLowerCase().includes(q) ||
        emp.employeeCode.toLowerCase().includes(q) ||
        (emp.email && emp.email.toLowerCase().includes(q)) ||
        (emp.phone && emp.phone.includes(q)) ||
        (emp.departmentName && emp.departmentName.toLowerCase().includes(q)) ||
        (emp.teamName && emp.teamName.toLowerCase().includes(q));

      const matchesDept =
        attendanceDeptFilter === 'ALL' || emp.departmentName === attendanceDeptFilter;

      return matchesSearch && matchesDept;
    });
  }, [dailySummary, attendanceSearch, attendanceDeptFilter]);

  const handleExportCSV = () => {
    if (filteredAttendance.length === 0) {
      showToast('No data to export', 'warning');
      return;
    }

    const headers = [
      'Employee Code',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Department',
      'Team',
      'Status',
      'Leave Type',
      'Check In',
      'Check Out',
      'Total Work Minutes',
      'Shift Start Time',
    ];

    const rows = filteredAttendance.map((emp) => [
      emp.employeeCode || '',
      emp.firstName || '',
      emp.lastName || '',
      emp.email || '',
      emp.phone || '',
      emp.departmentName || '',
      emp.teamName || '',
      emp.attendanceStatus || '',
      emp.leaveType || '',
      emp.checkIn || '',
      emp.checkOut || '',
      emp.totalWorkMinutes ?? '',
      emp.shiftStartTime || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `attendance-${attendanceStatus}-${attendanceDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('CSV exported successfully', 'success');
  };

  // ✅ Status badge for daily summary row
  const getDailyStatusBadge = (emp: DailySummaryResponse) => {
    const status = emp.attendanceStatus;

    if (status === 'ON_LEAVE') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide bg-purple-100 text-purple-700 border-purple-200">
          <CalendarDays className="w-3 h-3" />
          {emp.leaveType ? `On Leave (${emp.leaveType})` : 'On Leave'}
        </span>
      );
    }
    if (status === 'HALF_DAY') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide bg-amber-100 text-amber-700 border-amber-200">
          <CalendarClock className="w-3 h-3" />
          Half Day
        </span>
      );
    }
    if (status === 'NOT_CHECKED_OUT') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide bg-orange-100 text-orange-700 border-orange-200">
          <CircleSlash className="w-3 h-3" />
          Not Checked Out
        </span>
      );
    }
    if (status === 'PRESENT') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide bg-emerald-100 text-emerald-700 border-emerald-200">
          <UserCheck className="w-3 h-3" />
          Present
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide bg-rose-100 text-rose-700 border-rose-200">
        <UserX className="w-3 h-3" />
        Absent
      </span>
    );
  };

  // Active status label info (for header)
  const activeStatusInfo = STATUS_OPTIONS.find((s) => s.value === attendanceStatus);

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden">
      {/* ============ TOP-LEVEL TABS ============ */}
      <div className="shrink-0 mb-4 flex items-center gap-2">
        <button
          onClick={() => handleTabChange('POLICIES')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            topTab === 'POLICIES'
              ? 'bg-[#5f41b2] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Attendance Policies
        </button>

        <button
          onClick={() => handleTabChange('ATTENDANCE')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer relative ${
            topTab === 'ATTENDANCE'
              ? 'bg-[#5f41b2] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <CalendarCheck2 className="w-4 h-4" />
          Attendance
          {topTab === 'ATTENDANCE' && dailySummary.length > 0 && (
            <span className="ml-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-white text-[#5f41b2]">
              {dailySummary.length}
            </span>
          )}
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB CONTENT: POLICIES                                          */}
      {/* ============================================================ */}
      {topTab === 'POLICIES' && (
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-wrap justify-between items-center shrink-0 bg-gray-50/50 gap-2">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#5f41b2]" />
              <h2 className="text-lg font-bold text-[#1b2559]">
                Policy List ({policies.length})
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 p-0.5 shadow-xs">
                <button
                  onClick={() => setPolicyFilter('ALL')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    policyFilter === 'ALL'
                      ? 'bg-[#5f41b2] text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setPolicyFilter('ACTIVE')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    policyFilter === 'ACTIVE'
                      ? 'bg-[#5f41b2] text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setPolicyFilter('INACTIVE')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    policyFilter === 'INACTIVE'
                      ? 'bg-[#5f41b2] text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Inactive
                </button>
              </div>

              <button
                onClick={openCreateModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5f41b2] text-white text-sm font-semibold rounded-lg hover:bg-[#4e3596] transition shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Policy
              </button>
              {loading && <Loader2 className="w-5 h-5 text-[#5f41b2] animate-spin" />}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {loading && policies.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#5f41b2]" />
                <p className="text-sm font-semibold">Loading policies...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full text-rose-500 gap-2">
                <p className="text-sm font-semibold">Failed to load policies</p>
                <p className="text-xs text-gray-400">{error}</p>
              </div>
            ) : policies.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                <Clock className="w-12 h-12 opacity-20" />
                <p className="text-sm font-semibold">No attendance policies found</p>
                <button onClick={openCreateModal} className="text-[#5f41b2] text-sm underline">
                  Create your first policy
                </button>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[900px]">
                  <thead className="bg-gray-50/80 sticky top-0 z-10">
                    <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <th className="p-3 rounded-tl-lg">ID</th>
                      <th className="p-3">Policy Name</th>
                      <th className="p-3 text-center">Start Time</th>
                      <th className="p-3 text-center">End Time</th>
                      <th className="p-3 text-center">Break Allowance</th>
                      <th className="p-3 text-center">Working Days</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-center rounded-tr-lg">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {policies.map((policy) => {
                      const isToggling = togglingId === policy.attendancePolicyId;
                      return (
                        <tr
                          key={policy.attendancePolicyId}
                          className="hover:bg-blue-50/30 transition group"
                        >
                          <td className="p-3 font-bold text-[#1b2559]">
                            #{policy.attendancePolicyId}
                          </td>
                          <td className="p-3 font-semibold text-gray-800">{policy.name}</td>
                          <td className="p-3 text-center font-medium text-gray-700">
                            {formatTime(policy.startTime)}
                          </td>
                          <td className="p-3 text-center font-medium text-gray-700">
                            {formatTime(policy.endTime)}
                          </td>
                          <td className="p-3 text-center font-medium text-gray-700">
                            {policy.allowedBreakMinutes !== undefined
                              ? `${policy.allowedBreakMinutes} min`
                              : '—'}
                          </td>
                          <td className="p-3 text-center font-medium text-gray-700">
                            {policy.workingDays || '—'}
                          </td>
                          <td className="p-3 text-center">
                            {getPolicyStatusBadge(policy.active)}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => openViewModal(policy)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() =>
                                  openConfirm(
                                    policy.attendancePolicyId,
                                    policy.active ? 'deactivate' : 'activate'
                                  )
                                }
                                disabled={isToggling}
                                className={`p-1.5 rounded-lg transition ${
                                  policy.active
                                    ? 'text-amber-600 hover:bg-amber-100'
                                    : 'text-emerald-600 hover:bg-emerald-100'
                                }`}
                                title={policy.active ? 'Deactivate' : 'Activate'}
                              >
                                {isToggling ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : policy.active ? (
                                  <PowerOff className="w-4 h-4" />
                                ) : (
                                  <Power className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB CONTENT: ATTENDANCE                                        */}
      {/* ============================================================ */}
      {topTab === 'ATTENDANCE' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden gap-4">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 shrink-0">
            <div className="flex flex-wrap items-center gap-3">
              {/* ✅ Status Dropdown (enum) */}
              <div className="relative">
                <UserCheck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5f41b2] pointer-events-none" />
                <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  value={attendanceStatus}
                  onChange={(e) =>
                    setAttendanceStatus(e.target.value as AttendanceStatusEnum)
                  }
                  className="appearance-none pl-9 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#5f41b2] cursor-pointer shadow-2xs min-w-[190px]"
                  title="Select attendance status"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* ✅ Date Picker */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 shadow-2xs">
                <CalendarDays className="w-4 h-4 text-[#5f41b2] shrink-0" />
                <input
                  type="date"
                  value={attendanceDate}
                  max={getTodayDateString()}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
                />
              </div>

              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, code, email, dept..."
                  value={attendanceSearch}
                  onChange={(e) => setAttendanceSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#5f41b2] shadow-2xs"
                />
              </div>

              {/* Department Filter */}
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <Filter className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  value={attendanceDeptFilter}
                  onChange={(e) => setAttendanceDeptFilter(e.target.value)}
                  className="appearance-none pl-9 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#5f41b2] cursor-pointer shadow-2xs min-w-[180px]"
                >
                  <option value="ALL">All Departments</option>
                  {uniqueDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Apply / Refresh */}
              <button
                onClick={() =>
                  loadDailySummary(attendanceDate, attendanceStatus, true)
                }
                disabled={isAttendanceLoading}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#5f41b2] hover:bg-[#4d3396] text-white rounded-xl text-xs font-bold transition shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Apply filters"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    isAttendanceLoading ? 'animate-spin' : ''
                  }`}
                />
                Apply
              </button>

              {/* Export CSV */}
              <button
                onClick={handleExportCSV}
                disabled={filteredAttendance.length === 0}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Export to CSV"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
            </div>

            {/* Active filter hint */}
            <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] font-semibold text-slate-500 flex flex-wrap items-center gap-2">
              <span className="text-slate-400">Active filters:</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#5f41b2]/10 text-[#5f41b2] border border-[#5f41b2]/20">
                Status: {activeStatusInfo?.label || attendanceStatus}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                Date:{' '}
                {new Date(attendanceDate).toLocaleDateString(undefined, {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                Department: {attendanceDeptFilter === 'ALL' ? 'All' : attendanceDeptFilter}
              </span>
            </div>
          </div>

          {/* Main Table */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-[#5f41b2]/5 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#5f41b2]/10 text-[#5f41b2] flex items-center justify-center">
                  <CalendarCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#1b2559]">
                    Daily Attendance — {activeStatusInfo?.label || attendanceStatus} (
                    {filteredAttendance.length})
                  </h2>
                  <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                    {new Date(attendanceDate).toLocaleDateString(undefined, {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-auto p-1">
              {isAttendanceLoading && dailySummary.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-[#5f41b2]" />
                  <p className="text-sm font-semibold">Loading daily summary...</p>
                </div>
              ) : dailySummary.length === 0 ? (
                <div className="py-16 text-center flex flex-col items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 mb-2 text-emerald-500 opacity-70" />
                  <p className="text-sm font-bold text-emerald-700">
                    No employees found
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    No records match the selected status, date and filters.
                  </p>
                </div>
              ) : filteredAttendance.length === 0 ? (
                <div className="py-16 text-center flex flex-col items-center justify-center text-slate-400">
                  <Search className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm font-semibold">No matching employees found</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Try adjusting your search or filters.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-sm min-w-[1150px]">
                  <thead className="bg-slate-50/90 sticky top-0 z-10 backdrop-blur-xs">
                    <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="p-3 rounded-tl-lg">Employee</th>
                      <th className="p-3">Contact</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Team</th>
                      <th className="p-3 text-center">Shift Start</th>
                      <th className="p-3 text-center">In / Out</th>
                      <th className="p-3 text-center">Work Time</th>
                      <th className="p-3 text-center rounded-tr-lg">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAttendance.map((emp) => (
                      <tr
                        key={emp.employeeId}
                        className="hover:bg-slate-50/50 transition group"
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg bg-[#5f41b2]/10 text-[#5f41b2] font-bold text-xs flex items-center justify-center shrink-0">
                              {emp.firstName?.charAt(0) || '?'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-[#1b2559] text-sm truncate">
                                {emp.firstName} {emp.lastName || ''}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono font-semibold">
                                {emp.employeeCode}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="text-xs space-y-0.5">
                            <p className="text-slate-600 font-medium flex items-center gap-1.5 truncate max-w-[220px]">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              {emp.email || '—'}
                            </p>
                            <p className="text-slate-500 font-medium flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              {emp.phone || '—'}
                            </p>
                          </div>
                        </td>

                        <td className="p-3 text-xs font-semibold text-slate-700">
                          <span className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {emp.departmentName || '—'}
                          </span>
                        </td>

                        <td className="p-3 text-xs font-medium text-slate-600">
                          {emp.teamName ? (
                            <span className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              {emp.teamName}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">—</span>
                          )}
                        </td>

                        <td className="p-3 text-center text-xs font-medium text-slate-700">
                          {emp.shiftStartTime ? formatTime(emp.shiftStartTime) : '—'}
                        </td>

                        <td className="p-3 text-center">
                          <div className="flex flex-col gap-0.5 text-[11px] font-semibold">
                            <span className="text-emerald-600">
                              In: {formatDateTime(emp.checkIn)}
                            </span>
                            <span className="text-rose-600">
                              Out: {formatDateTime(emp.checkOut)}
                            </span>
                          </div>
                        </td>

                        <td className="p-3 text-center text-xs font-bold text-[#1b2559]">
                          {formatMinutes(emp.totalWorkMinutes)}
                        </td>

                        <td className="p-3 text-center">
                          {getDailyStatusBadge(emp)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {filteredAttendance.length > 0 && (
              <div className="p-3.5 border-t border-slate-100 shrink-0 text-xs text-slate-500 flex justify-between items-center bg-slate-50/50">
                <span>
                  Showing{' '}
                  <span className="font-bold text-[#5f41b2]">
                    {filteredAttendance.length}
                  </span>{' '}
                  of <span className="font-bold text-slate-700">{dailySummary.length}</span>{' '}
                  {activeStatusInfo?.label || attendanceStatus} employees
                </span>
                <span className="text-slate-400 font-medium">
                  Auto-synced with attendance records
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: Create Policy                                           */}
      {/* ============================================================ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="text-xl font-bold text-[#1b2559] flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#5f41b2]" />
                Create Attendance Policy
              </h3>
              <button
                onClick={closeCreateModal}
                className="p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form
              onSubmit={handleCreatePolicy}
              className="flex-1 overflow-y-auto pr-1"
            >
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Policy Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Standard Office Hours"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5f41b2] focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Start Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5f41b2] focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    End Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5f41b2] focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Allowed Break Minutes (per day){' '}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={formAllowedBreakMinutes}
                  onChange={(e) =>
                    setFormAllowedBreakMinutes(Number(e.target.value))
                  }
                  placeholder="e.g., 60"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5f41b2] focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Total break time allowed per day in minutes.
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Working Days <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formWorkingDays}
                  onChange={(e) => setFormWorkingDays(e.target.value)}
                  placeholder="e.g., Mon - Fri, Tue - Sat"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5f41b2] focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Specify the working days for this policy.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-2 shrink-0">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !formName.trim() ||
                    !formStartTime ||
                    !formEndTime ||
                    !formWorkingDays.trim()
                  }
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#5f41b2] rounded-lg hover:bg-[#4e3596] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Create Policy
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: View Policy Details                                     */}
      {/* ============================================================ */}
      {showViewModal && viewingPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#1b2559] flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#5f41b2]" />
                Policy Details
              </h3>
              <button
                onClick={closeViewModal}
                className="p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Name
                </p>
                <p className="text-lg font-bold text-[#1b2559]">
                  {viewingPolicy.name}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Start
                  </p>
                  <p className="font-semibold">
                    {formatTime(viewingPolicy.startTime)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    End
                  </p>
                  <p className="font-semibold">
                    {formatTime(viewingPolicy.endTime)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Allowed Break Minutes
                </p>
                <p className="font-semibold">
                  {viewingPolicy.allowedBreakMinutes ?? '—'} minutes
                </p>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Working Days
                </p>
                <p className="font-semibold">{viewingPolicy.workingDays || '—'}</p>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Status
                </p>
                {getPolicyStatusBadge(viewingPolicy.active)}
              </div>
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={closeViewModal}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: Confirm Activate/Deactivate                             */}
      {/* ============================================================ */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4 text-amber-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-[#1b2559]">Confirm</h3>
            </div>
            <p className="text-gray-700 mb-4">
              Are you sure you want to{' '}
              <span className="font-semibold">
                {confirmAction === 'activate' ? 'activate' : 'deactivate'}
              </span>{' '}
              this policy?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition ${
                  confirmAction === 'activate'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminViewAttendance;