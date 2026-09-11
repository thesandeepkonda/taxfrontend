// src/features/admin/teams/AdminViewTeams.tsx
import React, { useState, useEffect } from 'react';
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
  // ✅ NEW: Status filter thunk & reset
  fetchTeamsByStatus,
  resetStatusPagination,
  Team,
} from '../../../store/slices/teamsSlice';
import { fetchUsers, User } from '../../../store/slices/usersSlice';
import { fetchDepartments } from '../../../store/slices/departmentsSlice';
import { useToast } from '../../../contexts/ToastContext';
import {
  Users,
  Loader2,
  CheckCircle2,
  XCircle,
  Building2,
  UserCheck,
  Plus,
  Edit,
  X,
  RefreshCw,
  AlertTriangle,
  Eye,
  UserPlus,
  FilterX,
} from 'lucide-react';

const AdminViewTeams: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  // Get query params from URL
  const teamIdParam = searchParams.get('teamId');
  const departmentIdParam = searchParams.get('departmentId');

  // Redux state
  const {
    list: allTeams,               // Normal list (unfiltered)
    loading,
    error,
    teamUsers,
    departmentTeams,
    // ✅ NEW: status filter state
    statusFilteredTeams,
    statusTotal,
    statusPage,
    statusHasMore,
  } = useSelector((state: RootState) => state.teams);

  const { list: departments } = useSelector((state: RootState) => state.departments);
  const { list: allUsers } = useSelector((state: RootState) => state.users);

  // Local state
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAssignLeadModal, setShowAssignLeadModal] = useState(false);

  // Form state
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [formName, setFormName] = useState('');
  const [formDepartmentId, setFormDepartmentId] = useState<number | ''>('');

  // Confirm state
  const [confirmAction, setConfirmAction] = useState<'activate' | 'deactivate' | null>(null);
  const [confirmTeamId, setConfirmTeamId] = useState<number | null>(null);

  // User view state
  const [viewingTeam, setViewingTeam] = useState<Team | null>(null);

  // Assign Lead state
  const [assignTeamId, setAssignTeamId] = useState<number | null>(null);
  const [assignTeamName, setAssignTeamName] = useState('');
  const [assignEmployeeId, setAssignEmployeeId] = useState<number | ''>('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [overrideLead, setOverrideLead] = useState<boolean>(false);

  // ✅ NEW: Status filter state
  const [showActive, setShowActive] = useState(true);

  // Filter & Highlight state
  const [highlightTeamId, setHighlightTeamId] = useState<number | null>(null);
  const [filterDepartmentId, setFilterDepartmentId] = useState<number | null>(null);
  const [isFiltered, setIsFiltered] = useState(false);

  // --------------------------------
  // 1. Load initial data
  // --------------------------------
  useEffect(() => {
    dispatch(fetchDepartments());
    dispatch(fetchUsers());

    return () => {
      dispatch(clearDepartmentTeams());
      dispatch(resetStatusPagination());
    };
  }, [dispatch]);

  // --------------------------------
  // 2. Handle URL params (teamId / departmentId)
  // --------------------------------
  useEffect(() => {
    const teamId = teamIdParam ? parseInt(teamIdParam, 10) : null;
    const deptId = departmentIdParam ? parseInt(departmentIdParam, 10) : null;

    // Priority: If departmentId is present, filter by department
    if (deptId && !isNaN(deptId)) {
      setIsFiltered(true);
      setFilterDepartmentId(deptId);
      dispatch(resetStatusPagination()); // Clear status filter
      dispatch(fetchTeamsByDepartment(deptId));
      return;
    }

    if (teamId && !isNaN(teamId)) {
      setHighlightTeamId(teamId);
      setIsFiltered(true);

      const existingTeam = allTeams.find((t) => t.id === teamId);

      if (existingTeam) {
        setFilterDepartmentId(existingTeam.departmentId);
        dispatch(fetchTeamsByDepartment(existingTeam.departmentId));
      } else {
        dispatch(fetchTeamById(teamId))
          .unwrap()
          .then((team) => {
            setFilterDepartmentId(team.departmentId);
            dispatch(fetchTeamsByDepartment(team.departmentId));
          })
          .catch((err) => {
            showToast(err || 'Team not found', 'error');
            setIsFiltered(false);
            setHighlightTeamId(null);
            setFilterDepartmentId(null);
            // Fallback to status filter (active)
            dispatch(resetStatusPagination());
            dispatch(fetchTeamsByStatus({ active: true, page: 0, size: 10, append: false }));
          });
      }
    } else if (!deptId) {
      // No department filter → use status filter (default: active)
      setIsFiltered(false);
      setHighlightTeamId(null);
      setFilterDepartmentId(null);
      dispatch(resetStatusPagination());
      dispatch(fetchTeamsByStatus({ active: showActive, page: 0, size: 10, append: false }));
    }
  }, [teamIdParam, departmentIdParam, dispatch, showToast, allTeams, showActive]);

  // --------------------------------
  // 3. Determine which teams to display
  // --------------------------------
  const displayedTeams = isFiltered ? departmentTeams : statusFilteredTeams;
  const totalCount = isFiltered ? departmentTeams.length : statusTotal;

  // --------------------------------
  // 4. Load More (infinite scroll)
  // --------------------------------
  const loadMore = () => {
    if (isFiltered || !statusHasMore || loading) return;
    dispatch(fetchTeamsByStatus({
      active: showActive,
      page: statusPage + 1,
      size: 10,
      append: true,
    }));
  };

  // --------------------------------
  // 5. Toggle Active/Inactive
  // --------------------------------
  const handleToggleFilter = (active: boolean) => {
    if (isFiltered) {
      // If department filter is active, clear it first
      setIsFiltered(false);
      setFilterDepartmentId(null);
      setHighlightTeamId(null);
      navigate('/admin/view-teams', { replace: true });
    }
    setShowActive(active);
    dispatch(resetStatusPagination());
    dispatch(fetchTeamsByStatus({ active, page: 0, size: 10, append: false }));
  };

  // --------------------------------
  // 6. Clear filter (reset to status filter)
  // --------------------------------
  const clearFilter = () => {
    setIsFiltered(false);
    setHighlightTeamId(null);
    setFilterDepartmentId(null);
    navigate('/admin/view-teams', { replace: true });
    dispatch(resetStatusPagination());
    dispatch(fetchTeamsByStatus({ active: showActive, page: 0, size: 10, append: false }));
  };

  // --------------------------------
  // 7. Modal / Action Handlers (unchanged)
  // --------------------------------
  const openCreateModal = () => {
    setModalMode('create');
    setSelectedTeam(null);
    setFormName('');
    setFormDepartmentId(filterDepartmentId || '');
    setShowTeamModal(true);
  };

  const openEditModal = (team: Team) => {
    setModalMode('edit');
    setSelectedTeam(team);
    setFormName(team.name);
    setFormDepartmentId(team.departmentId);
    setShowTeamModal(true);
  };

  const closeTeamModal = () => {
    setShowTeamModal(false);
    setSelectedTeam(null);
    setFormName('');
    setFormDepartmentId('');
  };

  const handleSaveTeam = async () => {
    if (!formName.trim() || !formDepartmentId) {
      alert('Please fill in all fields');
      return;
    }
    try {
      if (modalMode === 'create') {
        await dispatch(createTeam({ name: formName.trim(), departmentId: Number(formDepartmentId) })).unwrap();
      } else if (selectedTeam) {
        await dispatch(updateTeam({ id: selectedTeam.id, name: formName.trim(), departmentId: Number(formDepartmentId) })).unwrap();
      }
      closeTeamModal();
      // Refresh current view
      if (isFiltered && filterDepartmentId) {
        dispatch(fetchTeamsByDepartment(filterDepartmentId));
      } else {
        dispatch(resetStatusPagination());
        dispatch(fetchTeamsByStatus({ active: showActive, page: 0, size: 10, append: false }));
      }
    } catch (err) {
      alert('Failed to save team: ' + (err as string));
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
      // Refresh current view
      if (isFiltered && filterDepartmentId) {
        dispatch(fetchTeamsByDepartment(filterDepartmentId));
      } else {
        dispatch(resetStatusPagination());
        dispatch(fetchTeamsByStatus({ active: showActive, page: 0, size: 10, append: false }));
      }
    } catch (err) {
      alert('Failed to perform action: ' + (err as string));
    }
  };

  const handleViewUsers = async (team: Team) => {
    if (!team || !team.id) {
      alert('Invalid team selected');
      return;
    }
    setViewingTeam(team);
    setShowUsersModal(true);
    try {
      await dispatch(fetchUsersByTeam(team.id)).unwrap();
    } catch (err) {
      alert('Failed to fetch team users: ' + (err as string));
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
      // Refresh
      if (isFiltered && filterDepartmentId) {
        dispatch(fetchTeamsByDepartment(filterDepartmentId));
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

  // --------------------------------
  // 8. Render
  // --------------------------------
  const isLoading = loading && displayedTeams.length === 0;
  const hasError = error;
  const noTeams = !isLoading && !hasError && displayedTeams.length === 0;

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden">
      {/* Main Card */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap justify-between items-center shrink-0 bg-gray-50/50 gap-2">
          <h2 className="text-lg font-bold text-[#1b2559] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#5f41b2]" />
            Teams ({totalCount})
            {isFiltered && (
              <span className="text-xs font-normal text-gray-400 ml-2">
                (filtered by department)
              </span>
            )}
          </h2>

          <div className="flex items-center gap-2 flex-wrap">
            {/* ✅ NEW: Active / Inactive Toggle (only when not department-filtered) */}
            {!isFiltered && (
              <div className="flex rounded-lg overflow-hidden border border-gray-200">
                <button
                  onClick={() => handleToggleFilter(true)}
                  className={`px-3 py-1.5 text-xs font-bold transition ${
                    showActive
                      ? 'bg-[#5f41b2] text-white'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => handleToggleFilter(false)}
                  className={`px-3 py-1.5 text-xs font-bold transition ${
                    !showActive
                      ? 'bg-[#5f41b2] text-white'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  Inactive
                </button>
              </div>
            )}

            {/* Clear Filter (when department filter is active) */}
            {isFiltered && (
              <button
                onClick={clearFilter}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-semibold rounded-lg transition shadow-sm"
                title="Show all teams"
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
                {isFiltered
                  ? 'No teams found in this department'
                  : `No ${showActive ? 'active' : 'inactive'} teams found`}
              </p>
              <button onClick={openCreateModal} className="text-[#5f41b2] text-sm underline">
                {isFiltered ? 'Create a team in this department' : 'Create your first team'}
              </button>
            </div>
          ) : (
            <>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[700px]">
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
                      return (
                        <tr
                          key={team.id}
                          className={`transition group ${
                            isHighlighted
                              ? 'bg-blue-100 border-l-4 border-[#5f41b2]'
                              : 'hover:bg-blue-50/30'
                          }`}
                        >
                          <td className="p-3 font-bold text-[#1b2559]">#{team.id}</td>
                          <td className="p-3 font-semibold text-gray-800">{team.name}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5 text-sm text-gray-700">
                              <Building2 className="w-3.5 h-3.5 text-gray-400" />
                              {team.departmentName || '—'}
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
                                title="Edit"
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

              {/* ✅ NEW: Load More (only when status filter is active and more pages exist) */}
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
              {!isFiltered && !statusHasMore && displayedTeams.length > 0 && (
                <div className="text-center text-xs text-gray-400 py-4">
                  No more teams to load.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ======== MODALS (unchanged) ======== */}
      {/* Create/Edit Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
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
                <select
                  value={formDepartmentId}
                  onChange={(e) => setFormDepartmentId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5f41b2] focus:border-transparent"
                >
                  <option value="">Select department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={closeTeamModal} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition">
                Cancel
              </button>
              <button
                onClick={handleSaveTeam}
                disabled={!formName.trim() || !formDepartmentId}
                className="px-4 py-2 text-sm font-semibold text-white bg-[#5f41b2] rounded-lg hover:bg-[#4e3596] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {modalMode === 'create' ? 'Create' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4 text-amber-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-[#1b2559]">Confirm</h3>
            </div>
            <p className="text-gray-700 mb-4">
              Are you sure you want to <span className="font-semibold">{confirmAction === 'activate' ? 'activate' : 'deactivate'}</span> this team?
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowConfirmModal(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition">
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

      {/* View Users Modal */}
      {showUsersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col p-6 animate-in fade-in zoom-in-95 duration-200">
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
                  <thead className="bg-gray-50/80 sticky top-0 z-10">
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
                        <td className="p-2 font-medium text-gray-800">
                          {user.firstName} {user.lastName}
                        </td>
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

      {/* Assign Lead Modal */}
      {showAssignLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
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
              {assignEmployeeId && (
                <span className="block text-xs text-amber-600 mt-1">
                  ⚠️ Current lead will be replaced (override enabled)
                </span>
              )}
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
                  .filter(
                    (u) =>
                      u.active &&
                      u.departmentId ===
                        (isFiltered
                          ? filterDepartmentId
                          : allTeams.find((t) => t.id === assignTeamId)?.departmentId)
                  )
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
                Override existing team lead (force reassign)
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
                className="px-4 py-2 text-sm font-semibold text-white bg-[#5f41b2] rounded-lg hover:bg-[#4e3596] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isAssigning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {assignEmployeeId ? 'Reassigning...' : 'Assigning...'}
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    {assignEmployeeId ? 'Reassign Lead' : 'Assign Lead'}
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