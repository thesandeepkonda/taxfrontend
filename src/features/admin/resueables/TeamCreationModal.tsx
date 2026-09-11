// src/features/admin/reusables/TeamCreationModal.tsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import { createTeam, clearError } from '../../../store/slices/teamsSlice';
import { fetchDepartments } from '../../../store/slices/departmentsSlice';
import { useToast } from '../../../contexts/ToastContext';
import { Users, Building2, CheckCircle, XCircle, Loader2, ChevronDown, X } from 'lucide-react';

interface TeamCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preSelectedDepartmentId?: number | null;
}

const TeamCreationModal: React.FC<TeamCreationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preSelectedDepartmentId = null,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();
  
  const { loading, error } = useSelector((state: RootState) => state.teams);
  const { list: departments, loading: deptLoading } = useSelector((state: RootState) => state.departments);
  
  const [teamName, setTeamName] = useState('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [createdTeam, setCreatedTeam] = useState<any>(null);

  // Reset form when modal opens or preSelectedDepartmentId changes
  useEffect(() => {
    if (isOpen) {
      if (preSelectedDepartmentId) {
        setDepartmentId(String(preSelectedDepartmentId));
      } else {
        setDepartmentId('');
      }
      setTeamName('');
      setSuccess(false);
      setCreatedTeam(null);
      dispatch(clearError());
    }
  }, [isOpen, preSelectedDepartmentId, dispatch]);

  // Fetch departments if not loaded
  useEffect(() => {
    if (isOpen && departments.length === 0) {
      dispatch(fetchDepartments());
    }
  }, [isOpen, dispatch, departments.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !departmentId) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    try {
      setSuccess(false);
      dispatch(clearError());

      const result = await dispatch(createTeam({
        name: teamName.trim(),
        departmentId: Number(departmentId),
      })).unwrap();

      setCreatedTeam(result);
      setSuccess(true);
      showToast(`Team "${result.name}" created successfully!`, 'success');
      
      setTeamName('');
      setDepartmentId(preSelectedDepartmentId ? String(preSelectedDepartmentId) : '');
      
      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        setSuccess(false);
        setCreatedTeam(null);
      }, 5000);
    } catch (err: any) {
      const errorMsg = typeof err === 'string' ? err : err?.message || 'Failed to create team.';
      showToast(errorMsg, 'error');
    }
  };

  const handleClose = () => {
    setTeamName('');
    setDepartmentId('');
    setSuccess(false);
    setCreatedTeam(null);
    dispatch(clearError());
    onClose();
  };

  const selectedDept = departments.find(d => String(d.id) === departmentId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-100">
        
        {/* Modal Header */}
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-slate-100 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#5f41b2]/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#5f41b2]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1b2559]">Create New Team</h3>
              <p className="text-xs text-slate-500">Add a new team to your organization</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {deptLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#5f41b2] animate-spin mb-2" />
              <p className="text-xs text-slate-500 font-medium">Loading departments...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              
              {success && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 animate-in fade-in">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-emerald-800">Team Created Successfully!</h4>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        Team <span className="font-bold">{createdTeam?.name}</span> created with ID: {createdTeam?.id}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 animate-in fade-in">
                  <XCircle className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm text-rose-800">Error</h4>
                    <p className="text-xs text-rose-700">{error}</p>
                  </div>
                </div>
              )}

              {/* Team Name Input */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5" htmlFor="teamNameInput">
                  Team Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="teamNameInput"
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g., Documentation Squad A"
                  className="w-full min-h-[44px] px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5f41b2] placeholder-slate-400"
                  disabled={loading}
                  required
                  autoFocus
                />
              </div>

              {/* Department Select */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5" htmlFor="teamDeptSelect">
                  <Building2 className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                  Department <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="teamDeptSelect"
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5f41b2] appearance-none bg-white pr-10"
                    disabled={loading || departments.length === 0}
                    required
                  >
                    <option value="">Select a department...</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} (ID: {dept.id})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 pointer-events-none" />
                </div>
                {selectedDept && preSelectedDepartmentId && (
                  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Auto-selected from department page
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClose}
                  className="min-h-[44px] px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition text-center"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !teamName.trim() || !departmentId}
                  className="min-h-[44px] flex items-center justify-center gap-2 bg-[#5f41b2] hover:bg-[#4d3396] disabled:opacity-50 text-white text-xs sm:text-sm font-bold px-6 py-2.5 rounded-xl transition shadow-sm active:scale-95"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                  <span>Create Team</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamCreationModal;