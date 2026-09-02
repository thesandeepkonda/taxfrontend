// src/features/admin/teams/AdminEstimationeamProfile.tsx
import React, { useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import { fetchUsersByTeam } from '../../../store/slices/usersSlice';
import { ArrowLeft, Calculator, Mail, Phone, Loader2 } from 'lucide-react';

const AdminEstimationeamProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const teamId = Number(id);
  const { usersByTeam, loading } = useSelector((state: RootState) => state.users);
  const teamUsers = usersByTeam[teamId] || [];

  const teamName = searchParams.get('teamName') || `Team ${id}`;
  const teamLead = searchParams.get('teamLead') || 'Not Assigned';
  const rating = searchParams.get('rating') || 'N/A';

  useEffect(() => {
    if (teamId) {
      dispatch(fetchUsersByTeam(teamId));
    }
  }, [dispatch, teamId]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition"
      >
        <ArrowLeft className="w-5 h-5" /> Back
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{teamName}</h1>
            <p className="text-sm text-slate-500">Lead: {teamLead} • Rating: {rating}/10</p>
          </div>
        </div>
        <div className="text-sm text-slate-500">Team ID: #{teamId} • Members: {teamUsers.length}</div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">Team Members</h2>
          {loading && <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />}
        </div>

        {teamUsers.length === 0 && !loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">No members found in this team.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                <tr>
                  <th className="px-4 py-3 text-left">Employee</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">{user.firstName} {user.lastName}</span>
                        <span className="text-xs text-slate-400">({user.employeeCode})</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {user.phone}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        user.roleName === 'TEAM_LEAD' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {user.roleName || 'EMPLOYEE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminEstimationeamProfile;