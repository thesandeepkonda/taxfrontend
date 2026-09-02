// src/features/admin/teams/AdminPreparationTeam.tsx
import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import { fetchTeamsByDepartment, clearDepartmentTeams } from '../../../store/slices/teamsSlice';
import { 
  FileText, 
  UserCheck, 
  UserX, 
  Building2, 
  Loader2, 
  CheckCircle2, 
  RotateCcw,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';

const AdminPreparationTeam: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  const { departmentTeams, loading, error } = useSelector((state: RootState) => state.teams);
  
  const depID = searchParams.get('depID');
  const departmentId = depID ? parseInt(depID, 10) : null;

  useEffect(() => {
    if (departmentId) {
      dispatch(fetchTeamsByDepartment(departmentId));
    }

    return () => {
      dispatch(clearDepartmentTeams());
    };
  }, [dispatch, departmentId]);

  const handleCardClick = (team: any) => {
    navigate(
      `/admin/preparationteam/${team.teamId || team.id}?teamName=${encodeURIComponent(team.name)}&teamLead=${encodeURIComponent(team.teamLeadName || 'Not Assigned')}&rating=8`
    );
  };

  // Loading State
  if (loading) {
    return (
      <div className="w-full h-72 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-100 shadow-xs">
        <Loader2 className="w-8 h-8 text-[#5f41b2] animate-spin mb-2" />
        <p className="text-xs font-bold text-slate-700">Loading Preparation Teams...</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Fetching latest squads from database</p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="w-full bg-white rounded-2xl shadow-xs border border-slate-100 p-5 sm:p-6">
        <div className="flex items-start gap-3.5 p-4 bg-rose-50/80 border border-rose-200 rounded-xl">
          <ShieldAlert className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <h4 className="font-bold text-sm text-rose-900">Failed to load preparation squads</h4>
            <p className="text-xs text-rose-700 mt-0.5">{error}</p>
            <button 
              onClick={() => departmentId && dispatch(fetchTeamsByDepartment(departmentId))}
              className="mt-2.5 inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-xs cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-3 h-3" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty State
  if (departmentTeams.length === 0 && !loading) {
    return (
      <div className="w-full bg-white rounded-2xl shadow-xs border border-slate-100 p-6 sm:p-8 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 mb-3 border border-slate-100">
          <FileText className="w-6 h-6 opacity-60" />
        </div>
        <h3 className="text-base font-bold text-[#1b2559]">No Preparation Teams Found</h3>
        <p className="text-xs text-slate-400 max-w-xs mt-1">
          There are no squads registered under this department.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full font-sans overflow-x-hidden">
      {/* RESPONSIVE SQUAD CARDS GRID - DIRECT TOP START */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        {departmentTeams.map((team) => {
          const hasLead = Boolean(team.teamLeadName);
          
          return (
            <div
              key={team.teamId || team.id}
              onClick={() => handleCardClick(team)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleCardClick(team)}
              className="group bg-white rounded-2xl border border-slate-200 hover:border-[#5f41b2]/50 shadow-xs hover:shadow-md transition-all duration-150 flex flex-col cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#5f41b2] opacity-0 group-hover:opacity-100 transition-opacity z-10" />

              {/* VISUAL TOP BLOCK */}
              <div className="relative w-full h-28 bg-[#F5F4F2] flex items-center justify-center p-3">
                <div className="flex flex-col items-center justify-center group-hover:scale-102 transition-transform duration-200">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#5f41b2] shadow-xs border border-slate-200/60">
                    <FileText className="w-5 h-5 stroke-[2]" />
                  </div>
                  <span className="mt-1.5 text-xs font-bold text-slate-800 text-center truncate max-w-[180px]">
                    {team.name}
                  </span>
                </div>

                <div className="absolute top-2.5 right-2.5">
                  {team.active ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                      Inactive
                    </span>
                  )}
                </div>
              </div>

              {/* DETAILS BOTTOM BLOCK */}
              <div className="p-3.5 flex-1 flex flex-col justify-between gap-2.5 bg-white">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    ID #{team.teamId || team.id}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 truncate max-w-[120px]">
                    {team.departmentName?.split(' ')[0] || 'Preparation'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5">
                    {hasLead ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate text-slate-700">
                          <span className="text-slate-400 font-medium">Lead: </span>
                          <span className="font-semibold text-slate-800">{team.teamLeadName}</span>
                        </span>
                      </>
                    ) : (
                      <>
                        <UserX className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-400 italic truncate">No Lead Assigned</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate font-medium text-slate-600">
                      {team.departmentName || 'Preparation Department'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-400">
                    {hasLead ? 'Assigned' : 'Unassigned'}
                  </span>
                  
                  <button 
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#5f41b2] bg-[#5f41b2]/10 hover:bg-[#5f41b2] hover:text-white px-2.5 py-1 rounded-md transition duration-150 active:scale-95"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardClick(team);
                    }}
                  >
                    View Squad
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminPreparationTeam;