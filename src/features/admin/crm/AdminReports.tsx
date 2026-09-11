// src/features/admin/crm/AdminReports.tsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../../../store';
import { fetchEmployeeReport } from '../../../store/slices/adminCRMSlice';
import { fetchUsers } from '../../../store/slices/usersSlice';
import { useToast } from '../../../contexts/ToastContext';
import { BarChart2, Loader2, Users, Phone, Clock, TrendingUp, UserCheck, UserX, ArrowLeft } from 'lucide-react';

const AdminReports: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const { list: users } = useSelector((state: RootState) => state.users);
  const { report, loading } = useSelector((state: RootState) => state.adminCRM);

  // State for filters
  const [employeeId, setEmployeeId] = useState<number | ''>('');
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);

  // ✅ Auto-fetch from URL query params on mount
  useEffect(() => {
    const empIdParam = searchParams.get('employeeId');
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    if (empIdParam && fromParam && toParam) {
      const id = Number(empIdParam);
      setEmployeeId(id);
      setFromDate(fromParam);
      setToDate(toParam);
      // Fetch the report immediately
      dispatch(fetchEmployeeReport({ employeeId: id, from: fromParam, to: toParam }));
    }
  }, [dispatch, searchParams]);

  // Fetch users for dropdown
  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleFetchReport = () => {
    if (!employeeId) {
      showToast('Please select an employee', 'warning');
      return;
    }
    if (!fromDate || !toDate) {
      showToast('Please select date range', 'warning');
      return;
    }
    dispatch(
      fetchEmployeeReport({
        employeeId: Number(employeeId),
        from: fromDate,
        to: toDate,
      })
    );
  };

  const statCards = report
    ? [
        { label: 'Assigned Clients', value: report.assignedClients, icon: Users, color: 'bg-blue-50 text-blue-600' },
        { label: 'Calls Made', value: report.callsMade, icon: Phone, color: 'bg-purple-50 text-purple-600' },
        { label: 'Answered Calls', value: report.answeredCalls, icon: UserCheck, color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Not Lifted', value: report.notLiftedCalls, icon: UserX, color: 'bg-rose-50 text-rose-600' },
        { label: 'Follow Ups', value: report.followUps, icon: Clock, color: 'bg-amber-50 text-amber-600' },
        { label: 'Interested', value: report.interested, icon: TrendingUp, color: 'bg-indigo-50 text-indigo-600' },
        { label: 'Not Interested', value: report.notInterested, icon: TrendingUp, color: 'bg-gray-50 text-gray-600' },
        { label: 'Total Talk Time', value: `${report.totalTalkTimeMinutes}m`, icon: Clock, color: 'bg-teal-50 text-teal-600' },
      ]
    : [];

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden">
      {/* ✅ Back Button */}
      <div className="flex items-center gap-3 shrink-0 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 hover:text-[#5f41b2] transition"
          title="Go Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-[#1b2559] tracking-tight leading-none flex items-center gap-3">
            <BarChart2 className="w-7 h-7 text-[#5f41b2]" />
            Employee Performance Report
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Analytics and metrics by employee</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 shrink-0 mb-6 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Employee</label>
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value ? Number(e.target.value) : '')}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5f41b2]"
          >
            <option value="">Select Employee</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName} ({u.employeeCode})
              </option>
            ))}
          </select>
        </div>
        <div className="w-40">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5f41b2]"
          />
        </div>
        <div className="w-40">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5f41b2]"
          />
        </div>
        <button
          onClick={handleFetchReport}
          disabled={loading}
          className="min-h-[44px] px-6 flex items-center gap-2 bg-[#5f41b2] text-white font-bold rounded-xl hover:bg-[#4e3596] transition shadow-sm disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart2 className="w-4 h-4" />}
          Generate
        </button>
      </div>

      {/* Report Results */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#5f41b2]" />
            <p className="text-sm font-semibold">Generating report...</p>
          </div>
        ) : report ? (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <h3 className="text-lg font-bold text-[#1b2559] mb-4">
                {report.employeeName} ({report.employeeCode})
                <span className="text-sm font-medium text-gray-400 ml-2">Avg Call: {report.averageCallSeconds}s</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {statCards.map((stat, idx) => (
                  <div key={idx} className={`p-4 rounded-xl border border-gray-100 flex items-center gap-3 ${stat.color}`}>
                    <div className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center shrink-0">
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{stat.label}</p>
                      <p className="text-xl font-extrabold text-[#1b2559]">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
            <BarChart2 className="w-12 h-12 opacity-20" />
            <p className="text-sm font-semibold">Select filters and generate report</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReports;