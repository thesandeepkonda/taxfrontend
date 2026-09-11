// src/features/admin/roles/AdminViewRoles.tsx
// This file combines both:
// 1. Viewing Roles & Assigning Permissions
// 2. Creating new Permissions (inline)

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import {
  fetchRoles,
  fetchRolePermissions,
  assignPermissions,
  Role,
  Permission,
} from '../../../store/slices/rolesSlice';
import {
  fetchPermissions,
  createPermission,
  clearError,
} from '../../../store/slices/permissionSlice';
import { useToast } from '../../../contexts/ToastContext';
import {
  Shield,
  Loader2,
  CheckCircle2,
  XCircle,
  Save,
  RefreshCw,
  AlertTriangle,
  ShieldPlus,
  CheckCircle,
  X,
  AlertCircle,
} from 'lucide-react';

const AdminViewRoles: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();
  const { list: roles, currentPermissions, loading } = useSelector((state: RootState) => state.roles);
  const { list: allPermissions, loading: permissionLoading } = useSelector((state: RootState) => state.permissions);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // ---------- Create Permission States ----------
  const [permCode, setPermCode] = useState('');
  const [permSuccess, setPermSuccess] = useState(false);
  const [createdPermCode, setCreatedPermCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [permError, setPermError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchRoles());
    dispatch(fetchPermissions());
  }, [dispatch]);

  useEffect(() => {
    if (selectedRoleId) {
      setIsFetching(true);
      dispatch(fetchRolePermissions(selectedRoleId))
        .unwrap()
        .then((res: any) => {
          const permIds = res.permissions.map((p: Permission) => p.id);
          setSelectedPermissions(new Set(permIds));
        })
        .catch(() => showToast('Failed to load role permissions', 'error'))
        .finally(() => setIsFetching(false));
    } else {
      setSelectedPermissions(new Set());
    }
  }, [selectedRoleId, dispatch, showToast]);

  const togglePermission = (permId: number) => {
    const newSet = new Set(selectedPermissions);
    if (newSet.has(permId)) {
      newSet.delete(permId);
    } else {
      newSet.add(permId);
    }
    setSelectedPermissions(newSet);
  };

  const handleSavePermissions = async () => {
    if (!selectedRoleId) {
      showToast('Please select a role first', 'warning');
      return;
    }
    setIsSaving(true);
    try {
      await dispatch(assignPermissions({
        roleId: selectedRoleId,
        permissionIds: Array.from(selectedPermissions),
      })).unwrap();
      showToast('Permissions assigned successfully!', 'success');
    } catch (err: any) {
      showToast(err || 'Failed to assign permissions', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedRole = roles.find(r => r.id === selectedRoleId);

  // ---------- Create Permission Handlers ----------
  const handleCreatePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCode = permCode.trim().toUpperCase();
    if (!trimmedCode) {
      setPermError('Permission code is required');
      return;
    }
    if (!/^[A-Z_]+$/.test(trimmedCode)) {
      setPermError('Only uppercase letters and underscores allowed');
      return;
    }
    setPermError(null);
    setIsCreating(true);
    try {
      const result = await dispatch(createPermission({ code: trimmedCode })).unwrap();
      setPermSuccess(true);
      setCreatedPermCode(result.code);
      showToast(`Permission "${result.code}" created successfully!`, 'success');
      setPermCode('');
      // Refresh permissions list
      dispatch(fetchPermissions());
      // If a role is selected, refresh its permissions too
      if (selectedRoleId) {
        dispatch(fetchRolePermissions(selectedRoleId))
          .unwrap()
          .then((res: any) => {
            const permIds = res.permissions.map((p: Permission) => p.id);
            setSelectedPermissions(new Set(permIds));
          })
          .catch(() => {});
      }
      setTimeout(() => setPermSuccess(false), 4000);
    } catch (err: any) {
      showToast(err || 'Failed to create permission', 'error');
      setPermError(err || 'Creation failed');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden">
      <div className="flex items-center justify-between shrink-0 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1b2559] tracking-tight leading-none flex items-center gap-3">
            <Shield className="w-7 h-7 text-[#5f41b2]" />
            Role & Permissions Manager
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Create permissions, view roles, and assign permissions
          </p>
        </div>
        {(loading || permissionLoading) && <Loader2 className="w-5 h-5 text-[#5f41b2] animate-spin" />}
      </div>

      <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
        {/* Left: Roles List */}
        <div className="w-72 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-hidden shrink-0">
          <div className="p-4 border-b border-gray-100 shrink-0">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Roles</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {roles.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-4">No roles found.</p>
            ) : (
              roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-between ${
                    selectedRoleId === role.id
                      ? 'bg-[#5f41b2] text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{role.name}</span>
                  {role.active ? (
                    <CheckCircle2 className={`w-4 h-4 ${selectedRoleId === role.id ? 'text-white' : 'text-emerald-500'}`} />
                  ) : (
                    <XCircle className={`w-4 h-4 ${selectedRoleId === role.id ? 'text-white/60' : 'text-rose-400'}`} />
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Create Permission + Permissions Assignment */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-hidden">
          {/* Create Permission Section */}
          <div className="p-4 border-b border-gray-100 shrink-0 bg-gray-50/50">
            <div className="flex items-center gap-2 mb-2">
              <ShieldPlus className="w-5 h-5 text-[#5f41b2]" />
              <h3 className="text-sm font-bold text-[#1b2559]">Create New Permission</h3>
            </div>
            <form onSubmit={handleCreatePermission} className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-bold text-gray-500 mb-1">Permission Code</label>
                <input
                  type="text"
                  value={permCode}
                  onChange={(e) => setPermCode(e.target.value)}
                  placeholder="e.g., USER_DELETE"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5f41b2] focus:border-transparent text-sm uppercase font-mono"
                  disabled={isCreating}
                />
                {permError && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {permError}
                  </p>
                )}
                {permSuccess && (
                  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Created: <span className="font-mono font-bold">{createdPermCode}</span>
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={isCreating || !permCode.trim()}
                className="min-h-[44px] flex items-center justify-center gap-2 bg-[#5f41b2] hover:bg-[#4e3596] disabled:opacity-50 text-white text-sm font-bold px-5 py-1.5 rounded-lg transition shadow-sm active:scale-95"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <ShieldPlus className="w-4 h-4" />
                    Create Permission
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Permissions Assignment */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="p-4 border-b border-gray-100 shrink-0 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#1b2559]">
                  Permissions
                  {selectedRole && (
                    <span className="ml-2 text-sm font-medium text-gray-500">
                      for <span className="font-bold text-[#1b2559]">{selectedRole.name}</span>
                    </span>
                  )}
                </h2>
                {selectedRole && !selectedRole.active && (
                  <span className="text-xs text-rose-500 font-bold">(Inactive Role)</span>
                )}
              </div>
              {selectedRole && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-400">
                    {selectedPermissions.size} / {allPermissions.length} assigned
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {!selectedRole ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Shield className="w-16 h-16 opacity-20 mb-4" />
                  <p className="text-sm font-semibold">Select a role from the left</p>
                  <p className="text-xs">to view and manage permissions</p>
                </div>
              ) : isFetching ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 text-[#5f41b2] animate-spin" />
                </div>
              ) : allPermissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <p className="text-sm font-semibold">No permissions available</p>
                  <p className="text-xs">Create a new permission using the form above.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                  {allPermissions.map((perm) => (
                    <label
                      key={perm.id}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition ${
                        selectedPermissions.has(perm.id)
                          ? 'border-[#5f41b2] bg-purple-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.has(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                        className="w-4 h-4 accent-[#5f41b2] cursor-pointer shrink-0"
                      />
                      <span className="text-xs font-mono font-medium text-gray-700 truncate">
                        {perm.code}
                      </span>
                      {!perm.active && (
                        <span className="text-[10px] text-rose-500 font-bold ml-auto">(Inactive)</span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 shrink-0 flex justify-end gap-3">
              <button
                onClick={() => {
                  if (selectedRoleId) {
                    setIsFetching(true);
                    dispatch(fetchRolePermissions(selectedRoleId))
                      .unwrap()
                      .then((res: any) => {
                        const permIds = res.permissions.map((p: Permission) => p.id);
                        setSelectedPermissions(new Set(permIds));
                        showToast('Permissions refreshed', 'info');
                      })
                      .catch(() => showToast('Failed to refresh', 'error'))
                      .finally(() => setIsFetching(false));
                  }
                }}
                disabled={!selectedRoleId || isFetching}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                Reset
              </button>
              <button
                onClick={handleSavePermissions}
                disabled={!selectedRoleId || isSaving || isFetching}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#5f41b2] rounded-lg hover:bg-[#4e3596] transition shadow-sm disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminViewRoles;