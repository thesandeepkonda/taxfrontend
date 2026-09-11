// src/pages/Dashboard/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import {
  fetchClients,
  fetchFollowUps,
  fetchNotLifted,
  fetchAdminCalls,
} from '../../store/slices/adminCRMSlice';
import { fetchUsers } from '../../store/slices/usersSlice';
import { fetchDepartments } from '../../store/slices/departmentsSlice';
import { fetchTeams } from '../../store/slices/teamsSlice';
import { fetchAttendancePolicies } from '../../store/slices/attendanceSlice';
import { fetchPendingLeaveRequests, approveLeave, rejectLeave } from '../../store/slices/leaveSlice';
import { fetchTeamLeads, TeamLeadResponseDto } from '../../store/slices/usersSlice';
import { useToast } from '../../contexts/ToastContext';
import {
  Users,
  PhoneCall,
  Clock,
  PhoneOff,
  UserCheck,
  Calendar as CalendarIcon,
  CheckCircle2,
  ArrowUpRight,
  Loader2,
  X,
  FileSpreadsheet,
  ShieldCheck,
  Building2,
  Briefcase,
  Layers,
  UserPlus,
  CalendarCheck2,
  Crown,
} from 'lucide-react';
import Calendar from '../../hooks/Calendar';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();

  const user = useSelector((state: RootState) => state.auth.user);
  const { totalClients, totalCalls } = useSelector((state: RootState) => state.adminCRM);
  const { list: usersList, loading: usersLoading, teamLeads } = useSelector((state: RootState) => state.users);
  const { list: departmentsList } = useSelector((state: RootState) => state.departments);
  const { list: teamsList } = useSelector((state: RootState) => state.teams);
  const { list: policiesList } = useSelector((state: RootState) => state.attendance);
  const { pendingLeaves, loading: leavesLoading } = useSelector((state: RootState) => state.leave);

  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [followUpCount, setFollowUpCount] = useState<number>(0);
  const [notLiftedCount, setNotLiftedCount] = useState<number>(0);
  const [processingLeaveId, setProcessingLeaveId] = useState<number | null>(null);

  useEffect(() => {
    dispatch(fetchClients({ page: 0, size: 1 }));
    dispatch(fetchAdminCalls({ page: 0, size: 1 }));
    dispatch(fetchUsers());
    dispatch(fetchDepartments());
    dispatch(fetchTeams());
    dispatch(fetchAttendancePolicies());
    dispatch(fetchPendingLeaveRequests());
    dispatch(fetchTeamLeads());

    dispatch(fetchFollowUps())
      .unwrap()
      .then((res: any) => setFollowUpCount(res?.length || 0))
      .catch(() => {});

    dispatch(fetchNotLifted())
      .unwrap()
      .then((res: any) => setNotLiftedCount(res?.length || 0))
      .catch(() => {});
  }, [dispatch]);

  const handleApproveLeave = async (leaveId: number) => {
    setProcessingLeaveId(leaveId);
    try {
      await dispatch(approveLeave({ leaveId, remark: 'Approved via Admin Dashboard' })).unwrap();
      showToast('Leave request approved', 'success');
      dispatch(fetchPendingLeaveRequests());
    } catch (err: any) {
      showToast(err || 'Failed to approve leave', 'error');
    } finally {
      setProcessingLeaveId(null);
    }
  };

  const handleRejectLeave = async (leaveId: number) => {
    setProcessingLeaveId(leaveId);
    try {
      await dispatch(rejectLeave({ leaveId, remark: 'Rejected via Admin Dashboard' })).unwrap();
      showToast('Leave request rejected', 'info');
      dispatch(fetchPendingLeaveRequests());
    } catch (err: any) {
      showToast(err || 'Failed to reject leave', 'error');
    } finally {
      setProcessingLeaveId(null);
    }
  };

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-y-auto pr-1 pb-10 space-y-6 select-none">
      
      {/* 1. Header Banner */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#5f41b2]/10 text-[#5f41b2] flex items-center justify-center font-extrabold text-2xl border border-[#5f41b2]/20 shrink-0">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#1b2559] tracking-tight leading-tight">
                Welcome back, {user?.name || 'Administrator'}
              </h1>
              <span className="bg-[#5f41b2]/10 text-[#5f41b2] text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-[#5f41b2]/20">
                SYSTEM ADMIN
              </span>
            </div>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              Enterprise CRM & Operations Management &bull; {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/admin/postexcel')}
            className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Upload Leads</span>
          </button>
          
          <button
            type="button"
            onClick={() => navigate('/admin/post-employees')}
            className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
          >
            <UserPlus className="w-4 h-4 text-[#5f41b2]" />
            <span>Add Employee</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCalendarOpen(true)}
            className="flex items-center gap-2 bg-[#5f41b2] hover:bg-[#4e3596] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
          >
            <CalendarIcon className="w-4 h-4" />
            <span>System Calendar</span>
          </button>
        </div>
      </header>

      {/* 2. Top Metric Cards with Direct Tab Deep-Links */}
      <section aria-label="Key Performance Indicators" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 shrink-0">
        
        {/* Card 1: Total Leads (All Clients) */}
        <div
          onClick={() => navigate('/admin/crm/clients')}
          className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:border-[#5f41b2]/40 transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Leads</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-[#1b2559]">{totalClients}</h3>
            <span className="text-[11px] font-bold text-[#5f41b2] flex items-center gap-0.5 mt-1">
              All Clients <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 2: Follow-up Queue */}
        <div
          onClick={() => navigate('/admin/crm/clients?tab=followup')}
          className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:border-amber-400/40 transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Follow-ups</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-[#1b2559]">{followUpCount}</h3>
            <span className="text-[11px] font-bold text-amber-600 flex items-center gap-0.5 mt-1">
              View Queue <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 3: Not Lifted */}
        <div
          onClick={() => navigate('/admin/crm/clients?tab=notLifted')}
          className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:border-rose-400/40 transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Not Lifted</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition">
              <PhoneOff className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-[#1b2559]">{notLiftedCount}</h3>
            <span className="text-[11px] font-bold text-rose-600 flex items-center gap-0.5 mt-1">
              Review Calls <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 4: Total Calls */}
        <div
          onClick={() => navigate('/admin/crm/calls')}
          className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:border-emerald-400/40 transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Calls Logged</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-[#1b2559]">{totalCalls}</h3>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5 mt-1">
              Call Logs <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 5: Workforce Directory */}
        <div
          onClick={() => navigate('/admin/view-employees')}
          className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:border-indigo-400/40 transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Staff</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-[#1b2559]">{usersList.length}</h3>
            <span className="text-[11px] font-bold text-indigo-600 flex items-center gap-0.5 mt-1">
              View Staff <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 6: Departments & Teams */}
        <div
          onClick={() => navigate('/admin/view-departments')}
          className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:border-purple-400/40 transition cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Departments</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-[#1b2559]">{departmentsList.length}</h3>
            <span className="text-[11px] font-bold text-purple-600 flex items-center gap-0.5 mt-1">
              {teamsList.length} Squads <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </section>

      {/* 3. Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Pending Approvals Queue */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#5f41b2]" />
              <h2 className="text-base font-bold text-[#1b2559]">
                Pending Leave Approvals ({pendingLeaves.length})
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {leavesLoading && <Loader2 className="w-4 h-4 animate-spin text-[#5f41b2]" />}
              {/* View All button to navigate to dedicated page */}
              <button
                onClick={() => navigate('/admin/leave-approvals')}
                className="text-xs font-bold text-[#5f41b2] hover:underline flex items-center gap-1 cursor-pointer"
              >
                View All <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="p-4 flex-1 overflow-y-auto max-h-[380px] space-y-3">
            {pendingLeaves.length === 0 ? (
              <div className="py-14 text-center text-slate-400 flex flex-col items-center justify-center">
                <CheckCircle2 className="w-10 h-10 mb-2 text-emerald-500 opacity-60" />
                <p className="text-sm font-semibold">All staff leave requests are up to date.</p>
                <p className="text-xs text-slate-400 mt-0.5">No pending authorizations required.</p>
              </div>
            ) : (
              pendingLeaves.slice(0, 5).map((req) => (
                <div
                  key={req.leaveId}
                  className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-[#1b2559]">{req.employeeName}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                        {req.leaveType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      Dates: {req.fromDate} to {req.toDate} &bull; ({req.totalDays} day{req.totalDays > 1 ? 's' : ''})
                    </p>
                    {req.description && (
                      <p className="text-xs text-slate-600 mt-1 italic font-normal">"{req.description}"</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <button
                      onClick={() => handleRejectLeave(req.leaveId)}
                      disabled={processingLeaveId === req.leaveId}
                      className="px-3.5 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition disabled:opacity-50 cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApproveLeave(req.leaveId)}
                      disabled={processingLeaveId === req.leaveId}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      {processingLeaveId === req.leaveId ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      Approve
                    </button>
                  </div>
                </div>
              ))
            )}
            {pendingLeaves.length > 5 && (
              <div className="text-center pt-2">
                <button
                  onClick={() => navigate('/admin/leave-approvals')}
                  className="text-xs font-bold text-[#5f41b2] hover:underline"
                >
                  + {pendingLeaves.length - 5} more pending requests
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Quick Staff Roster Preview */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#5f41b2]" />
              <h2 className="text-base font-bold text-[#1b2559]">
                Staff Directory ({usersList.length})
              </h2>
            </div>
            <button
              onClick={() => navigate('/admin/view-employees')}
              className="text-xs font-bold text-[#5f41b2] hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto max-h-[380px] divide-y divide-slate-50">
            {usersLoading && usersList.length === 0 ? (
              <div className="py-14 flex items-center justify-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-[#5f41b2]" />
              </div>
            ) : (
              usersList.slice(0, 6).map((emp) => (
                <div key={emp.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {emp.firstName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {emp.firstName} {emp.lastName || ''}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {emp.employeeCode} &bull; {emp.departmentName || 'General'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                    {emp.roleName || 'STAFF'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. Administration Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Hub 1: CRM & Client Ops */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#1b2559]">Client Management</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">Manage client pipeline, bulk assignments, and CRM comments.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/admin/crm/clients')}
              className="flex-1 py-2 text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl transition border border-slate-200 cursor-pointer"
            >
              Clients List
            </button>
            <button
              onClick={() => navigate('/admin/crm/comments')}
              className="flex-1 py-2 text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl transition border border-slate-200 cursor-pointer"
            >
              Comments
            </button>
          </div>
        </div>

        {/* Hub 2: Organization & RBAC */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-[#5f41b2] flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#1b2559]">Roles & Permissions</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">Configure system access levels and department squad hierarchies.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/admin/view-roles')}
              className="flex-1 py-2 text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl transition border border-slate-200 cursor-pointer"
            >
              View Roles
            </button>
            <button
              onClick={() => navigate('/admin/view-teams')}
              className="flex-1 py-2 text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl transition border border-slate-200 cursor-pointer"
            >
              View Squads
            </button>
          </div>
        </div>

        {/* Hub 3: Attendance Policies */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CalendarCheck2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#1b2559]">Shift & Attendance</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">{policiesList.length} shift policies active across departments.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/admin/view-attendance')}
              className="w-full py-2 text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl transition border border-slate-200 cursor-pointer"
            >
              Manage Attendance Policies
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          ✅ 5. Team Leads Section (UPDATED: View Team button now navigates to members page)
          ============================================================ */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-[#1b2559]">
              Team Leads ({teamLeads.length})
            </h2>
          </div>
          <button
            onClick={() => navigate('/admin/view-employees')}
            className="text-xs font-bold text-[#5f41b2] hover:underline cursor-pointer"
          >
            View All
          </button>
        </div>

        <div className="p-4 overflow-x-auto">
          {teamLeads.length === 0 ? (
            <div className="py-8 text-center text-slate-400 flex flex-col items-center justify-center">
              <Crown className="w-10 h-10 mb-2 opacity-20" />
              <p className="text-sm font-semibold">No team leads assigned yet</p>
              <p className="text-xs text-slate-400 mt-0.5">Assign team leads from the Teams page.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm min-w-[600px]">
              <thead className="bg-gray-50/50">
                <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="p-3 rounded-tl-lg">Employee</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Team</th>
                  <th className="p-3 text-right rounded-tr-lg">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {teamLeads.map((lead) => (
                  <tr key={lead.employeeId} className="hover:bg-blue-50/30 transition">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs shrink-0">
                          {lead.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-[#1b2559] text-sm">{lead.fullName}</p>
                          <p className="text-[10px] text-gray-400">{lead.employeeCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-gray-700">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-gray-400" />
                        {lead.departmentName}
                      </div>
                    </td>
                    <td className="p-3 text-sm text-gray-700">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        {lead.teamName}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      {/* ✅ UPDATED: Navigate directly to team members page with teamId */}
                      <button
                        onClick={() => navigate(`/admin/view-team-members/${lead.teamId}`)}
                        className="text-xs font-bold text-[#5f41b2] hover:underline"
                      >
                        View Team
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 6. Full Screen Calendar Modal */}
      {isCalendarOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="relative w-full max-w-5xl h-[88vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <button
              type="button"
              onClick={() => setIsCalendarOpen(false)}
              className="absolute top-3 right-3 z-10 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex-1 overflow-auto p-4">
              <Calendar onClose={() => setIsCalendarOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;