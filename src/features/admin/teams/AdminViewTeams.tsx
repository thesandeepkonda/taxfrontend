// src/features/admin/teams/AdminViewTeams.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../../../store';
import {
  fetchTeams,
  createTeam,
  updateTeam,
  deactivateTeam,
  activateTeam,
  fetchUsersByTeam,
  clearTeamUsers,
  assignTeamLead,
  fetchTeamById,
  fetchTeamsByDepartment,
  clearDepartmentTeams,
  fetchTeamsByStatus,
  resetStatusPagination,
  Team,
} from '../../../store/slices/teamsSlice';
import { fetchUsers, quickAssign } from '../../../store/slices/usersSlice';
import { DEPARTMENT_OPTIONS } from '../../../constants/enums';
import { useToast } from '../../../contexts/ToastContext';
import {
  Users, Loader2, CheckCircle2, XCircle, Building2, UserCheck,
  Plus, Edit, X, RefreshCw, AlertTriangle, Eye, UserPlus,
  UserPlus2, FilterX, Search, ChevronDown,
} from 'lucide-react';

// ============================================================
// ✅ Helper: robust dept resolution for a team
// ============================================================
const extractDept = (team: any): string | null => {
  if (!team) return null;
  const d = team.department || team.departmentName;
  if (!d || d === '—') return null;
  return String(d);
};

const AdminViewTeams: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  const teamIdParam = searchParams.get('teamId');
  const departmentEnumParam = searchParams.get('department');

  const {
    list: allTeams,
    loading,
    error,
    teamUsers,
    departmentTeams,
    statusFilteredTeams,
    statusTotal,
    statusPage,
    statusHasMore,
  } = useSelector((state: RootState) => state.teams);

  const { list: allUsers, loading: usersLoading } = useSelector(
    (state: RootState) => state.users
  );

  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAssignLeadModal, setShowAssignLeadModal] = useState(false);
  const [showAssignEmployeeModal, setShowAssignEmployeeModal] = useState(false);

  const [assignEmployeeTeamId, setAssignEmployeeTeamId] = useState<number | null>(null);
  const [assignEmployeeTeamName, setAssignEmployeeTeamName] = useState('');
  const [assignEmployeeDept, setAssignEmployeeDept] = useState<string | null>(null);
  const [selectedEmpUserId, setSelectedEmpUserId] = useState<number | ''>('');
  const [assignEmpSearch, setAssignEmpSearch] = useState('');
  const [isAssigningEmp, setIsAssigningEmp] = useState(false);

  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [formName, setFormName] = useState('');
  const [formDepartment, setFormDepartment] = useState<string>('');

  const [confirmAction, setConfirmAction] = useState<'activate' | 'deactivate' | null>(null);
  const [confirmTeamId, setConfirmTeamId] = useState<number | null>(null);

  const [viewingTeam, setViewingTeam] = useState<Team | null>(null);

  const [assignTeamId, setAssignTeamId] = useState<number | null>(null);
  const [assignTeamName, setAssignTeamName] = useState('');
  const [assignEmployeeId, setAssignEmployeeId] = useState<number | ''>('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [overrideLead, setOverrideLead] = useState(false);

  const [showActive, setShowActive] = useState(true);

  const [highlightTeamId, setHighlightTeamId] = useState<number | null>(null);
  const [filterDepartment, setFilterDepartment] = useState<string | null>(null);
  const [isFiltered, setIsFiltered] = useState(false);

  // ============================================================
  // Load users + cleanup
  // ============================================================
  useEffect(() => {
    dispatch(fetchUsers());
    return () => {
      dispatch(clearDepartmentTeams());
      dispatch(resetStatusPagination());
    };
  }, [dispatch]);

  // ============================================================
  // URL params
  // ============================================================
  useEffect(() => {
    const teamId = teamIdParam ? parseInt(teamIdParam, 10) : null;
    const deptEnum = departmentEnumParam;

    if (deptEnum) {
      setIsFiltered(true);
      setFilterDepartment(deptEnum);
      dispatch(resetStatusPagination());
      dispatch(fetchTeamsByDepartment(deptEnum));
      return;
    }

    if (teamId && !isNaN(teamId)) {
      setHighlightTeamId(teamId);
      setIsFiltered(true);
      const existingTeam = allTeams.find((t) => t.id === teamId);
      if (existingTeam) {
        setFilterDepartment(existingTeam.department);
        dispatch(fetchTeamsByDepartment(existingTeam.department));
      } else {
        dispatch(fetchTeamById(teamId))
          .unwrap()
          .then((team) => {
            setFilterDepartment(team.department);
            dispatch(fetchTeamsByDepartment(team.department));
          })
          .catch((err) => {
            showToast(err || 'Team not found', 'error');
            setIsFiltered(false);
            setHighlightTeamId(null);
            setFilterDepartment(null);
            dispatch(resetStatusPagination());
            dispatch(fetchTeamsByStatus({ active: true, page: 0, size: 10, append: false }));
          });
      }
    } else if (!deptEnum) {
      setIsFiltered(false);
      setHighlightTeamId(null);
      setFilterDepartment(null);
      dispatch(resetStatusPagination());
      dispatch(fetchTeamsByStatus({ active: showActive, page: 0, size: 10, append: false }));
    }
  }, [teamIdParam, departmentEnumParam, dispatch, showToast, allTeams, showActive]);

  const displayedTeams = isFiltered ? departmentTeams : statusFilteredTeams;
  const totalCount = isFiltered ? departmentTeams.length : statusTotal;

  const loadMore = () => {
    if (isFiltered || !statusHasMore || loading) return;
    dispatch(fetchTeamsByStatus({
      active: showActive,
      page: statusPage + 1,
      size: 10,
      append: true,
    }));
  };

  const handleToggleFilter = (active: boolean) => {
    if (isFiltered) {
      setIsFiltered(false);
      setFilterDepartment(null);
      setHighlightTeamId(null);
      navigate('/admin/view-teams', { replace: true });
    }
    setShowActive(active);
    dispatch(resetStatusPagination());
    dispatch(fetchTeamsByStatus({ active, page: 0, size: 10, append: false }));
  };

  const clearFilter = () => {
    setIsFiltered(false);
    setHighlightTeamId(null);
    setFilterDepartment(null);
    navigate('/admin/view-teams', { replace: true });
    dispatch(resetStatusPagination());
    dispatch(fetchTeamsByStatus({ active: showActive, page: 0, size: 10, append: false }));
  };

  // ============================================================
  // Team modal
  // ============================================================
  const openCreateModal = () => {
    setModalMode('create');
    setSelectedTeam(null);
    setFormName('');
    setFormDepartment(filterDepartment || '');
    setShowTeamModal(true);
  };

  const openEditModal = (team: Team) => {
    setModalMode('edit');
    setSelectedTeam(team);
    setFormName(team.name);
    setFormDepartment(team.department || '');
    setShowTeamModal(true);
  };

  const closeTeamModal = () => {
    setShowTeamModal(false);
    setSelectedTeam(null);
    setFormName('');
    setFormDepartment('');
  };

  const handleSaveTeam = async () => {
    if (!formName.trim() || !formDepartment) {
      showToast('Please fill in all fields', 'warning');
      return;
    }
    try {
      const payload = { name: formName.trim(), department: formDepartment };
      if (modalMode === 'create') {
        await dispatch(createTeam(payload)).unwrap();
        showToast('Team created successfully!', 'success');
      } else if (selectedTeam) {
        await dispatch(updateTeam({ id: selectedTeam.id, ...payload })).unwrap();
        showToast('Team updated successfully!', 'success');
      }
      closeTeamModal();
      if (isFiltered && filterDepartment) {
        dispatch(fetchTeamsByDepartment(filterDepartment));
      } else {
        dispatch(resetStatusPagination());
        dispatch(fetchTeamsByStatus({ active: showActive, page: 0, size: 10, append: false }));
      }
    } catch (err: any) {
      showToast(err || 'Failed to save team', 'error');
    }
  };

  const openConfirm = (teamId: number, action: 'activate' | 'deactivate') => {
    setConfirmTeamId(teamId);
    setConfirmAction(action);
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    if (!confirmTeamId || !confirmAction) return;
    try {
      if (confirmAction === 'activate') {
        await dispatch(activateTeam(confirmTeamId)).unwrap();
      } else {
        await dispatch(deactivateTeam(confirmTeamId)).unwrap();
      }
      setShowConfirmModal(false);
      setConfirmTeamId(null);
      setConfirmAction(null);
      if (isFiltered && filterDepartment) {
        dispatch(fetchTeamsByDepartment(filterDepartment));
      } else {
        dispatch(resetStatusPagination());
        dispatch(fetchTeamsByStatus({ active: showActive, page: 0, size: 10, append: false }));
      }
    } catch (err: any) {
      showToast(err || 'Failed to perform action', 'error');
    }
  };

  const handleViewUsers = async (team: Team) => {
    if (!team || !team.id) return;
    setViewingTeam(team);
    setShowUsersModal(true);
    try {
      await dispatch(fetchUsersByTeam(team.id)).unwrap();
    } catch (err: any) {
      showToast(err || 'Failed to fetch team users', 'error');
    }
  };

  const closeUsersModal = () => {
    setShowUsersModal(false);
    setViewingTeam(null);
    dispatch(clearTeamUsers());
  };

  const openAssignLeadModal = (team: Team) => {
    setAssignTeamId(team.id);
    setAssignTeamName(team.name);
    if (team.teamLeadId) {
      setAssignEmployeeId(team.teamLeadId);
      setOverrideLead(true);
    } else {
      setAssignEmployeeId('');
      setOverrideLead(false);
    }
    setShowAssignLeadModal(true);
  };

  const handleAssignLead = async () => {
    if (!assignTeamId || !assignEmployeeId) {
      showToast('Please select an employee', 'warning');
      return;
    }
    setIsAssigning(true);
    try {
      await dispatch(
        assignTeamLead({
          teamId: assignTeamId,
          employeeId: Number(assignEmployeeId),
          override: overrideLead,
        })
      ).unwrap();
      showToast(`${overrideLead ? 'Reassigned' : 'Assigned'} team lead successfully!`, 'success');
      setShowAssignLeadModal(false);
      setAssignTeamId(null);
      setAssignEmployeeId('');
      setOverrideLead(false);
      if (isFiltered && filterDepartment) {
        dispatch(fetchTeamsByDepartment(filterDepartment));
      } else {
        dispatch(resetStatusPagination());
        dispatch(fetchTeamsByStatus({ active: showActive, page: 0, size: 10, append: false }));
      }
    } catch (err: any) {
      showToast(err || 'Failed to assign team lead', 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  // ============================================================
  // ✅ ASSIGN EXISTING EMPLOYEE
  // ============================================================
  const openAssignEmployeeModal = (team: Team) => {
    console.log('📋 Opening assign employee modal for team:', team);

    setAssignEmployeeTeamId(team.id);
    setAssignEmployeeTeamName(team.name);

    // Try to resolve department from team object itself
    let dept = extractDept(team);

    // If not found, try from stores
    if (!dept) {
      const found =
        allTeams.find((t) => t.id === team.id) ||
        departmentTeams.find((t) => t.id === team.id) ||
        statusFilteredTeams.find((t) => t.id === team.id);
      dept = extractDept(found);
    }

    // Try filter department as last resort
    if (!dept && filterDepartment) dept = filterDepartment;

    console.log('   → resolved dept:', dept);
    setAssignEmployeeDept(dept);
    setSelectedEmpUserId('');
    setAssignEmpSearch('');
    setShowAssignEmployeeModal(true);

    if (allUsers.length === 0) dispatch(fetchUsers());
  };

  const closeAssignEmployeeModal = () => {
    setShowAssignEmployeeModal(false);
    setAssignEmployeeTeamId(null);
    setAssignEmployeeTeamName('');
    setAssignEmployeeDept(null);
    setSelectedEmpUserId('');
    setAssignEmpSearch('');
    setIsAssigningEmp(false);
  };

  const availableEmployees = useMemo(() => {
    if (!assignEmployeeTeamId) return [];
    return allUsers.filter((u) => {
      if (!u.active) return false;
      if (u.teamId === assignEmployeeTeamId) return false;
      return true;
    });
  }, [allUsers, assignEmployeeTeamId]);

  const filteredAvailableEmployees = useMemo(() => {
    const q = assignEmpSearch.toLowerCase().trim();
    if (!q) return availableEmployees;
    return availableEmployees.filter(
      (u) =>
        `${u.firstName} ${u.lastName || ''}`.toLowerCase().includes(q) ||
        u.employeeCode.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.departmentName && u.departmentName.toLowerCase().includes(q)) ||
        (u.teamName && u.teamName.toLowerCase().includes(q))
    );
  }, [availableEmployees, assignEmpSearch]);

  const handleAssignExistingEmployee = async () => {
    if (!selectedEmpUserId) {
      showToast('Please select an employee to assign', 'warning');
      return;
    }
    if (!assignEmployeeTeamId) {
      showToast('Team information missing. Please refresh.', 'error');
      return;
    }

    // ============================================================
    // ✅ ROBUST DEBT RESOLUTION
    // ============================================================
    let dept: string | null = assignEmployeeDept;

    // 1. Try stores
    if (!dept) {
      const found =
        allTeams.find((t) => t.id === assignEmployeeTeamId) ||
        departmentTeams.find((t) => t.id === assignEmployeeTeamId) ||
        statusFilteredTeams.find((t) => t.id === assignEmployeeTeamId);
      dept = extractDept(found);
    }

    // 2. Filter department fallback
    if (!dept && filterDepartment) dept = filterDepartment;

    // 3. ✅ API fallback — guaranteed to work
    if (!dept) {
      try {
        console.log('🌐 Fetching team from API:', assignEmployeeTeamId);
        const res: any = await dispatch(fetchTeamById(assignEmployeeTeamId)).unwrap();
        console.log('🌐 Team API response:', res);
        dept = extractDept(res);
      } catch (e) {
        console.error('Failed to fetch team details:', e);
      }
    }

    console.log('🔍 Final resolved dept:', dept, 'for teamId:', assignEmployeeTeamId);

    if (!dept) {
      showToast(
        'Team department info missing. Please refresh or contact admin.',
        'error'
      );
      return;
    }

    const payload = {
      teamId: assignEmployeeTeamId,
      department: dept,
    };
    console.log('📤 quickAssign payload:', { userId: selectedEmpUserId, data: payload });

    setIsAssigningEmp(true);
    try {
      await dispatch(
        quickAssign({
          userId: Number(selectedEmpUserId),
          data: payload,
        })
      ).unwrap();

      const emp = allUsers.find((u) => u.id === Number(selectedEmpUserId));
      const empName = emp
        ? `${emp.firstName} ${emp.lastName || ''}`.trim()
        : 'Employee';

      showToast(
        `${empName} assigned to ${assignEmployeeTeamName} successfully!`,
        'success'
      );
      closeAssignEmployeeModal();

      if (isFiltered && filterDepartment) {
        dispatch(fetchTeamsByDepartment(filterDepartment));
      } else {
        dispatch(resetStatusPagination());
        dispatch(fetchTeamsByStatus({ active: showActive, page: 0, size: 10, append: false }));
      }
      dispatch(fetchUsers());
    } catch (err: any) {
      showToast(err || 'Failed to assign employee to team', 'error');
    } finally {
      setIsAssigningEmp(false);
    }
  };

  const isLoading = loading && displayedTeams.length === 0;
  const hasError = error;
  const noTeams = !isLoading && !hasError && displayedTeams.length === 0;

  const departmentLabel = (deptEnum?: string | null) =>
    DEPARTMENT_OPTIONS.find((d) => d.value === deptEnum)?.label || deptEnum || '—';

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden">
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap justify-between items-center shrink-0 bg-gray-50/50 gap-2">
          <h2 className="text-lg font-bold text-[#1b2559] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#5f41b2]" />
            Teams ({totalCount})
            {isFiltered && filterDepartment && (
              <span className="text-xs font-medium text-gray-500 ml-2">
                ({departmentLabel(filterDepartment)})
              </span>
            )}
          </h2>

          <div className="flex items-center gap-2 flex-wrap">
            {!isFiltered && (
              <div className="flex rounded-lg overflow-hidden border border-gray-200">
                <button
                  onClick={() => handleToggleFilter(true)}
                  className={`px-3 py-1.5 text-xs font-bold transition ${
                    showActive ? 'bg-[#5f41b2] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => handleToggleFilter(false)}
                  className={`px-3 py-1.5 text-xs font-bold transition ${
                    !showActive ? 'bg-[#5f41b2] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  Inactive
                </button>
              </div>
            )}

            {isFiltered && (
              <button
                onClick={clearFilter}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-semibold rounded-lg transition shadow-sm"
              >
                <FilterX className="w-4 h-4" />
                Clear Filter
              </button>
            )}

            <button
              onClick={openCreateModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5f41b2] text-white text-sm font-semibold rounded-lg hover:bg-[#4e3596] transition shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Team
            </button>

            {loading && <Loader2 className="w-5 h-5 text-[#5f41b2] animate-spin" />}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#5f41b2]" />
              <p className="text-sm font-semibold">Loading teams...</p>
            </div>
          ) : hasError ? (
            <div className="flex flex-col items-center justify-center h-full text-rose-500 gap-2">
              <p className="text-sm font-semibold">Failed to load teams</p>
              <p className="text-xs text-gray-400">{error}</p>
            </div>
          ) : noTeams ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
              <Users className="w-12 h-12 opacity-20" />
              <p className="text-sm font-semibold">
                {isFiltered ? 'No teams found in this department' : `No ${showActive ? 'active' : 'inactive'} teams found`}
              </p>
              <button onClick={openCreateModal} className="text-[#5f41b2] text-sm underline">
                Create a team
              </button>
            </div>
          ) : (
            <>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[800px]">
                  <thead className="bg-gray-50/80 sticky top-0 z-10">
                    <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <th className="p-3 rounded-tl-lg">ID</th>
                      <th className="p-3">Team Name</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Team Lead</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-center rounded-tr-lg">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {displayedTeams.map((team) => {
                      const isHighlighted = highlightTeamId === team.id;
                      const deptForDisplay = extractDept(team) || '';
                      return (
                        <tr
                          key={team.id}
                          className={`transition group ${
                            isHighlighted ? 'bg-blue-100 border-l-4 border-[#5f41b2]' : 'hover:bg-blue-50/30'
                          }`}
                        >
                          <td className="p-3 font-bold text-[#1b2559]">#{team.id}</td>
                          <td className="p-3 font-semibold text-gray-800">{team.name}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5 text-sm text-gray-700">
                              <Building2 className="w-3.5 h-3.5 text-gray-400" />
                              {departmentLabel(deptForDisplay)}
                            </div>
                          </td>
                          <td className="p-3">
                            {team.teamLeadName ? (
                              <div className="flex items-center gap-1.5 text-sm text-gray-700">
                                <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                                {team.teamLeadName}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400 italic">Not assigned</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {team.active ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                <XCircle className="w-3 h-3" /> Inactive
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => openEditModal(team)}
                                className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition"
                                title="Edit Team"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openAssignLeadModal(team)}
                                className="p-1.5 rounded-lg hover:bg-purple-100 text-purple-600 transition"
                                title="Assign Team Lead"
                              >
                                <UserPlus className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openAssignEmployeeModal(team)}
                                className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-600 transition"
                                title="Assign Existing Employee to this Team"
                              >
                                <UserPlus2 className="w-4 h-4" />
                              </button>
                              {team.active ? (
                                <button
                                  onClick={() => openConfirm(team.id, 'deactivate')}
                                  className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600 transition"
                                  title="Deactivate"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => openConfirm(team.id, 'activate')}
                                  className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-600 transition"
                                  title="Activate"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => navigate(`/admin/view-team-members/${team.id}`)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition"
                                title="View Members"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {!isFiltered && statusHasMore && (
                <div className="flex justify-center p-4">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="px-6 py-2 text-sm font-bold text-[#5f41b2] border border-[#5f41b2] rounded-xl hover:bg-[#5f41b2] hover:text-white transition disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
                    Load More
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ======== CREATE/EDIT TEAM MODAL ======== */}
      {showTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#1b2559]">
                {modalMode === 'create' ? 'Create New Team' : 'Edit Team'}
              </h3>
              <button onClick={closeTeamModal} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Team Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5f41b2] focus:border-transparent"
                  placeholder="Enter team name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Department</label>
                <div className="relative">
                  <select
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5f41b2] focus:border-transparent appearance-none bg-white pr-10"
                  >
                    <option value="">Select department</option>
                    {DEPARTMENT_OPTIONS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={closeTeamModal}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTeam}
                disabled={!formName.trim() || !formDepartment}
                className="px-4 py-2 text-sm font-semibold text-white bg-[#5f41b2] rounded-lg hover:bg-[#4e3596] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {modalMode === 'create' ? 'Create' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======== CONFIRM MODAL ======== */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4 text-amber-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-[#1b2559]">Confirm</h3>
            </div>
            <p className="text-gray-700 mb-4">
              Are you sure you want to <span className="font-semibold">{confirmAction}</span> this team?
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
                  confirmAction === 'activate' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======== VIEW USERS MODAL ======== */}
      {showUsersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col p-6">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="text-xl font-bold text-[#1b2559] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#5f41b2]" />
                Team Members: {viewingTeam?.name}
              </h3>
              <button onClick={closeUsersModal} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {teamUsers.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No active users in this team.</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50/80 sticky top-0">
                    <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <th className="p-2">Employee Code</th>
                      <th className="p-2">Name</th>
                      <th className="p-2">Email</th>
                      <th className="p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {teamUsers.map((user) => (
                      <tr key={user.employeeCode}>
                        <td className="p-2 font-mono text-xs text-gray-600">{user.employeeCode}</td>
                        <td className="p-2 font-medium text-gray-800">{user.firstName} {user.lastName}</td>
                        <td className="p-2 text-gray-600">{user.email}</td>
                        <td className="p-2 text-center">
                          {user.active ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                              <CheckCircle2 className="w-3 h-3" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                              <XCircle className="w-3 h-3" /> Inactive
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======== ASSIGN LEAD MODAL ======== */}
      {showAssignLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#1b2559] flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#5f41b2]" />
                {assignEmployeeId ? 'Reassign' : 'Assign'} Team Lead
              </h3>
              <button
                onClick={() => {
                  setShowAssignLeadModal(false);
                  setAssignTeamId(null);
                  setAssignEmployeeId('');
                  setOverrideLead(false);
                }}
                className="p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Team: <strong>{assignTeamName}</strong>
            </p>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Employee</label>
              <select
                value={assignEmployeeId}
                onChange={(e) => setAssignEmployeeId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5f41b2] focus:outline-none bg-white"
              >
                <option value="">Select an employee...</option>
                {allUsers
                  .filter((u) => u.active && u.department === filterDepartment)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName || ''} ({u.employeeCode})
                    </option>
                  ))}
              </select>
            </div>

            <div className="mb-4 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <input
                type="checkbox"
                id="overrideLead"
                checked={overrideLead}
                onChange={(e) => setOverrideLead(e.target.checked)}
                className="w-4 h-4 text-[#5f41b2] focus:ring-[#5f41b2] rounded"
                disabled={isAssigning}
              />
              <label htmlFor="overrideLead" className="text-sm font-medium text-amber-800">
                Override existing team lead
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowAssignLeadModal(false);
                  setAssignTeamId(null);
                  setAssignEmployeeId('');
                  setOverrideLead(false);
                }}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition"
                disabled={isAssigning}
              >
                Cancel
              </button>
              <button
                onClick={handleAssignLead}
                disabled={isAssigning || !assignEmployeeId}
                className="px-4 py-2 text-sm font-semibold text-white bg-[#5f41b2] rounded-lg hover:bg-[#4e3596] transition disabled:opacity-50 flex items-center gap-2"
              >
                {isAssigning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    Assign
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======== ASSIGN EXISTING EMPLOYEE MODAL ======== */}
      {showAssignEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <UserPlus2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1b2559]">Assign Existing Employee</h3>
                  <p className="text-xs text-slate-500">
                    Add an employee to <span className="font-bold text-[#5f41b2]">{assignEmployeeTeamName}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={closeAssignEmployeeModal}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                disabled={isAssigningEmp}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={assignEmpSearch}
                  onChange={(e) => setAssignEmpSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
              </div>

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
                    <p className="text-sm font-semibold">No matching employees found</p>
                  </div>
                ) : (
                  <div className="max-h-[380px] overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                    {filteredAvailableEmployees.map((emp) => {
                      const isSelected = selectedEmpUserId === emp.id;
                      const fullName = `${emp.firstName} ${emp.lastName || ''}`.trim();
                      return (
                        <button
                          type="button"
                          key={emp.id}
                          onClick={() => setSelectedEmpUserId(emp.id)}
                          disabled={isAssigningEmp}
                          className={`w-full text-left p-3.5 flex items-center justify-between gap-3 transition ${
                            isSelected
                              ? 'bg-emerald-50 border-l-4 border-l-emerald-600'
                              : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center font-extrabold text-sm shrink-0 border ${
                                isSelected
                                  ? 'bg-emerald-600 text-white border-emerald-700'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {emp.firstName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-[#0F172A] text-sm truncate">{fullName}</p>
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
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={closeAssignEmployeeModal}
                disabled={isAssigningEmp}
                className="min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignExistingEmployee}
                disabled={isAssigningEmp || !selectedEmpUserId}
                className="min-h-[44px] flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAssigningEmp ? (
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

export default AdminViewTeams;