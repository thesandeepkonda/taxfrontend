// src/features/admin/teams/AdminViewDepartments.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import { fetchTeamsByDepartment, assignTeamLead, fetchUsersByTeam } from '../../../store/slices/teamsSlice';
import { fetchUsers } from '../../../store/slices/usersSlice';
import { DEPARTMENT_OPTIONS } from '../../../constants/enums';
import { useToast } from '../../../contexts/ToastContext';
import {
  Building2,
  Users,
  UserCheck,
  UserX,
  CheckCircle2,
  Plus,
  ChevronRight,
  Loader2,
  X,
} from 'lucide-react';
import TeamCreationModal from '../resueables/TeamCreationModal';

interface Team {
  id: number;
  name: string;
  department: string;         // ✅ enum name
  departmentName: string;
  teamLeadId: number | null;
  teamLeadName: string | null;
  active: boolean;
}

const AdminViewDepartments: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { list: users } = useSelector((state: RootState) => state.users);
  // ✅ FIX: Read teamUsers from Redux teams slice for team-member filtering
  const { teamUsers } = useSelector((state: RootState) => state.teams);

  // Teams grouped by department enum value
  const [teamsByDept, setTeamsByDept] = useState<Record<string, Team[]>>({});
  const [loadingTeams, setLoadingTeams] = useState<Record<string, boolean>>({});

  // Team Creation Modal
  const [showTeamCreationModal, setShowTeamCreationModal] = useState(false);
  const [selectedDepartmentForTeam, setSelectedDepartmentForTeam] = useState<string | null>(null);

  // Assign Team Lead Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [overrideLead, setOverrideLead] = useState(false);
  const [isLoadingTeamMembers, setIsLoadingTeamMembers] = useState(false);

  // Load users once
  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  // Load teams for each department enum
  useEffect(() => {
    DEPARTMENT_OPTIONS.forEach((dept) => {
      if (teamsByDept[dept.value] || loadingTeams[dept.value]) return;

      setLoadingTeams((prev) => ({ ...prev, [dept.value]: true }));
      dispatch(fetchTeamsByDepartment(dept.value))
        .unwrap()
        .then((data: any) => {
          const mapped: Team[] = (data || []).map((t: any) => ({
            id: t.teamId,
            name: t.name,
            department: t.department,
            departmentName: t.departmentName || t.department,
            teamLeadId: t.teamLeadId ?? null,
            teamLeadName: t.teamLeadName ?? null,
            active: t.active,
          }));
          setTeamsByDept((prev) => ({ ...prev, [dept.value]: mapped }));
        })
        .catch(() => {
          setTeamsByDept((prev) => ({ ...prev, [dept.value]: [] }));
        })
        .finally(() => {
          setLoadingTeams((prev) => ({ ...prev, [dept.value]: false }));
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const reloadTeamsForDepartment = (deptEnum: string) => {
    dispatch(fetchTeamsByDepartment(deptEnum))
      .unwrap()
      .then((data: any) => {
        const mapped: Team[] = (data || []).map((t: any) => ({
          id: t.teamId,
          name: t.name,
          department: t.department,
          departmentName: t.departmentName || t.department,
          teamLeadId: t.teamLeadId ?? null,
          teamLeadName: t.teamLeadName ?? null,
          active: t.active,
        }));
        setTeamsByDept((prev) => ({ ...prev, [deptEnum]: mapped }));
      })
      .catch(() => {});
  };

  const handleCreateTeam = (deptEnum: string) => {
    setSelectedDepartmentForTeam(deptEnum);
    setShowTeamCreationModal(true);
  };

  const handleViewAllTeams = (deptEnum: string, deptLabel: string) => {
    navigate(
      `/admin/view-teams?department=${encodeURIComponent(deptEnum)}&departmentName=${encodeURIComponent(deptLabel)}`
    );
  };

  // ============================================================
  // ✅ FIXED: Fetch team members when opening assign modal
  // ============================================================
  const openAssignModal = async (team: Team) => {
    setSelectedTeam(team);
    setSelectedEmployeeId('');
    setOverrideLead(!!team.teamLeadId);
    setShowAssignModal(true);

    // ✅ Fetch the team's members from the backend
    setIsLoadingTeamMembers(true);
    try {
      await dispatch(fetchUsersByTeam(team.id)).unwrap();
    } catch (err) {
      console.error('Failed to load team members:', err);
    } finally {
      setIsLoadingTeamMembers(false);
    }
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
    setSelectedTeam(null);
    setSelectedEmployeeId('');
    setIsAssigning(false);
    setOverrideLead(false);
    setIsLoadingTeamMembers(false);
  };

  const handleAssignLead = async () => {
    if (!selectedTeam || !selectedEmployeeId) {
      showToast('Please select an employee', 'warning');
      return;
    }

    setIsAssigning(true);
    try {
      await dispatch(
        assignTeamLead({
          teamId: selectedTeam.id,
          employeeId: Number(selectedEmployeeId),
          override: overrideLead,
        })
      ).unwrap();

      showToast(
        `${overrideLead ? 'Reassigned' : 'Assigned'} team lead to ${selectedTeam.name}!`,
        'success'
      );

      reloadTeamsForDepartment(selectedTeam.department);
      closeAssignModal();
    } catch (err: any) {
      showToast(err || 'Failed to assign team lead', 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  // ============================================================
  // ✅ FIX: Team members come from `teamUsers` (Redux teams slice)
  // These are the users assigned to the clicked team.
  // ============================================================
  const filteredUsers = teamUsers.filter((u) => u.active);

  // Fallback: If `teamUsers` is empty (e.g. API failed), filter from the global
  // `users` list by `teamId` matching the selected team.
  const fallbackUsers = users.filter(
    (u) => u.active && u.teamId === selectedTeam?.id
  );

  const employeeOptions = filteredUsers.length > 0 ? filteredUsers : fallbackUsers;

  return (
    <div className="w-full min-h-0 flex-1 flex flex-col font-sans overflow-hidden bg-gray-50/60 p-0">
      {/* Top Header */}
      <div className="p-4 bg-white border-b border-gray-200 flex flex-wrap items-center justify-between shrink-0 gap-3 shadow-sm mb-4">
        <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#5f41b2]" />
          Departments ({DEPARTMENT_OPTIONS.length})
        </h2>
      </div>

      {/* Departments Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {DEPARTMENT_OPTIONS.map((dept) => {
            const teams = teamsByDept[dept.value] || [];
            const isLoadingTeams = loadingTeams[dept.value] || false;

            return (
              <div
                key={dept.value}
                className="bg-white rounded-[5px] border border-gray-200/80 shadow-xs flex flex-col overflow-hidden"
              >
                {/* Department Header */}
                <div className="p-4 border-b border-gray-100 flex items-start justify-between gap-2 bg-white">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <span className="text-xs font-bold text-[#5f41b2] bg-purple-50 px-2.5 py-1 rounded-[5px] border border-purple-100/60 mt-0.5 shrink-0">
                      {dept.value.slice(0, 3)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3
                        className="font-extrabold text-[#0F172A] text-base tracking-wide uppercase leading-snug truncate"
                        title={dept.label}
                      >
                        {dept.label}
                      </h3>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-200/60 whitespace-nowrap shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Active
                  </span>
                </div>

                {/* Teams Section */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Users className="w-4 h-4 text-[#5f41b2] shrink-0" />
                      <span className="text-xs font-bold text-[#0F172A] tracking-wider uppercase">
                        TEAMS
                      </span>
                      <span className="text-xs font-medium text-gray-400 shrink-0">
                        ({teams.length})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleCreateTeam(dept.value)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#5f41b2] text-white text-xs font-semibold rounded-[5px] hover:bg-[#4e3596] transition shadow-2xs whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Create Team
                      </button>
                      {teams.length > 0 && (
                        <button
                          onClick={() => handleViewAllTeams(dept.value, dept.label)}
                          className="text-xs font-bold text-[#5f41b2] hover:underline whitespace-nowrap"
                        >
                          View All
                        </button>
                      )}
                    </div>
                  </div>

                  {isLoadingTeams ? (
                    <div className="flex items-center justify-center py-6 text-xs text-gray-400 gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#5f41b2]" />
                      <span>Loading teams...</span>
                    </div>
                  ) : teams.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 border border-dashed border-gray-200 rounded-[5px] bg-gray-50/50">
                      <Users className="w-6 h-6 mx-auto opacity-30 mb-1" />
                      <p className="text-xs font-medium">No teams found in this department</p>
                    </div>
                  ) : (
                    <div className="w-full">
                      <table className="w-full text-left text-xs table-fixed">
                        <thead>
                          <tr className="text-[11px] font-bold text-gray-400 uppercase border-b border-gray-100">
                            <th className="pb-2.5 pt-1 w-[12%]">ID</th>
                            <th className="pb-2.5 pt-1 w-[38%] truncate">TEAM NAME</th>
                            <th className="pb-2.5 pt-1 w-[35%] truncate">TEAM LEAD</th>
                            <th className="pb-2.5 pt-1 w-[15%] text-right">ACTION</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {teams.slice(0, 5).map((team) => (
                            <tr key={team.id} className="hover:bg-gray-50/60 transition">
                              <td className="py-2.5 font-bold text-gray-400 whitespace-nowrap">
                                #{team.id}
                              </td>
                              <td
                                className="py-2.5 font-bold text-[#0F172A] truncate"
                                title={team.name}
                              >
                                {team.name}
                              </td>
                              <td className="py-2.5">
                                {team.teamLeadName ? (
                                  <span
                                    className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50/90 px-1.5 py-0.5 rounded-[5px] truncate max-w-full"
                                    title={team.teamLeadName}
                                  >
                                    <UserCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                                    <span className="truncate max-w-[60px] md:max-w-[80px]">
                                      {team.teamLeadName}
                                    </span>
                                    <button
                                      onClick={() => openAssignModal(team)}
                                      className="text-[10px] text-blue-600 hover:underline cursor-pointer font-bold shrink-0 ml-0.5"
                                    >
                                      (Reassign)
                                    </button>
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => openAssignModal(team)}
                                    className="text-[11px] font-bold text-[#5f41b2] hover:underline cursor-pointer whitespace-nowrap"
                                  >
                                    Assign Lead
                                  </button>
                                )}
                              </td>
                              <td className="py-2.5 text-right whitespace-nowrap">
                                <button
                                  onClick={() => navigate(`/admin/view-team-members/${team.id}`)}
                                  className="inline-flex items-center text-[#5f41b2] font-bold hover:underline justify-end w-full"
                                >
                                  View
                                  <ChevronRight className="w-3 h-3 ml-0.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {teams.length > 5 && (
                        <p className="text-[11px] text-gray-400 text-center mt-2 pt-1 border-t border-gray-100">
                          +{teams.length - 5} more teams
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assign / Reassign Team Lead Modal */}
      {showAssignModal && selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-[5px] shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#5f41b2]" />
                {selectedTeam.teamLeadId ? 'Reassign' : 'Assign'} Team Lead
              </h3>
              <button
                onClick={closeAssignModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isAssigning}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">
                  Team: <span className="font-bold text-[#0F172A]">{selectedTeam.name}</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Department: {selectedTeam.departmentName}
                </p>
                {selectedTeam.teamLeadName && (
                  <p className="text-xs text-amber-600 mt-1">
                    Current Lead:{' '}
                    <span className="font-semibold">{selectedTeam.teamLeadName}</span>
                    <span className="text-rose-500 ml-1">(Will be replaced)</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Select Team Member <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) =>
                    setSelectedEmployeeId(e.target.value ? Number(e.target.value) : '')
                  }
                  className="w-full min-h-[48px] px-4 py-2.5 text-sm border border-gray-300 rounded-[5px] focus:outline-none focus:ring-2 focus:ring-[#5f41b2] focus:border-transparent transition-all appearance-none bg-white pr-10"
                  disabled={isAssigning || isLoadingTeamMembers}
                  required
                >
                  <option value="">
                    {isLoadingTeamMembers ? 'Loading team members...' : 'Select an employee...'}
                  </option>
                  {!isLoadingTeamMembers && employeeOptions.length === 0 && (
                    <option value="" disabled>
                      No active employees in this team
                    </option>
                  )}
                  {!isLoadingTeamMembers &&
                    employeeOptions.map((user: any) => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName || ''} ({user.employeeCode})
                      </option>
                    ))}
                </select>
              </div>

              {selectedTeam.teamLeadId && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-[5px]">
                  <input
                    type="checkbox"
                    id="overrideLead"
                    checked={overrideLead}
                    onChange={(e) => setOverrideLead(e.target.checked)}
                    className="w-4 h-4 text-[#5f41b2] focus:ring-[#5f41b2] rounded"
                    disabled={isAssigning}
                  />
                  <label
                    htmlFor="overrideLead"
                    className="text-sm font-medium text-amber-800"
                  >
                    Override existing team lead (force reassign)
                  </label>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeAssignModal}
                  className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-[5px] transition"
                  disabled={isAssigning}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignLead}
                  disabled={isAssigning || !selectedEmployeeId || isLoadingTeamMembers}
                  className="px-4 py-2 flex items-center gap-2 text-sm font-bold bg-[#5f41b2] text-white rounded-[5px] hover:bg-[#4d3396] transition shadow-xs disabled:opacity-50"
                >
                  {isAssigning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {selectedTeam.teamLeadId ? 'Reassigning...' : 'Assigning...'}
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      {selectedTeam.teamLeadId ? 'Reassign Lead' : 'Assign Lead'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Creation Modal */}
      <TeamCreationModal
        isOpen={showTeamCreationModal}
        onClose={() => {
          setShowTeamCreationModal(false);
          setSelectedDepartmentForTeam(null);
        }}
        onSuccess={() => {
          if (selectedDepartmentForTeam) {
            reloadTeamsForDepartment(selectedDepartmentForTeam);
          }
        }}
        preSelectedDepartment={selectedDepartmentForTeam}
      />
    </div>
  );
};

export default AdminViewDepartments;