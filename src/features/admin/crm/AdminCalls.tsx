// src/features/admin/crm/AdminCalls.tsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import {
  fetchAdminCalls,
  fetchCallRecording,
  AdminCallResponse,
} from '../../../store/slices/adminCRMSlice';
import { Phone, Loader2, Play, X, Clock, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

const AdminCalls: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { calls, totalCalls, loading } = useSelector((state: RootState) => state.adminCRM);
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [selectedCall, setSelectedCall] = useState<AdminCallResponse | null>(null);

  // ---------- PAGINATION ----------
  const [page, setPage] = useState(0);
  const size = 10;
  const totalPages = Math.ceil(totalCalls / size);

  useEffect(() => {
    dispatch(fetchAdminCalls({ page, size }));
  }, [dispatch, page]);

  const goToNextPage = () => {
    if (page < totalPages - 1) setPage(page + 1);
  };

  const goToPrevPage = () => {
    if (page > 0) setPage(page - 1);
  };

  const handleViewRecording = async (callId: number) => {
    try {
      const data = await dispatch(fetchCallRecording(callId)).unwrap() as AdminCallResponse;
      setRecordingUrl(data.recordingUrl || null);
      setSelectedCall(data);
      setShowRecordingModal(true);
    } catch (err) {
      alert('Failed to load recording');
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden">
      <div className="flex items-center justify-between shrink-0 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1b2559] tracking-tight leading-none flex items-center gap-3">
            <Phone className="w-7 h-7 text-[#5f41b2]" />
            Call History ({totalCalls})
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Monitor all employee calls</p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-2">
          {loading && calls.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#5f41b2]" />
              <p className="text-sm font-semibold">Loading calls...</p>
            </div>
          ) : calls.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
              <Phone className="w-12 h-12 opacity-20" />
              <p className="text-sm font-semibold">No calls found</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm min-w-[800px]">
              <thead className="bg-gray-50/80 sticky top-0 z-10">
                <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="p-3">Call ID</th>
                  <th className="p-3">Client</th>
                  <th className="p-3">Employee</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Duration</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {calls.map((call) => (
                  <tr key={call.callId} className="hover:bg-blue-50/30 transition group">
                    <td className="p-3 font-mono text-xs font-bold text-[#1b2559]">#{call.callId}</td>
                    <td className="p-3 font-semibold text-gray-700">{call.clientName}</td>
                    <td className="p-3 text-gray-600">{call.employeeName}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                        call.status === 'COMPLETED' || call.status === 'ANSWERED' ? 'bg-emerald-100 text-emerald-700' :
                        call.status === 'NOT_LIFTED' ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {call.status}
                      </span>
                    </td>
                    <td className="p-3 text-center font-medium text-gray-600">
                      {formatDuration(call.durationSeconds)}
                    </td>
                    <td className="p-3 text-right">
                      {call.recordingUrl && (
                        <button
                          onClick={() => handleViewRecording(call.callId)}
                          className="flex items-center gap-1 text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white px-3 py-1.5 rounded-lg transition"
                        >
                          <Play className="w-3 h-3" /> Recording
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {/* ---------- PAGINATION ---------- */}
        {totalCalls > 0 && (
          <div className="p-3 border-t border-gray-100 shrink-0 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Showing {(page * size) + 1} – {Math.min((page + 1) * size, totalCalls)} of {totalCalls}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevPage}
                disabled={page === 0 || loading}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-xs font-medium text-gray-700">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={goToNextPage}
                disabled={page >= totalPages - 1 || loading}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recording Modal */}
      {showRecordingModal && recordingUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#1b2559] flex items-center gap-2">
                <Phone className="w-5 h-5 text-[#5f41b2]" />
                Call Recording
              </h3>
              <button onClick={() => setShowRecordingModal(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            {selectedCall && (
              <div className="text-xs text-gray-500 mb-4 space-y-1">
                <p><span className="font-bold">Client:</span> {selectedCall.clientName}</p>
                <p><span className="font-bold">Employee:</span> {selectedCall.employeeName}</p>
                <p><span className="font-bold">Duration:</span> {formatDuration(selectedCall.durationSeconds)}</p>
              </div>
            )}
            <audio controls className="w-full rounded-lg">
              <source src={recordingUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowRecordingModal(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCalls;