// src/features/admin/AdminLeaveApprovals.tsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import {
  fetchPendingLeaveRequests,
  approveLeave,
  rejectLeave,
  LeaveRequestResponse,
} from '../../store/slices/leaveSlice';
import { useToast } from '../../contexts/ToastContext';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Calendar,
  FileText,
  RefreshCw,
  Filter,
  Search,
} from 'lucide-react';

const AdminLeaveApprovals: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();
  const { pendingLeaves, loading } = useSelector((state: RootState) => state.leave);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  useEffect(() => {
    dispatch(fetchPendingLeaveRequests());
  }, [dispatch]);

  const handleApprove = async (leaveId: number) => {
    setProcessingId(leaveId);
    try {
      await dispatch(approveLeave({ leaveId, remark: 'Approved by Admin' })).unwrap();
      showToast('Leave approved successfully', 'success');
      dispatch(fetchPendingLeaveRequests());
    } catch (err: any) {
      showToast(err || 'Failed to approve leave', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (leaveId: number) => {
    setProcessingId(leaveId);
    try {
      await dispatch(rejectLeave({ leaveId, remark: 'Rejected by Admin' })).unwrap();
      showToast('Leave rejected', 'info');
      dispatch(fetchPendingLeaveRequests());
    } catch (err: any) {
      showToast(err || 'Failed to reject leave', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getLeaveTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      CASUAL: 'bg-blue-100 text-blue-700 border-blue-200',
      SICK: 'bg-rose-100 text-rose-700 border-rose-200',
      EARNED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      MATERNITY: 'bg-purple-100 text-purple-700 border-purple-200',
      PATERNITY: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      COMP_OFF: 'bg-amber-100 text-amber-700 border-amber-200',
      OTHER: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  // Filter and search
  const filteredLeaves = pendingLeaves.filter((leave) => {
    const matchesSearch =
      leave.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      leave.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      leave.leaveType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'ALL' || leave.leaveType === filterType;
    return matchesSearch && matchesType;
  });

  // Count pending leaves by type
  const typeCounts = pendingLeaves.reduce((acc, leave) => {
    acc[leave.leaveType] = (acc[leave.leaveType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const uniqueTypes = Array.from(new Set(pendingLeaves.map((l) => l.leaveType)));

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1b2559] tracking-tight leading-none flex items-center gap-3">
            <Clock className="w-7 h-7 text-amber-500" />
            Leave Approvals
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Review and manage pending leave requests
          </p>
        </div>
        <button
          onClick={() => dispatch(fetchPendingLeaveRequests())}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition shadow-xs active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 shrink-0 mb-6">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Pending</p>
          <h3 className="text-2xl font-extrabold text-[#1b2559]">{pendingLeaves.length}</h3>
        </div>
        {uniqueTypes.slice(0, 3).map((type) => (
          <div key={type} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{type}</p>
            <h3 className="text-2xl font-extrabold text-[#1b2559]">{typeCounts[type] || 0}</h3>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 shrink-0 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by employee, code, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5f41b2] shadow-xs"
          />
        </div>
        <div className="relative">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="appearance-none px-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5f41b2] cursor-pointer"
          >
            <option value="ALL">All Types</option>
            {uniqueTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <Filter className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-2">
          {loading && pendingLeaves.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#5f41b2]" />
              <p className="text-sm font-semibold">Loading pending requests...</p>
            </div>
          ) : filteredLeaves.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
              <CheckCircle2 className="w-12 h-12 opacity-20 text-emerald-500" />
              <p className="text-sm font-semibold">No pending leave requests</p>
              <p className="text-xs text-gray-400">All requests have been processed.</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[800px]">
                <thead className="bg-gray-50/80 sticky top-0 z-10">
                  <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <th className="p-3 rounded-tl-lg">Employee</th>
                    <th className="p-3">Leave Type</th>
                    <th className="p-3">From – To</th>
                    <th className="p-3 text-center">Days</th>
                    <th className="p-3">Applied On</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredLeaves.map((leave) => (
                    <tr key={leave.leaveId} className="hover:bg-blue-50/30 transition group">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                            {leave.employeeName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-[#1b2559] text-sm">{leave.employeeName}</p>
                            <p className="text-[10px] text-gray-400">{leave.employeeCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getLeaveTypeColor(leave.leaveType)}`}>
                          {leave.leaveType}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-gray-700">
                        <div className="flex flex-col">
                          <span>{formatDate(leave.fromDate)}</span>
                          <span className="text-gray-400 text-xs">to {formatDate(leave.toDate)}</span>
                        </div>
                      </td>
                      <td className="p-3 text-center font-bold text-[#1b2559]">
                        {leave.totalDays}
                      </td>
                      <td className="p-3 text-xs text-gray-500">
                        {new Date(leave.appliedAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleReject(leave.leaveId)}
                            disabled={processingId === leave.leaveId}
                            className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition disabled:opacity-50"
                            title="Reject"
                          >
                            {processingId === leave.leaveId ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleApprove(leave.leaveId)}
                            disabled={processingId === leave.leaveId}
                            className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition disabled:opacity-50"
                            title="Approve"
                          >
                            {processingId === leave.leaveId ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer with count */}
        <div className="p-3 border-t border-gray-100 shrink-0 text-xs text-gray-400 flex justify-between">
          <span>Showing {filteredLeaves.length} of {pendingLeaves.length} pending requests</span>
          <span>Updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};

export default AdminLeaveApprovals;