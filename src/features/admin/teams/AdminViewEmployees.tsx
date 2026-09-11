// src/features/admin/teams/AdminViewEmployees.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../../../store';
import {
  fetchUsersByStatus,
  updateEmployee,
  updateUserStatus,
  User,
  UpdateEmployeeRequest,
  quickAssign,
  fetchEmployeeHistory,
  ActivityLogResponseDto,
  QuickAssignRequestDto,
  resetStatusPagination,
} from '../../../store/slices/usersSlice';
import { fetchDepartments } from '../../../store/slices/departmentsSlice';
import { fetchTeams } from '../../../store/slices/teamsSlice';
import { fetchRoles } from '../../../store/slices/rolesSlice';
import { fetchAttendancePolicies } from '../../../store/slices/attendanceSlice';
import { useToast } from '../../../contexts/ToastContext';
import {
  Loader2,
  Users,
  Edit,
  X,
  RefreshCw,
  AlertTriangle,
  Clock,
  Save,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Search,
  Check,
  UserCheck,
  UserX,
  History,
  Pencil,
  PowerOff,
  Power,
  Eye,
  Filter,
} from 'lucide-react';

// ============================================================
// EMPLOYEE HISTORY MODAL (unchanged)
// ============================================================
const EmployeeHistoryModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  employeeName: string;
  history: ActivityLogResponseDto[];
  loading: boolean;
}> = ({ isOpen, onClose, employeeName, history, loading }) => {
  if (!isOpen) return null;

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#5f41b2]/10 text-[#5f41b2] flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Activity Log</h3>
              <p className="text-xs text-slate-500 font-medium">{employeeName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 [scrollbar-width:thin]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400">
              <Loader2 className="w-7 h-7 text-[#5f41b2] animate-spin" />
              <p className="text-xs font-semibold">Loading audit history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-16 text-slate-400 flex flex-col items-center justify-center">
              <Clock className="w-10 h-10 opacity-20 mb-2" />
              <p className="text-xs font-semibold text-slate-600">No activity logs recorded yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Role and department changes will appear here</p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {history.map((log) => (
                <div key={log.id} className="relative group">
                  <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-white border-2 border-[#5f41b2]" />
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 hover:border-slate-200 transition">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-bold text-[#5f41b2] bg-[#5f41b2]/10 px-2.5 py-0.5 rounded-full border border-[#5f41b2]/20">
                        {log.actionType}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400">{formatDate(log.timestamp)}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700 mt-1">{log.description}</p>
                    <p className="text-[10px] text-slate-400 mt-1.5 font-medium">By: {log.performedBy}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/70 rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const AdminViewEmployees: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    statusFilteredUsers,
    statusTotal,
    statusPage,
    statusHasMore,
    loading,
    error,
  } = useSelector((state: RootState) => state.users);
  const { list: departments } = useSelector((state: RootState) => state.departments);
  const { list: teams } = useSelector((state: RootState) => state.teams);
  const { list: roles } = useSelector((state: RootState) => state.roles);
  const { list: attendancePolicies } = useSelector((state: RootState) => state.attendance);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'active' | 'inactive'>('active');

  // ---------- Infinite Scroll Observer ----------
  const loaderRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);

  // ---------- Edit Modal State ----------
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UpdateEmployeeRequest>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    departmentId: 0,
    teamId: null,
    roleId: null,
    active: true,
    attendancePolicyId: 0,
    workMode: 'OFFICE',
  });

  // ---------- Confirm Dialog State ----------
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'activate' | 'deactivate' | null>(null);
  const [confirmUserId, setConfirmUserId] = useState<number | null>(null);

  // ---------- Quick Assign State ----------
  const [quickAssignSelections, setQuickAssignSelections] = useState<Record<number, QuickAssignRequestDto>>({});
  const [quickAssignLoading, setQuickAssignLoading] = useState<Record<number, boolean>>({});

  // ---------- History Modal State ----------
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyEmployeeName, setHistoryEmployeeName] = useState('');
  const [historyData, setHistoryData] = useState<ActivityLogResponseDto[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ---------- Report Date State ----------
  const [reportDates, setReportDates] = useState<Record<number, { from: string; to: string }>>({});

  const getDefaultFromDate = () => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  };
  const getDefaultToDate = () => new Date().toISOString().split('T')[0];

  // ---------- Load data based on filter ----------
  const loadEmployees = (filter: 'active' | 'inactive', reset: boolean = true) => {
    if (reset) {
      dispatch(resetStatusPagination());
      dispatch(fetchUsersByStatus({ active: filter === 'active', page: 0, size: 20, append: false }));
    } else {
      const nextPage = statusPage + 1;
      dispatch(fetchUsersByStatus({ active: filter === 'active', page: nextPage, size: 20, append: true }));
    }
  };

  // Handle filter change (reset everything)
  const handleFilterChange = (val: 'active' | 'inactive') => {
    setFilterStatus(val);
    setSearchQuery('');
    dispatch(resetStatusPagination());
    dispatch(fetchUsersByStatus({ active: val === 'active', page: 0, size: 20, append: false }));
  };

  // Initial load
  useEffect(() => {
    dispatch(resetStatusPagination());
    dispatch(fetchUsersByStatus({ active: filterStatus === 'active', page: 0, size: 20, append: false }));
  }, [filterStatus, dispatch]);

  // Load other dropdown data
  useEffect(() => {
    dispatch(fetchDepartments());
    dispatch(fetchTeams());
    dispatch(fetchRoles());
    dispatch(fetchAttendancePolicies());
  }, [dispatch]);

  // Initialize report dates when users load
  useEffect(() => {
    if (statusFilteredUsers.length > 0) {
      const defaultDates = statusFilteredUsers.reduce((acc, user) => {
        if (user.id) {
          acc[user.id] = {
            from: getDefaultFromDate(),
            to: getDefaultToDate(),
          };
        }
        return acc;
      }, {} as Record<number, { from: string; to: string }>);
      setReportDates(defaultDates);
    }
  }, [statusFilteredUsers]);

  const displayList = statusFilteredUsers;
  const totalDisplayCount = statusTotal;
  const hasMore = statusHasMore;

  // Apply search filter on top
  const filteredUsers = displayList.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const fullName = `${u.firstName} ${u.lastName || ''}`.toLowerCase();
    return (
      fullName.includes(q) ||
      u.employeeCode.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.departmentName && u.departmentName.toLowerCase().includes(q))
    );
  });

  // ---------- Infinite Scroll Observer ----------
  useEffect(() => {
    if (!loaderRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !loading && !isFetchingRef.current) {
          isFetchingRef.current = true;
          const nextPage = statusPage + 1;
          dispatch(fetchUsersByStatus({ active: filterStatus === 'active', page: nextPage, size: 20, append: true }))
            .unwrap()
            .finally(() => {
              isFetchingRef.current = false;
            });
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [filterStatus, hasMore, loading, statusPage, dispatch]);

  // ---------- Handlers ----------
  const handleRefresh = () => {
    dispatch(resetStatusPagination());
    dispatch(fetchUsersByStatus({ active: filterStatus === 'active', page: 0, size: 20, append: false }));
  };

  const handleQuickAssignChange = (userId: number, field: keyof QuickAssignRequestDto, value: number | null) => {
    setQuickAssignSelections((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value,
      },
    }));
  };

  const handleQuickAssignSubmit = async (userId: number) => {
    const selections = quickAssignSelections[userId];
    if (!selections || (!selections.departmentId && !selections.teamId && !selections.roleId)) {
      showToast('Please select at least one field to update', 'warning');
      return;
    }

    setQuickAssignLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      await dispatch(quickAssign({ userId, data: selections })).unwrap();
      showToast('Assignment updated successfully!', 'success');
      handleRefresh();
      setQuickAssignSelections((prev) => {
        const newSelections = { ...prev };
        delete newSelections[userId];
        return newSelections;
      });
    } catch (err: any) {
      showToast(err || 'Quick assign failed', 'error');
    } finally {
      setQuickAssignLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleViewHistory = async (user: User) => {
    setHistoryEmployeeName(`${user.firstName} ${user.lastName || ''}`);
    setHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const data = await dispatch(fetchEmployeeHistory(user.id)).unwrap();
      setHistoryData(data);
    } catch (err: any) {
      showToast(err || 'Failed to load history', 'error');
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName || '',
      email: user.email,
      phone: user.phone,
      departmentId: user.departmentId || 0,
      teamId: user.teamId ?? null,
      roleId: user.roleId ?? null,
      active: user.active,
      attendancePolicyId: user.attendancePolicyId || 0,
      workMode: user.workMode || 'OFFICE',
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedUser(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleUpdateEmployee = async () => {
    if (!selectedUser) return;
    try {
      const payload = {
        ...formData,
        departmentId: Number(formData.departmentId),
        attendancePolicyId: Number(formData.attendancePolicyId),
        teamId: formData.teamId ? Number(formData.teamId) : null,
        roleId: formData.roleId ? Number(formData.roleId) : null,
      };
      await dispatch(updateEmployee({ id: selectedUser.id, ...payload })).unwrap();
      showToast('Employee updated successfully!', 'success');
      closeEditModal();
      handleRefresh();
    } catch (err: any) {
      showToast(err || 'Failed to update employee', 'error');
    }
  };

  const openConfirm = (userId: number, action: 'activate' | 'deactivate') => {
    setConfirmUserId(userId);
    setConfirmAction(action);
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    if (!confirmUserId || !confirmAction) return;
    try {
      const active = confirmAction === 'activate';
      await dispatch(updateUserStatus({ userId: confirmUserId, active })).unwrap();
      showToast(`Employee ${active ? 'activated' : 'deactivated'} successfully`, 'success');
      setShowConfirmModal(false);
      setConfirmUserId(null);
      setConfirmAction(null);
      handleRefresh();
    } catch (err: any) {
      showToast(err || 'Failed to update status', 'error');
    }
  };

  const handleDateChange = (userId: number, field: 'from' | 'to', value: string) => {
    setReportDates((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value,
      },
    }));
  };

  const handleViewReport = (userId: number) => {
    const dates = reportDates[userId];
    if (!dates?.from || !dates?.to) {
      showToast('Please select both From and To dates', 'warning');
      return;
    }
    navigate(`/admin/crm/reports?employeeId=${userId}&from=${dates.from}&to=${dates.to}`);
  };

  // Badge helpers
  const getRoleBadge = (roleName: string | null) => {
    if (!roleName) return <span className="text-slate-400 font-medium text-xs">—</span>;
    const normalized = roleName.toUpperCase();
    if (normalized.includes('ADMIN')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          ADMIN
        </span>
      );
    }
    if (normalized.includes('LEAD')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
          TEAM LEAD
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
        EMPLOYEE
      </span>
    );
  };

  const getWorkModeBadge = (mode: string | undefined) => {
    if (!mode) return <span className="text-slate-400 font-medium text-xs">—</span>;
    const colors: Record<string, string> = {
      OFFICE: 'bg-blue-50 text-blue-700 border-blue-200',
      WORK_FROM_HOME: 'bg-teal-50 text-teal-700 border-teal-200',
      HYBRID: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    };
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${colors[mode] || 'bg-slate-100 text-slate-600 border-slate-200'}`}
      >
        {mode.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 mb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1b2559] tracking-tight leading-none flex items-center gap-2.5">
            <Users className="w-7 h-7 text-[#5f41b2]" />
            Employee Directory
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Manage organization hierarchy, roles, and quick assignments ({totalDisplayCount} total)
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {/* Status Filter Dropdown - Only Active/Inactive */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => handleFilterChange(e.target.value as typeof filterStatus)}
              className="appearance-none pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#5f41b2] cursor-pointer shadow-xs"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, code, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#5f41b2] w-64 shadow-xs"
            />
          </div>
          <button
            onClick={handleRefresh}
            title="Refresh List"
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 transition cursor-pointer shadow-xs active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#5f41b2]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-2 [scrollbar-width:thin] relative">
          {loading && displayList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 py-16">
              <Loader2 className="w-8 h-8 animate-spin text-[#5f41b2]" />
              <p className="text-xs font-semibold">Loading workforce directory...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-rose-500 gap-2 py-16">
              <AlertTriangle className="w-8 h-8" />
              <p className="text-sm font-semibold">Failed to load employees</p>
              <p className="text-xs text-slate-400">{error}</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 py-16">
              <Users className="w-12 h-12 opacity-20" />
              <p className="text-sm font-semibold">
                {searchQuery ? 'No employees matched your search' : 'No employees found'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm min-w-[1500px] border-collapse">
              <thead className="bg-slate-50/80 sticky top-0 z-10 border-b border-slate-100">
                <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4 rounded-l-xl">Employee</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Team</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3 text-center">Work Mode</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Quick Assign</th>
                  <th className="py-3 px-4 text-center">Report</th>
                  <th className="py-3 px-4 text-center">Clients</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUsers.map((user) => {
                  const isQuickAssignLoading = quickAssignLoading[user.id] || false;
                  const selections = quickAssignSelections[user.id] || {};
                  const isModified = Boolean(selections.departmentId || selections.teamId || selections.roleId);
                  const dates = reportDates[user.id] || { from: getDefaultFromDate(), to: getDefaultToDate() };

                  const fullName = `${user.firstName} ${user.lastName || ''}`.trim();
                  const viewClientsUrl = `/admin/crm/view-employee-clients/${user.id}?name=${encodeURIComponent(fullName)}&code=${encodeURIComponent(user.employeeCode)}&email=${encodeURIComponent(user.email || '')}&phone=${encodeURIComponent(user.phone || '')}&dept=${encodeURIComponent(user.departmentName || '')}&team=${encodeURIComponent(user.teamName || '')}&role=${encodeURIComponent(user.roleName || '')}&workMode=${encodeURIComponent(user.workMode || '')}`;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#5f41b2] to-[#8063d8] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {user.firstName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-xs truncate">{fullName}</p>
                            <span className="font-mono text-[10px] font-semibold text-slate-400">{user.employeeCode}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="text-xs space-y-0.5">
                          <p className="text-slate-600 font-medium truncate flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            {user.email}
                          </p>
                          <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            {user.phone}
                          </p>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[140px]">{user.departmentName || '—'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-xs font-medium text-slate-600">
                        {user.teamName || <span className="text-slate-400">—</span>}
                      </td>

                      <td className="py-3.5 px-3">{getRoleBadge(user.roleName)}</td>

                      <td className="py-3.5 px-3 text-center">{getWorkModeBadge(user.workMode)}</td>

                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            user.active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${user.active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {user.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 p-1 rounded-xl shadow-2xs">
                          <select
                            value={selections.departmentId || ''}
                            onChange={(e) =>
                              handleQuickAssignChange(
                                user.id,
                                'departmentId',
                                e.target.value ? Number(e.target.value) : null
                              )
                            }
                            className="text-[11px] font-semibold bg-white border border-slate-200 rounded-lg px-2 py-1 focus:ring-1 focus:ring-[#5f41b2] outline-none text-slate-700 w-24 cursor-pointer"
                          >
                            <option value="">Dept</option>
                            {departments.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.name}
                              </option>
                            ))}
                          </select>

                          <select
                            value={selections.teamId || ''}
                            onChange={(e) =>
                              handleQuickAssignChange(
                                user.id,
                                'teamId',
                                e.target.value ? Number(e.target.value) : null
                              )
                            }
                            className="text-[11px] font-semibold bg-white border border-slate-200 rounded-lg px-2 py-1 focus:ring-1 focus:ring-[#5f41b2] outline-none text-slate-700 w-24 cursor-pointer"
                          >
                            <option value="">Team</option>
                            {teams
                              .filter((t) => t.departmentId === (selections.departmentId || user.departmentId || 0))
                              .map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name}
                                </option>
                              ))}
                          </select>

                          <select
                            value={selections.roleId || ''}
                            onChange={(e) =>
                              handleQuickAssignChange(
                                user.id,
                                'roleId',
                                e.target.value ? Number(e.target.value) : null
                              )
                            }
                            className="text-[11px] font-semibold bg-white border border-slate-200 rounded-lg px-2 py-1 focus:ring-1 focus:ring-[#5f41b2] outline-none text-slate-700 w-24 cursor-pointer"
                          >
                            <option value="">Role</option>
                            {roles.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name}
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() => handleQuickAssignSubmit(user.id)}
                            disabled={isQuickAssignLoading || !isModified}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                              isModified
                                ? 'bg-[#5f41b2] hover:bg-[#4e3596] text-white shadow-xs cursor-pointer active:scale-95'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            {isQuickAssignLoading ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Save className="w-3 h-3" />
                            )}
                            Update
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1">
                            <input
                              type="date"
                              value={dates.from}
                              onChange={(e) => handleDateChange(user.id, 'from', e.target.value)}
                              className="text-xs border border-gray-300 rounded-lg px-1.5 py-1 w-24 focus:ring-1 focus:ring-[#5f41b2] focus:border-transparent"
                              title="From Date"
                            />
                            <span className="text-xs text-gray-400">to</span>
                            <input
                              type="date"
                              value={dates.to}
                              onChange={(e) => handleDateChange(user.id, 'to', e.target.value)}
                              className="text-xs border border-gray-300 rounded-lg px-1.5 py-1 w-24 focus:ring-1 focus:ring-[#5f41b2] focus:border-transparent"
                              title="To Date"
                            />
                          </div>
                          <button
                            onClick={() => handleViewReport(user.id)}
                            className="w-full text-xs font-bold bg-[#5f41b2] text-white px-3 py-1.5 rounded-lg hover:bg-[#4e3596] transition shadow-sm active:scale-95"
                          >
                            View Report
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => navigate(viewClientsUrl)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-lg text-xs font-bold transition shadow-sm active:scale-95"
                          title="View assigned clients"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Clients</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleViewHistory(user)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                            title="Audit History"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(user)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#5f41b2] hover:bg-purple-50 transition cursor-pointer"
                            title="Edit Employee"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {user.active ? (
                            <button
                              onClick={() => openConfirm(user.id, 'deactivate')}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Deactivate Account"
                            >
                              <PowerOff className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => openConfirm(user.id, 'activate')}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                              title="Activate Account"
                            >
                              <Power className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {/* Infinite Scroll Sentinel */}
          <div ref={loaderRef} className="h-8 w-full flex items-center justify-center py-4">
            {loading && displayList.length > 0 && (
              <Loader2 className="w-6 h-6 animate-spin text-[#5f41b2]" />
            )}
            {!hasMore && displayList.length > 0 && (
              <span className="text-xs text-slate-400 font-medium">
                Loaded all {totalDisplayCount} employees
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ======== MODALS (unchanged) ======== */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#5f41b2]/10 text-[#5f41b2] flex items-center justify-center font-bold">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Employee Profile</h3>
                  <p className="text-xs text-slate-500 font-medium">Code: {selectedUser.employeeCode}</p>
                </div>
              </div>
              <button
                onClick={closeEditModal}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 [scrollbar-width:thin]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#5f41b2] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName || ''}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#5f41b2] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#5f41b2] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone *</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#5f41b2] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Department *</label>
                  <select
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#5f41b2] focus:outline-none cursor-pointer"
                  >
                    <option value={0}>Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Team</label>
                  <select
                    name="teamId"
                    value={formData.teamId || ''}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#5f41b2] focus:outline-none cursor-pointer"
                  >
                    <option value="">No Team</option>
                    {teams
                      .filter((team) => team.departmentId === Number(formData.departmentId))
                      .map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Role</label>
                  <select
                    name="roleId"
                    value={formData.roleId || ''}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#5f41b2] focus:outline-none cursor-pointer"
                  >
                    <option value="">No Role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Attendance Policy *</label>
                  <select
                    name="attendancePolicyId"
                    value={formData.attendancePolicyId}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#5f41b2] focus:outline-none cursor-pointer"
                  >
                    <option value={0}>Select Policy</option>
                    {attendancePolicies.map((policy) => (
                      <option key={policy.attendancePolicyId} value={policy.attendancePolicyId}>
                        {policy.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Work Mode *</label>
                  <select
                    name="workMode"
                    value={formData.workMode}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#5f41b2] focus:outline-none cursor-pointer"
                  >
                    <option value="OFFICE">Office</option>
                    <option value="WORK_FROM_HOME">Work From Home</option>
                    <option value="HYBRID">Hybrid</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="activeToggle"
                    name="active"
                    checked={formData.active}
                    onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.checked }))}
                    className="w-4 h-4 accent-[#5f41b2] cursor-pointer"
                  />
                  <label htmlFor="activeToggle" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Account Active
                  </label>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2 shrink-0">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/70 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateEmployee}
                className="px-5 py-2 text-xs font-bold text-white bg-[#5f41b2] hover:bg-[#4e3596] rounded-xl transition shadow-xs cursor-pointer active:scale-95"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-sm p-6">
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Confirm Status Change</h3>
            <p className="text-xs text-slate-500 mb-6">
              Are you sure you want to <span className="font-bold text-slate-800">{confirmAction}</span> this employee account?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 text-xs font-bold text-white rounded-xl transition cursor-pointer shadow-xs active:scale-95 ${
                  confirmAction === 'activate'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Yes, {confirmAction}
              </button>
            </div>
          </div>
        </div>
      )}

      <EmployeeHistoryModal
        isOpen={historyModalOpen}
        onClose={() => {
          setHistoryModalOpen(false);
          setHistoryData([]);
        }}
        employeeName={historyEmployeeName}
        history={historyData}
        loading={historyLoading}
      />
    </div>
  );
};

export default AdminViewEmployees;