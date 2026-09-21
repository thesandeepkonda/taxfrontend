// src/features/admin/teams/AdminViewTeamMembers.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import {
  fetchUsersByTeam,
  clearTeamUsers,
  fetchTeamById,
  assignTeamLead,
} from '../../../store/slices/teamsSlice';
import { fetchRoles } from '../../../store/slices/rolesSlice';
import { quickAssign, fetchUsers, User } from '../../../store/slices/usersSlice';
import { useToast } from '../../../contexts/ToastContext';
// ✅ Import CreateEmployeeModal
import CreateEmployeeModal from '../resueables/CreateEmployeeModal';
import {
  ArrowLeft,
  Users,
  Loader2,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  UserCheck,
  Save,
  Eye,
  FileBarChart,
  Briefcase,
  ShieldCheck,
  Calendar,
  Building2,
  Sparkles,
  UserPlus,
  UserPlus2,
  Search,
  X,
} from 'lucide-react';

// Helper to get default date (30 days ago)
const getDefaultFromDate = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split('T')[0];
};

const getDefaultToDate = () => new Date().toISOString().split('T')[0];

const AdminViewTeamMembers: React.FC = () => {
  const { teamID } = useParams<{ teamID: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();

  const teamId = Number(teamID);
  const { teamUsers, loading, currentTeam } = useSelector((state: RootState) => state.teams);
  const { list: roles, loading: rolesLoading } = useSelector((state: RootState) => state.roles);
  const { list: allUsers, loading: usersLoading } = useSelector((state: RootState) => state.users);

  // Local state for per-user date ranges (Report)
  const [reportDates, setReportDates] = useState<Record<number, { from: string; to: string }>>({});

  // Role change state per user
  const [roleSelections, setRoleSelections] = useState<Record<number, number | ''>>({});
  const [roleUpdateLoading, setRoleUpdateLoading] = useState<Record<number, boolean>>({});

  // ✅ Create Employee Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // ✅ NEW: Assign Existing Employee Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignSearchQuery, setAssignSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Fetch roles on mount if not already loaded
  useEffect(() => {
    if (roles.length === 0 && !rolesLoading) {
      dispatch(fetchRoles());
    }
  }, [dispatch, roles.length, rolesLoading]);

  // Fetch team details and members
  useEffect(() => {
    if (teamId) {
      dispatch(fetchTeamById(teamId))
        .unwrap()
        .catch(() => {
          showToast('Team not found', 'error');
        });

      dispatch(fetchUsersByTeam(teamId))
        .unwrap()
        .catch((err) => {
          showToast(err || 'Failed to load team members', 'error');
        });
    }

    return () => {
      dispatch(clearTeamUsers());
    };
  }, [dispatch, teamId, showToast]);

  // Initialize default dates and role selections
  useEffect(() => {
    if (teamUsers.length > 0) {
      const defaultDates = teamUsers.reduce((acc, user) => {
        if (user.id) {
          acc[user.id] = {
            from: getDefaultFromDate(),
            to: getDefaultToDate(),
          };
        }
        return acc;
      }, {} as Record<number, { from: string; to: string }>);
      setReportDates(defaultDates);

      const initialRoles: Record<number, number | ''> = {};
      teamUsers.forEach((user) => {
        if (user.id) {
          initialRoles[user.id] = user.roleId || '';
        }
      });
      setRoleSelections(initialRoles);
    }
  }, [teamUsers]);

  // ============================================================
  // ✅ NEW: Load all users when Assign Modal opens
  // ============================================================
  useEffect(() => {
    if (isAssignModalOpen && allUsers.length === 0) {
      dispatch(fetchUsers());
    }
  }, [isAssignModalOpen, allUsers.length, dispatch]);

  // ============================================================
  // ✅ NEW: Filter available employees (exclude current team members)
  // ============================================================
  const availableEmployees = useMemo(() => {
    const currentTeamUserIds = new Set(teamUsers.map((u) => u.id));
    return allUsers.filter((u) => {
      // Exclude already-in-team users
      if (currentTeamUserIds.has(u.id)) return false;
      // Only active users
      if (!u.active) return false;
      return true;
    });
  }, [allUsers, teamUsers]);

  // Filter by search query
  const filteredAvailableEmployees = useMemo(() => {
    const q = assignSearchQuery.toLowerCase().trim();
    if (!q) return availableEmployees;
    return availableEmployees.filter(
      (u) =>
        `${u.firstName} ${u.lastName || ''}`.toLowerCase().includes(q) ||
        u.employeeCode.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.departmentName && u.departmentName.toLowerCase().includes(q))
    );
  }, [availableEmployees, assignSearchQuery]);

  // ============================================================
  // ✅ NEW: Assign Existing Employee Handler
  // ============================================================
  const handleAssignExistingEmployee = async () => {
    if (!selectedUserId) {
      showToast('Please select an employee to assign', 'warning');
      return;
    }

    if (!currentTeam?.departmentId) {
      showToast('Team department info missing. Please refresh.', 'error');
      return;
    }

    setIsAssigning(true);
    try {
      await dispatch(
        quickAssign({
          userId: Number(selectedUserId),
          data: {
            teamId: teamId,
            departmentId: currentTeam.departmentId,
          },
        })
      ).unwrap();

      const assignedUser = allUsers.find((u) => u.id === Number(selectedUserId));
      const name = assignedUser
        ? `${assignedUser.firstName} ${assignedUser.lastName || ''}`.trim()
        : 'Employee';

      showToast(`${name} assigned to ${currentTeam.name} successfully!`, 'success');

      // Reset & close
      setIsAssignModalOpen(false);
      setSelectedUserId('');
      setAssignSearchQuery('');

      // Refresh team users
      dispatch(fetchUsersByTeam(teamId)).unwrap().catch(() => {});
    } catch (err: any) {
      showToast(err || 'Failed to assign employee to team', 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleCloseAssignModal = () => {
    setIsAssignModalOpen(false);
    setSelectedUserId('');
    setAssignSearchQuery('');
  };

  // ============================================================
  // Report handlers
  // ============================================================
  const handleViewReport = (userId: number) => {
    const dates = reportDates[userId];
    if (!dates?.from || !dates?.to) {
      showToast('Please select both From and To dates for this user', 'warning');
      return;
    }
    navigate(`/admin/crm/reports?employeeId=${userId}&from=${dates.from}&to=${dates.to}`);
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

  // ============================================================
  // Role change handler with override logic
  // ============================================================
  const handleRoleChange = (userId: number, roleId: number | '') => {
    setRoleSelections((prev) => ({ ...prev, [userId]: roleId }));
  };

  const handleRoleUpdate = async (userId: number) => {
    const newRoleId = roleSelections[userId];
    if (!newRoleId) {
      showToast('Please select a role', 'warning');
      return;
    }

    const user = teamUsers.find((u) => u.id === userId);
    if (!user) {
      showToast('User not found', 'error');
      return;
    }
    if (user.roleId === newRoleId) {
      showToast('Role is already set to this value', 'info');
      return;
    }

    const teamLeadRole = roles.find((r) => r.name === 'TEAM_LEAD');
    const isTeamLeadRole = teamLeadRole && newRoleId === teamLeadRole.id;

    setRoleUpdateLoading((prev) => ({ ...prev, [userId]: true }));

    const performUpdate = async (override = false) => {
      if (isTeamLeadRole) {
        await dispatch(
          assignTeamLead({
            teamId: teamId,
            employeeId: userId,
            override,
          })
        ).unwrap();
      } else {
        await dispatch(
          quickAssign({
            userId,
            data: { roleId: Number(newRoleId), override },
          })
        ).unwrap();
      }
    };

    try {
      await performUpdate(false);
      showToast('Role updated successfully!', 'success');
      dispatch(fetchUsersByTeam(teamId)).unwrap().catch(() => {});
    } catch (err: any) {
      const errorMsg = err || 'Failed to update role';
      if (isTeamLeadRole && errorMsg.includes('Team already has a team lead assigned')) {
        const confirmOverride = window.confirm(
          'This team already has a team lead assigned. Do you want to override and replace them?'
        );
        if (confirmOverride) {
          try {
            await performUpdate(true);
            showToast('Role updated with override!', 'success');
            dispatch(fetchUsersByTeam(teamId)).unwrap().catch(() => {});
          } catch (overrideErr: any) {
            showToast(overrideErr || 'Override failed', 'error');
          }
        } else {
          showToast('Override cancelled', 'info');
        }
      } else {
        showToast(errorMsg, 'error');
      }
    } finally {
      setRoleUpdateLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  // ============================================================
  // Badge helpers
  // ============================================================
  const getStatusBadge = (active: boolean) => {
    return active ? (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-wide">
        <XCircle className="w-3 h-3 text-rose-600" /> Inactive
      </span>
    );
  };

  const getRoleBadge = (roleName: string | null) => {
    if (roleName === 'TEAM_LEAD') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[5px] text-[10px] font-bold bg-purple-50 text-[#5f41b2] border border-purple-200 uppercase tracking-wide">
          <UserCheck className="w-3 h-3 text-[#5f41b2]" /> Team Lead
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[5px] text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wide">
        <ShieldCheck className="w-3 h-3 text-blue-600" /> {roleName || 'Employee'}
      </span>
    );
  };

  if (!teamID || isNaN(teamId)) {
    return (
      <div className="w-full h-full flex items-center justify-center text-rose-500 font-bold">
        Invalid Team ID
      </div>
    );
  }

  return (
    <div className="w-full min-h-0 flex-1 flex flex-col font-sans overflow-hidden bg-gray-50/60 p-0">
      {/* 🚀 Re-designed Modern Header Bar */}
      <div className="bg-white border-b border-gray-200/90 px-4 py-3.5 shrink-0 mb-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left Section: Back Button + Team Info */}
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => navigate(-1)}
              className="p-2 bg-gray-50 border border-gray-200 rounded-[5px] hover:bg-[#5f41b2] hover:text-white hover:border-[#5f41b2] transition-all cursor-pointer text-gray-600 shadow-2xs active:scale-95"
              title="Go Back"
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
                    Team Members
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-[#5f41b2] border border-purple-100 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {teamUsers.length} {teamUsers.length === 1 ? 'Member' : 'Members'}
                  </span>
                </div>
                <p className="text-xs font-semibold text-gray-500 mt-1 flex items-center gap-1.5">
                  <span className="text-[#0F172A] font-bold">
                    {currentTeam ? currentTeam.name : `Team #${teamId}`}
                  </span>
                  {currentTeam?.departmentName && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className="inline-flex items-center gap-1 text-gray-500 font-medium">
                        <Building2 className="w-3 h-3 text-[#5f41b2]" />
                        {currentTeam.departmentName}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* ✅ Right Section: Assign Existing + Create Employee Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[5px] text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
              title="Assign an existing employee to this team"
            >
              <UserPlus2 className="w-4 h-4" />
              <span>Assign Existing Employee</span>
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-[#5f41b2] hover:bg-[#4d3396] text-white rounded-[5px] text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Employee</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Content - Boxes Model Container */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4">
        {loading && teamUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#5f41b2]" />
            <p className="text-sm font-semibold">Loading team members...</p>
          </div>
        ) : teamUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 py-16 bg-white border border-gray-200/80 rounded-[5px]">
            <Users className="w-12 h-12 opacity-20" />
            <p className="text-sm font-semibold">No members found in this team</p>
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="text-xs font-bold text-[#5f41b2] hover:underline flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" /> Create new employee
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => setIsAssignModalOpen(true)}
                className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
              >
                <UserPlus2 className="w-3.5 h-3.5" /> Assign existing
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5 pb-4">
            {teamUsers.map((user) => {
              const isUpdating = roleUpdateLoading[user.id] || false;
              const selectedRole = roleSelections[user.id] || '';

              const fullName = `${user.firstName} ${user.lastName || ''}`.trim();
              const viewClientsUrl = `/admin/crm/view-employee-clients/${user.id}?name=${encodeURIComponent(
                fullName
              )}&code=${encodeURIComponent(user.employeeCode)}&email=${encodeURIComponent(
                user.email || ''
              )}&phone=${encodeURIComponent(user.phone || '')}&dept=${encodeURIComponent(
                user.departmentName || ''
              )}&team=${encodeURIComponent(user.teamName || '')}&role=${encodeURIComponent(
                user.roleName || ''
              )}&workMode=${encodeURIComponent(user.workMode || '')}`;

              return (
                <div
                  key={user.employeeCode}
                  className="bg-white rounded-[5px] border border-gray-200/80 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-gray-100 flex items-start justify-between gap-3 bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-[5px] bg-[#5f41b2]/10 border border-[#5f41b2]/20 flex items-center justify-center text-[#5f41b2] font-extrabold text-sm shrink-0">
                        {user.firstName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-[#0F172A] text-sm leading-snug">
                          {user.firstName} {user.lastName || ''}
                        </h3>
                        <p className="text-[11px] font-mono text-gray-400 font-bold mt-0.5">
                          #{user.employeeCode}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(user.active)}
                    </div>
                  </div>

                  {/* Card Body - Contacts & Work Specs */}
                  <div className="p-4 space-y-3 flex-1 text-xs">
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-100">
                      <div>{getRoleBadge(user.roleName)}</div>
                      {user.workMode && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                          <Briefcase className="w-3 h-3 text-slate-500" />
                          {user.workMode.replace('_', ' ')}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 pt-1 text-slate-600">
                      <div className="flex items-center gap-2 truncate" title={user.email || '—'}>
                        <Mail className="w-3.5 h-3.5 text-[#5f41b2] shrink-0" />
                        <span className="font-medium truncate">{user.email || '—'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#5f41b2] shrink-0" />
                        <span className="font-medium">{user.phone || '—'}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100">
                      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                        Change Role
                      </label>
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedRole}
                          onChange={(e) =>
                            handleRoleChange(
                              user.id,
                              e.target.value ? Number(e.target.value) : ''
                            )
                          }
                          className="text-xs font-semibold bg-white border border-gray-300 rounded-[5px] px-2.5 py-1.5 focus:ring-1 focus:ring-[#5f41b2] outline-none text-slate-700 flex-1 h-8 shadow-2xs cursor-pointer"
                          disabled={isUpdating || rolesLoading}
                        >
                          <option value="">Select Role</option>
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleRoleUpdate(user.id)}
                          disabled={isUpdating || !selectedRole || selectedRole === user.roleId}
                          className={`px-3 py-1.5 rounded-[5px] text-xs font-bold transition flex items-center justify-center gap-1.5 h-8 shrink-0 ${
                            !selectedRole || selectedRole === user.roleId
                              ? 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
                              : 'bg-[#5f41b2] hover:bg-[#4d3396] text-white shadow-2xs cursor-pointer active:scale-95'
                          }`}
                        >
                          {isUpdating ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Save className="w-3.5 h-3.5" />
                          )}
                          Update
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100">
                      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                        Performance Report Range
                      </label>
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 flex items-center gap-1 bg-white border border-gray-300 rounded-[5px] px-2 py-1 h-8 shadow-2xs">
                          <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <input
                            type="date"
                            value={reportDates[user.id]?.from || ''}
                            onChange={(e) =>
                              handleDateChange(user.id, 'from', e.target.value)
                            }
                            className="text-xs outline-none w-full text-slate-700 bg-transparent"
                            title="From Date"
                          />
                        </div>
                        <span className="text-xs text-slate-400 font-bold">to</span>
                        <div className="flex-1 flex items-center gap-1 bg-white border border-gray-300 rounded-[5px] px-2 py-1 h-8 shadow-2xs">
                          <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <input
                            type="date"
                            value={reportDates[user.id]?.to || ''}
                            onChange={(e) =>
                              handleDateChange(user.id, 'to', e.target.value)
                            }
                            className="text-xs outline-none w-full text-slate-700 bg-transparent"
                            title="To Date"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-3 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleViewReport(user.id)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#5f41b2] hover:bg-[#4d3396] text-white text-xs font-bold rounded-[5px] transition shadow-2xs active:scale-95 cursor-pointer h-8"
                      title="View employee performance report"
                    >
                      <FileBarChart className="w-3.5 h-3.5" />
                      <span>Report</span>
                    </button>

                    <button
                      onClick={() => navigate(viewClientsUrl)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50/90 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-blue-600 rounded-[5px] text-xs font-bold transition shadow-2xs active:scale-95 cursor-pointer h-8"
                      title="View assigned clients"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Clients</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mx-4 mb-3 p-3 border border-gray-200 bg-white rounded-[5px] shrink-0 text-xs text-slate-500 flex justify-between items-center shadow-2xs">
        <span>
          Total <span className="font-bold text-slate-700">{teamUsers.length}</span> members
        </span>
        <span>
          Team ID: #{teamId}
          {currentTeam && ` • ${currentTeam.departmentName || ''}`}
        </span>
      </div>

      {/* ✅ Reusable Create Employee Modal Integration */}
      <CreateEmployeeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          dispatch(fetchUsersByTeam(teamId))
            .unwrap()
            .catch((err) => {
              showToast(err || 'Failed to refresh team members', 'error');
            });
          showToast('Employee created successfully! Team list refreshed.', 'success');
        }}
        preSelectedDepartmentId={currentTeam?.departmentId || null}
        preSelectedTeamId={teamId}
      />

      {/* ============================================================ */}
      {/* ✅ NEW: Assign Existing Employee Modal                        */}
      {/* ============================================================ */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
            {/* Modal Header */}
            <div className="bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <UserPlus2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1b2559]">Assign Existing Employee</h3>
                  <p className="text-xs text-slate-500">
                    Add an employee to{' '}
                    <span className="font-bold text-[#5f41b2]">
                      {currentTeam ? currentTeam.name : `Team #${teamId}`}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseAssignModal}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                disabled={isAssigning}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 [scrollbar-width:thin]">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search employees by name, code, email or department..."
                  value={assignSearchQuery}
                  onChange={(e) => setAssignSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              {/* Employee List */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Select Employee ({filteredAvailableEmployees.length} available)
                </label>

                {usersLoading && allUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                    <p className="text-sm font-semibold">Loading employees...</p>
                  </div>
                ) : filteredAvailableEmployees.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                    <Users className="w-10 h-10 opacity-20" />
                    <p className="text-sm font-semibold">
                      {assignSearchQuery
                        ? 'No matching employees found'
                        : 'All active employees are already in this team'}
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[380px] overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 [scrollbar-width:thin]">
                    {filteredAvailableEmployees.map((emp) => {
                      const isSelected = selectedUserId === emp.id;
                      const fullName = `${emp.firstName} ${emp.lastName || ''}`.trim();
                      return (
                        <button
                          type="button"
                          key={emp.id}
                          onClick={() => setSelectedUserId(emp.id)}
                          disabled={isAssigning}
                          className={`w-full text-left p-3.5 flex items-center justify-between gap-3 transition cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50 border-l-4 border-l-emerald-600'
                              : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className={`w-10 h-10 rounded-[5px] flex items-center justify-center font-extrabold text-sm shrink-0 border ${
                                isSelected
                                  ? 'bg-emerald-600 text-white border-emerald-700'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {emp.firstName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-[#0F172A] text-sm truncate">
                                {fullName}
                              </p>
                              <p className="text-[11px] text-slate-400 font-mono font-semibold mt-0.5">
                                #{emp.employeeCode}
                              </p>
                              <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 flex-wrap">
                                {emp.departmentName && (
                                  <span className="flex items-center gap-1 truncate">
                                    <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                                    {emp.departmentName}
                                  </span>
                                )}
                                {emp.teamName && (
                                  <span className="flex items-center gap-1 truncate">
                                    <Users className="w-3 h-3 text-slate-400 shrink-0" />
                                    {emp.teamName}
                                  </span>
                                )}
                                {emp.roleName && (
                                  <span className="flex items-center gap-1 truncate">
                                    <ShieldCheck className="w-3 h-3 text-slate-400 shrink-0" />
                                    {emp.roleName}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {isSelected && (
                            <span className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0">
                              <CheckCircle2 className="w-4 h-4" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Selected Preview */}
              {selectedUserId && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5">
                  <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1">
                    Ready to Assign
                  </p>
                  {(() => {
                    const emp = allUsers.find((u) => u.id === Number(selectedUserId));
                    if (!emp) return null;
                    return (
                      <p className="text-sm font-bold text-emerald-900">
                        {emp.firstName} {emp.lastName || ''}{' '}
                        <span className="font-normal text-emerald-700">
                          ({emp.employeeCode})
                        </span>{' '}
                        → <span className="font-bold">{currentTeam?.name || `Team #${teamId}`}</span>
                      </p>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleCloseAssignModal}
                disabled={isAssigning}
                className="min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignExistingEmployee}
                disabled={isAssigning || !selectedUserId}
                className="min-h-[44px] flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95"
              >
                {isAssigning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <UserPlus2 className="w-4 h-4" />
                    Assign to Team
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

export default AdminViewTeamMembers;