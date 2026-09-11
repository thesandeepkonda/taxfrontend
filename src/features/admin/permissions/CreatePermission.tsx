// src/features/admin/permissions/CreatePermission.tsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import { createPermission } from '../../../store/slices/permissionSlice';
import { useToast } from '../../../contexts/ToastContext';
import { ShieldPlus, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const CreatePermission: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();
  const { loading } = useSelector((state: RootState) => state.permissions);
  const [code, setCode] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdCode, setCreatedCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) {
      showToast('Permission code is required', 'error');
      return;
    }
    if (!/^[A-Z_]+$/.test(trimmedCode)) {
      showToast('Only uppercase letters and underscores allowed', 'error');
      return;
    }

    try {
      const result = await dispatch(createPermission({ code: trimmedCode })).unwrap();
      setSuccess(true);
      setCreatedCode(result.code);
      showToast(`Permission "${result.code}" created successfully!`, 'success');
      setCode('');
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      showToast(err || 'Failed to create permission', 'error');
    }
  };

  return (
    <div className="w-full flex flex-col font-sans overflow-x-hidden gap-y-4">
      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#5f41b2]/10 flex items-center justify-center text-[#5f41b2]">
            <ShieldPlus className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#1b2559] tracking-tight">Create Permission</h1>
            <p className="text-xs text-gray-500">Add a new permission code for the system</p>
          </div>
        </div>

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 animate-in fade-in">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-sm text-emerald-800">Permission Created!</p>
                <p className="text-xs text-emerald-700">Code: <span className="font-mono font-bold">{createdCode}</span></p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-md space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Permission Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g., USER_DELETE"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5f41b2] focus:border-transparent transition placeholder-gray-400 uppercase font-mono"
              disabled={loading}
            />
            <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Use uppercase letters and underscores only (e.g., <span className="font-mono font-bold">USER_DELETE</span>)
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="min-h-[44px] flex items-center justify-center gap-2 bg-[#5f41b2] hover:bg-[#4e3596] disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl transition shadow-sm active:scale-95 w-full sm:w-auto"
          >
            {loading ? (
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
    </div>
  );
};

export default CreatePermission;