// src/features/admin/resueables/CreateRoleModal.tsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import { createRole, clearError } from '../../../store/slices/rolesSlice';
import { useToast } from '../../../contexts/ToastContext';
import { Shield, ChevronDown, Loader2, XCircle, CheckCircle, X } from 'lucide-react';

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CreateRoleModal: React.FC<CreateRoleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();
  
  const { loading, error } = useSelector((state: RootState) => state.roles);
  
  const [roleName, setRoleName] = useState('');
  const [description, setDescription] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdRole, setCreatedRole] = useState<any>(null);

  const roleOptions = [
    { value: 'TEAM_LEAD', label: 'TEAM_LEAD - Team Lead' },
    { value: 'EMPLOYEE', label: 'EMPLOYEE - Regular Employee' },
  ];

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setRoleName('');
      setDescription('');
      setSuccess(false);
      setCreatedRole(null);
      dispatch(clearError());
    }
  }, [isOpen, dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      showToast('Role name is required', 'error');
      return;
    }

    try {
      setSuccess(false);
      dispatch(clearError());

      const result = await dispatch(createRole({
        name: roleName.trim().toUpperCase(),
        description: description.trim() || null,
      })).unwrap();

      setCreatedRole(result);
      setSuccess(true);
      showToast(`Role "${result.name}" created successfully!`, 'success');
      
      setRoleName('');
      setDescription('');
      
      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        setSuccess(false);
        setCreatedRole(null);
      }, 5000);
    } catch (err: any) {
      const errorMsg = typeof err === 'string' ? err : err?.message || 'Failed to create role.';
      showToast(errorMsg, 'error');
    }
  };

  const handleClose = () => {
    setRoleName('');
    setDescription('');
    setSuccess(false);
    setCreatedRole(null);
    dispatch(clearError());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-100">
        
        {/* Modal Header */}
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-slate-100 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#5f41b2]/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#5f41b2]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1b2559]">Create New Role</h3>
              <p className="text-xs text-slate-500">Add a new role to the system</p>
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
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            
            {success && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 animate-in fade-in">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-800">Role Created Successfully!</h4>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Role <span className="font-bold">{createdRole?.name}</span> created with ID: {createdRole?.id}
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

            {/* Role Name Dropdown */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5" htmlFor="roleSelect">
                Role Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="roleSelect"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5f41b2] appearance-none bg-white pr-10"
                  disabled={loading}
                  required
                  autoFocus
                >
                  <option value="">Select a role...</option>
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Description Textarea */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5" htmlFor="roleDesc">
                Description <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                id="roleDesc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this role's permissions"
                rows={3}
                className="w-full p-3 sm:p-4 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5f41b2] placeholder-slate-400 resize-none"
                disabled={loading}
              />
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
                disabled={loading || !roleName.trim()}
                className="min-h-[44px] flex items-center justify-center gap-2 bg-[#5f41b2] hover:bg-[#4d3396] disabled:opacity-50 text-white text-xs sm:text-sm font-bold px-6 py-2.5 rounded-xl transition shadow-sm active:scale-95"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                <span>Create Role</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateRoleModal;