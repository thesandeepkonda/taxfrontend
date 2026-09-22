// src/features/admin/CreateTeam.tsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../../store';
import { createTeam, clearError } from '../../store/slices/teamsSlice';
import { DEPARTMENT_OPTIONS } from '../../constants/enums';
import { useToast } from '../../contexts/ToastContext';
import { Users, Building2, CheckCircle, XCircle, Loader2, ChevronDown, ArrowLeft } from 'lucide-react';

const CreateTeam: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loading, error } = useSelector((state: RootState) => state.teams);
  const { showToast } = useToast();

  const [teamName, setTeamName] = useState('');
  const [department, setDepartment] = useState('');   // ✅ enum string
  const [success, setSuccess] = useState(false);
  const [createdTeam, setCreatedTeam] = useState<any>(null);

  // Read department enum from URL query (?department=DOCUMENTATION)
  useEffect(() => {
    const deptParam = searchParams.get('department');
    if (deptParam && DEPARTMENT_OPTIONS.some((d) => d.value === deptParam)) {
      setDepartment(deptParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teamName.trim() || !department) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    try {
      setSuccess(false);
      dispatch(clearError());

      const payload = {
        name: teamName.trim(),
        department,                                     // ✅ enum string
      };
      console.log('📤 POST /api/teams payload:', payload);  // debug

      const result = await dispatch(createTeam(payload)).unwrap();

      setCreatedTeam(result);
      setSuccess(true);
      showToast(`Team "${result.name}" created successfully!`, 'success');
      setTeamName('');
      setDepartment('');

      setTimeout(() => {
        setSuccess(false);
        setCreatedTeam(null);
      }, 5000);
    } catch (err: any) {
      console.error('❌ createTeam error:', err);
      showToast(err || 'Failed to create team.', 'error');
    }
  };

  return (
    <div className="w-full flex flex-col font-sans overflow-x-hidden gap-y-4">
      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-4 sm:p-6 lg:p-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 text-sm font-semibold text-[#5f41b2] hover:underline flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-emerald-800">
                  Team Created Successfully!
                </h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Team <span className="font-bold">{createdTeam?.name}</span> created with ID: {createdTeam?.id}
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-5 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-bold text-xs text-rose-800">Error</h4>
              <p className="text-xs text-rose-700">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto space-y-4 sm:space-y-6">
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
              Team Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g., Documentation Squad A"
              className="w-full min-h-[44px] px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5f41b2]"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">
              <Building2 className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
              Department <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5f41b2] appearance-none bg-white pr-10"
                disabled={loading}
                required
              >
                <option value="">Select a department...</option>
                {DEPARTMENT_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Preview
            </h4>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#5f41b2]/10 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-[#5f41b2]" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs text-[#1b2559] truncate">
                  {teamName || 'TEAM_NAME'}
                </p>
                {department && (
                  <p className="text-xs text-slate-600 truncate mt-0.5">
                    Department:{' '}
                    {DEPARTMENT_OPTIONS.find((d) => d.value === department)?.label}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setTeamName('');
                setDepartment('');
                dispatch(clearError());
                setSuccess(false);
              }}
              className="min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              disabled={loading}
            >
              Clear Form
            </button>
            <button
              type="submit"
              disabled={loading || !teamName.trim() || !department}
              className="min-h-[44px] flex items-center justify-center gap-2 bg-[#5f41b2] hover:bg-[#4d3396] disabled:opacity-50 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition shadow-sm active:scale-95"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
              <span>Create Team</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTeam;