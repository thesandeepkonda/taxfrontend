// src/features/admin/teams/AdminViewDepartments.tsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import {
  fetchDepartmentsByStatus,
  updateDepartment,
  activateDepartment,
  deactivateDepartment,
  Department,
  resetStatusPagination,
} from '../../../store/slices/departmentsSlice';
import {
  fetchTeamsByDepartment,
  assignTeamLead,
} from '../../../store/slices/teamsSlice';
import { fetchUsers } from '../../../store/slices/usersSlice';
import { useToast } from '../../../contexts/ToastContext';
import {
  Building2,
  Loader2,
  CheckCircle2,
  XCircle,
  Pencil,
  X,
  Save,
  AlertCircle,
  Power,
  PowerOff,
  Users,
  Plus,
  UserCheck,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Modals
import TeamCreationModal from '../resueables/TeamCreationModal';
import CreateDepartmentModal from '../resueables/CreateDepartmentModal';

interface Team {
  id: number;
  name: string;
  departmentId: number;
  departmentName: string;
  teamLeadId: number | null;
  teamLeadName: string | null;
  active: boolean;
}

const mapTeam = (apiTeam: any): Team => ({
  id: apiTeam.teamId,
  name: apiTeam.name,
  departmentId: apiTeam.departmentId,
  departmentName: apiTeam.departmentName,
  teamLeadId: apiTeam.teamLeadId ?? null,
  teamLeadName: apiTeam.teamLeadName ?? null,
  active: apiTeam.active,
});

const AdminViewDepartments: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const {
    statusFilteredDepartments: departments,
    statusTotal,
    statusPage,
    statusHasMore,
    loading,
    error,
  } = useSelector((state: RootState) => state.departments);

  const { list: users } = useSelector((state: RootState) => state.users);

  // Filter state
  const [showActive, setShowActive] = useState(true);

  // Edit Modal States
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Toggle status loading
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Store teams mapped directly by Department ID
  const [teamsByDept, setTeamsByDept] = useState<Record<number, Team[]>>({});
  const [loadingTeams, setLoadingTeams] = useState<Record<number, boolean>>({});

  // Assign Team Lead Modal States
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [overrideLead, setOverrideLead] = useState(false);

  // Team Creation Modal State
  const [showTeamCreationModal, setShowTeamCreationModal] = useState(false);
  const [selectedDepartmentIdForTeam, setSelectedDepartmentIdForTeam] = useState<number | null>(null);

  // Department Creation Modal State
  const [showDepartmentCreationModal, setShowDepartmentCreationModal] = useState(false);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    dispatch(resetStatusPagination());
    dispatch(fetchDepartmentsByStatus({ active: showActive, page: 0, size: 10, append: false }));
  }, [dispatch, showActive]);

  useEffect(() => {
    departments.forEach((dept) => {
      if (!teamsByDept[dept.id] && !loadingTeams[dept.id]) {
        setLoadingTeams((prev) => ({ ...prev, [dept.id]: true }));
        dispatch(fetchTeamsByDepartment(dept.id))
          .unwrap()
          .then((data) => {
            const mappedTeams = data.map(mapTeam);
            setTeamsByDept((prev) => ({ ...prev, [dept.id]: mappedTeams }));
          })
          .catch((err) => {
            showToast(err || 'Failed to load teams', 'error');
          })
          .finally(() => {
            setLoadingTeams((prev) => ({ ...prev, [dept.id]: false }));
          });
      }
    });
  }, [departments, dispatch]);

  const loadMore = () => {
    if (!statusHasMore || loading) return;
    dispatch(
      fetchDepartmentsByStatus({
        active: showActive,
        page: statusPage + 1,
        size: 10,
        append: true,
      })
    );
  };

  const openEditModal = (dept: Department) => {
    setEditDept(dept);
    setEditName(dept.name);
    setEditDescription(dept.description || '');
    setEditError(null);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditDept(null);
    setEditName('');
    setEditDescription('');
    setEditError(null);
    setIsSubmitting(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDept) return;
    if (!editName.trim()) {
      setEditError('Department name is required');
      return;
    }

    setIsSubmitting(true);
    setEditError(null);

    try {
      const result = await dispatch(
        updateDepartment({
          id: editDept.id,
          data: {
            name: editName.trim(),
            description: editDescription.trim() || null,
          },
        })
      ).unwrap();

      showToast(`Department "${result.name}" updated successfully!`, 'success');
      dispatch(
        fetchDepartmentsByStatus({
          active: showActive,
          page: statusPage,
          size: 10,
          append: false,
        })
      );
      closeEditModal();
    } catch (err: any) {
      const msg = err || 'Failed to update department. Please try again.';
      setEditError(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (dept: Department) => {
    const action = dept.active ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} department "${dept.name}"?`)) return;

    setTogglingId(dept.id);

    try {
      if (dept.active) {
        await dispatch(deactivateDepartment(dept.id)).unwrap();
        showToast(`Department "${dept.name}" deactivated successfully.`, 'info');
      } else {
        await dispatch(activateDepartment(dept.id)).unwrap();
        showToast(`Department "${dept.name}" activated successfully.`, 'success');
      }
      dispatch(
        fetchDepartmentsByStatus({
          active: showActive,
          page: statusPage,
          size: 10,
          append: false,
        })
      );
    } catch (err: any) {
      showToast(err || `Failed to ${action} department.`, 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleCreateTeam = (deptId: number) => {
    setSelectedDepartmentIdForTeam(deptId);
    setShowTeamCreationModal(true);
  };

  const handleViewAllTeams = (deptId: number, deptName: string) => {
    navigate(`/admin/view-teams?departmentId=${deptId}&departmentName=${encodeURIComponent(deptName)}`);
  };

  const openAssignModal = (team: Team) => {
    setSelectedTeam(team);
    setSelectedEmployeeId('');
    setOverrideLead(!!team.teamLeadId);
    setShowAssignModal(true);
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
    setSelectedTeam(null);
    setSelectedEmployeeId('');
    setIsAssigning(false);
    setOverrideLead(false);
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

      const action = overrideLead ? 'Reassigned' : 'Assigned';
      showToast(`${action} team lead successfully to ${selectedTeam.name}!`, 'success');

      dispatch(fetchTeamsByDepartment(selectedTeam.departmentId))
        .unwrap()
        .then((data) => {
          const mappedTeams = data.map(mapTeam);
          setTeamsByDept((prev) => ({ ...prev, [selectedTeam.departmentId]: mappedTeams }));
        })
        .catch(() => {});

      closeAssignModal();
    } catch (err: any) {
      showToast(err || 'Failed to assign team lead', 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  const filteredUsers = users.filter(
    (u) => u.active && u.departmentId === selectedTeam?.departmentId
  );

  return (
    <div className="w-full min-h-0 flex-1 flex flex-col font-sans overflow-hidden bg-gray-50/60 p-0">
      {/* Top Header */}
      <div className="p-4 bg-white border-b border-gray-200 flex flex-wrap items-center justify-between shrink-0 gap-3 shadow-sm mb-4">
        <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#5f41b2]" />
          Departments ({statusTotal})
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDepartmentCreationModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-[5px] transition shadow-xs active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Create Department
          </button>

          <div className="flex rounded-[5px] overflow-hidden border border-gray-300">
            <button
              onClick={() => {
                if (!showActive) {
                  setShowActive(true);
                  dispatch(resetStatusPagination());
                  dispatch(
                    fetchDepartmentsByStatus({ active: true, page: 0, size: 10, append: false })
                  );
                }
              }}
              className={`px-3 py-1.5 text-xs font-bold transition ${
                showActive ? 'bg-[#5f41b2] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => {
                if (showActive) {
                  setShowActive(false);
                  dispatch(resetStatusPagination());
                  dispatch(
                    fetchDepartmentsByStatus({ active: false, page: 0, size: 10, append: false })
                  );
                }
              }}
              className={`px-3 py-1.5 text-xs font-bold transition ${
                !showActive ? 'bg-[#5f41b2] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Inactive
            </button>
          </div>
          {loading && <Loader2 className="w-5 h-5 text-[#5f41b2] animate-spin" />}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4">
        {loading && departments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3 py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#5f41b2]" />
            <p className="text-sm font-semibold">Loading departments...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-rose-500 gap-2 py-12">
            <p className="text-sm font-semibold">Failed to load departments</p>
            <p className="text-xs text-gray-400">{error}</p>
          </div>
        ) : departments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 py-12">
            <Building2 className="w-12 h-12 opacity-20" />
            <p className="text-sm font-semibold">
              No {showActive ? 'active' : 'inactive'} departments found
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Box-shaped Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 pb-4">
              {departments.map((dept) => {
                const isToggling = togglingId === dept.id;
                const teams = teamsByDept[dept.id] || [];
                const isLoadingTeams = loadingTeams[dept.id] || false;

                return (
                  <div
                    key={dept.id}
                    className="bg-white rounded-[5px] border border-gray-200/80 shadow-xs flex flex-col overflow-hidden"
                  >
                    {/* Department Header */}
                    <div className="p-4 border-b border-gray-100 flex items-start justify-between gap-2 bg-white">
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <span className="text-xs font-bold text-[#5f41b2] bg-purple-50 px-2.5 py-1 rounded-[5px] border border-purple-100/60 mt-0.5 shrink-0">
                          #{dept.id}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-extrabold text-[#0F172A] text-base tracking-wide uppercase leading-snug truncate" title={dept.name}>
                            {dept.name}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1 font-normal truncate" title={dept.description || ''}>
                            {dept.description || <span className="italic opacity-60">No description</span>}
                          </p>
                        </div>
                      </div>

                      {/* Action Icons Section */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {dept.active ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-200/60 whitespace-nowrap">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-600 border border-rose-200/60 whitespace-nowrap">
                            <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" /> Inactive
                          </span>
                        )}

                        <button
                          onClick={() => openEditModal(dept)}
                          className="p-1.5 rounded-[5px] text-gray-400 hover:text-blue-600 hover:bg-gray-100 transition-colors shrink-0"
                          title="Edit Department"
                          disabled={isToggling}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(dept)}
                          className={`p-1.5 rounded-[5px] transition-colors shrink-0 ${
                            dept.active
                              ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'
                              : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                          }`}
                          title={dept.active ? 'Deactivate' : 'Activate'}
                          disabled={isToggling}
                        >
                          {isToggling ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : dept.active ? (
                            <PowerOff className="w-4 h-4" />
                          ) : (
                            <Power className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Card Body & Teams Table */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      {/* Sub-header inside Card with Just "TEAMS" Label */}
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
                            onClick={() => handleCreateTeam(dept.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#5f41b2] text-white text-xs font-semibold rounded-[5px] hover:bg-[#4e3596] transition shadow-2xs whitespace-nowrap"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Create Team
                          </button>
                          {teams.length > 0 && (
                            <button
                              onClick={() => handleViewAllTeams(dept.id, dept.name)}
                              className="text-xs font-bold text-[#5f41b2] hover:underline whitespace-nowrap"
                            >
                              View All
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Teams Data Table (Scroll removed from inner table) */}
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
                                  <td className="py-2.5 font-bold text-gray-400 whitespace-nowrap">#{team.id}</td>
                                  <td className="py-2.5 font-bold text-[#0F172A] truncate" title={team.name}>{team.name}</td>
                                  <td className="py-2.5">
                                    {team.teamLeadName ? (
                                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50/90 px-1.5 py-0.5 rounded-[5px] truncate max-w-full" title={team.teamLeadName}>
                                        <UserCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                                        <span className="truncate max-w-[60px] md:max-w-[80px]">{team.teamLeadName}</span>
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

            {/* Load More Button */}
            {statusHasMore && (
              <div className="flex justify-center pb-6 pt-2">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-6 py-2 text-sm font-bold text-[#5f41b2] border border-[#5f41b2] rounded-[5px] hover:bg-[#5f41b2] hover:text-white transition disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
                  Load More Departments
                </button>
              </div>
            )}
            {!statusHasMore && departments.length > 0 && (
              <div className="text-center text-xs text-gray-400 pb-6 pt-2">
                No more departments to load.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-[5px] shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#5f41b2]" />
                Edit Department
              </h3>
              <button
                onClick={closeEditModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isSubmitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-[5px] flex items-start gap-2 text-sm text-rose-700">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1" htmlFor="editName">
                  Department Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="editName"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-[5px] focus:outline-none focus:ring-2 focus:ring-[#5f41b2] focus:border-transparent transition-all"
                  placeholder="Enter department name"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1" htmlFor="editDescription">
                  Description <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  id="editDescription"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-[5px] focus:outline-none focus:ring-2 focus:ring-[#5f41b2] text-sm resize-none"
                  placeholder="Brief description of the department"
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-[5px] transition"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !editName.trim()}
                  className="px-4 py-2 flex items-center gap-2 text-sm font-bold bg-[#5f41b2] text-white rounded-[5px] hover:bg-[#4d3396] transition shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                    Current Lead: <span className="font-semibold">{selectedTeam.teamLeadName}</span>
                    <span className="text-rose-500 ml-1">(Will be replaced)</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Select Employee <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full min-h-[48px] px-4 py-2.5 text-sm border border-gray-300 rounded-[5px] focus:outline-none focus:ring-2 focus:ring-[#5f41b2] focus:border-transparent transition-all appearance-none bg-white pr-10"
                  disabled={isAssigning}
                  required
                >
                  <option value="">Select an employee...</option>
                  {filteredUsers.length === 0 ? (
                    <option value="" disabled>No active employees in this department</option>
                  ) : (
                    filteredUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName || ''} ({user.employeeCode})
                      </option>
                    ))
                  )}
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
                  <label htmlFor="overrideLead" className="text-sm font-medium text-amber-800">
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
                  disabled={isAssigning || !selectedEmployeeId}
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
          setSelectedDepartmentIdForTeam(null);
        }}
        onSuccess={() => {
          dispatch(
            fetchDepartmentsByStatus({
              active: showActive,
              page: statusPage,
              size: 10,
              append: false,
            })
          );
          if (selectedDepartmentIdForTeam) {
            dispatch(fetchTeamsByDepartment(selectedDepartmentIdForTeam))
              .unwrap()
              .then((data) => {
                const mappedTeams = data.map(mapTeam);
                setTeamsByDept((prev) => ({
                  ...prev,
                  [selectedDepartmentIdForTeam]: mappedTeams,
                }));
              })
              .catch(() => {});
          }
        }}
        preSelectedDepartmentId={selectedDepartmentIdForTeam}
      />

      {/* Department Creation Modal */}
      <CreateDepartmentModal
        isOpen={showDepartmentCreationModal}
        onClose={() => {
          setShowDepartmentCreationModal(false);
        }}
        onSuccess={() => {
          dispatch(
            fetchDepartmentsByStatus({
              active: showActive,
              page: 0,
              size: 10,
              append: false,
            })
          );
          showToast('Department list refreshed!', 'success');
        }}
      />
    </div>
  );
};

export default AdminViewDepartments;