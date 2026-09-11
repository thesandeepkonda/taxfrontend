// src/features/admin/teams/AdminViewAttendance.tsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import {
  fetchAttendancePolicies,
  createAttendancePolicy,
  activateAttendancePolicy,
  deactivateAttendancePolicy,
  fetchAttendancePoliciesByStatus,
  AttendancePolicyResponse,
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

const AdminViewAttendance: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();
  const { list: policies, loading, error } = useSelector((state: RootState) => state.attendance);

  // ---------- Filter Tabs ----------
  type FilterTab = 'ALL' | 'ACTIVE' | 'INACTIVE';
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');

  // ---------- Modal States ----------
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // ---------- Create Form State ----------
  const [formName, setFormName] = useState('');
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndTime, setFormEndTime] = useState('18:00');
  const [formAllowedBreakMinutes, setFormAllowedBreakMinutes] = useState<number>(60);
  // ✅ NEW: Working Days State
  const [formWorkingDays, setFormWorkingDays] = useState('Mon - Fri');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ---------- View Details ----------
  const [viewingPolicy, setViewingPolicy] = useState<AttendancePolicyResponse | null>(null);

  // ---------- Confirm Toggle ----------
  const [confirmAction, setConfirmAction] = useState<'activate' | 'deactivate' | null>(null);
  const [confirmPolicyId, setConfirmPolicyId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Load policies based on filter
  const loadPolicies = (filter: FilterTab) => {
    if (filter === 'ALL') {
      dispatch(fetchAttendancePolicies());
    } else {
      const active = filter === 'ACTIVE';
      dispatch(fetchAttendancePoliciesByStatus(active));
    }
  };

  useEffect(() => {
    loadPolicies(activeFilter);
  }, [dispatch, activeFilter]);

  // ---------- Create Handlers ----------
  const resetForm = () => {
    setFormName('');
    setFormStartTime('09:00');
    setFormEndTime('18:00');
    setFormAllowedBreakMinutes(60);
    setFormWorkingDays('Mon - Fri'); // ✅ Reset working days
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
        workingDays: formWorkingDays.trim(), // ✅ Sending working days to backend
      };
      await dispatch(createAttendancePolicy(payload)).unwrap();
      showToast(`Policy "${formName}" created successfully!`, 'success');
      closeCreateModal();
      loadPolicies(activeFilter);
    } catch (err: any) {
      showToast(err || 'Failed to create policy', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------- View Details ----------
  const openViewModal = (policy: AttendancePolicyResponse) => {
    setViewingPolicy(policy);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewingPolicy(null);
  };

  // ---------- Toggle (Activate/Deactivate) ----------
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
      loadPolicies(activeFilter);
    } catch (err: any) {
      showToast(err || `Failed to ${confirmAction} policy`, 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const getStatusBadge = (active: boolean) => {
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

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden">
      {/* Main Card */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-hidden">
        {/* Header with Filter Tabs */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap justify-between items-center shrink-0 bg-gray-50/50 gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#5f41b2]" />
            <h2 className="text-lg font-bold text-[#1b2559]">Policy List ({policies.length})</h2>
          </div>
          <div className="flex items-center gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 p-0.5 shadow-xs">
              <button
                onClick={() => setActiveFilter('ALL')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  activeFilter === 'ALL'
                    ? 'bg-[#5f41b2] text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveFilter('ACTIVE')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  activeFilter === 'ACTIVE'
                    ? 'bg-[#5f41b2] text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setActiveFilter('INACTIVE')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  activeFilter === 'INACTIVE'
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

        {/* Table */}
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
                    {/* ✅ NEW: Working Days Column */}
                    <th className="p-3 text-center">Working Days</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {policies.map((policy) => {
                    const isToggling = togglingId === policy.attendancePolicyId;
                    return (
                      <tr key={policy.attendancePolicyId} className="hover:bg-blue-50/30 transition group">
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
                          {policy.allowedBreakMinutes !== undefined ? `${policy.allowedBreakMinutes} min` : '—'}
                        </td>
                        {/* ✅ NEW: Working Days Data */}
                        <td className="p-3 text-center font-medium text-gray-700">
                          {policy.workingDays || '—'}
                        </td>
                        <td className="p-3 text-center">
                          {getStatusBadge(policy.active)}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* View Details */}
                            <button
                              onClick={() => openViewModal(policy)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Toggle Active/Inactive */}
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

      {/* ======== MODAL: Create Policy ======== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="text-xl font-bold text-[#1b2559] flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#5f41b2]" />
                Create Attendance Policy
              </h3>
              <button onClick={closeCreateModal} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCreatePolicy} className="flex-1 overflow-y-auto pr-1">
              {/* Policy Name */}
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

              {/* Allowed Break Minutes */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Allowed Break Minutes (per day) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={formAllowedBreakMinutes}
                  onChange={(e) => setFormAllowedBreakMinutes(Number(e.target.value))}
                  placeholder="e.g., 60"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5f41b2] focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">Total break time allowed per day in minutes.</p>
              </div>

              {/* ✅ NEW: Working Days Input */}
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
                <p className="text-xs text-gray-400 mt-1">Specify the working days for this policy.</p>
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
                  disabled={isSubmitting || !formName.trim() || !formStartTime || !formEndTime || !formWorkingDays.trim()}
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

      {/* ======== MODAL: View Policy Details ======== */}
      {showViewModal && viewingPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#1b2559] flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#5f41b2]" />
                Policy Details
              </h3>
              <button onClick={closeViewModal} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Name</p>
                <p className="text-lg font-bold text-[#1b2559]">{viewingPolicy.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Start</p>
                  <p className="font-semibold">{formatTime(viewingPolicy.startTime)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">End</p>
                  <p className="font-semibold">{formatTime(viewingPolicy.endTime)}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Allowed Break Minutes</p>
                <p className="font-semibold">{viewingPolicy.allowedBreakMinutes ?? '—'} minutes</p>
              </div>

              {/* ✅ NEW: Working Days Display */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Working Days</p>
                <p className="font-semibold">{viewingPolicy.workingDays || '—'}</p>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Status</p>
                {getStatusBadge(viewingPolicy.active)}
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

      {/* ======== MODAL: Confirm Activate/Deactivate ======== */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4 text-amber-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-[#1b2559]">Confirm</h3>
            </div>
            <p className="text-gray-700 mb-4">
              Are you sure you want to <span className="font-semibold">{confirmAction === 'activate' ? 'activate' : 'deactivate'}</span> this policy?
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