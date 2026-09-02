// src/features/documentation/DocCallHistory.tsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchCallHistory } from '../../store/slices/docClientsSlice';
import { PhoneOutgoing, Clock, CalendarDays, Loader2, CheckCircle2, XCircle } from 'lucide-react';

const DocCallHistory: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { callHistory, loading } = useSelector((state: RootState) => state.docClients);

  useEffect(() => {
    dispatch(fetchCallHistory());
  }, [dispatch]);

  const formatDuration = (seconds: number | null) => {
    if (seconds === null) return '-';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden">
      <div className="flex items-center justify-between shrink-0 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1b2559] tracking-tight leading-none flex items-center gap-3">
            <PhoneOutgoing className="w-7 h-7 text-[#5f41b2]" />
            Call History
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Review all your outbound client calls.</p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#5f41b2]" />
              <p className="text-sm font-semibold">Loading history...</p>
            </div>
          ) : callHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
              <PhoneOutgoing className="w-12 h-12 opacity-20" />
              <p className="text-sm font-semibold">No call records found.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 sticky top-0 z-10">
                <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="p-3">Client</th>
                  <th className="p-3">Call Time</th>
                  <th className="p-3 text-center">Duration</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {callHistory.map((call) => (
                  <tr key={call.callId} className="hover:bg-blue-50/30 transition">
                    <td className="p-3">
                      <p className="font-bold text-[#1b2559]">{call.clientName}</p>
                      <p className="text-[11px] text-gray-500">ID: {call.clientId} | Call: {call.callId}</p>
                    </td>
                    <td className="p-3 font-medium text-gray-600">
                      <p className="flex items-center gap-1.5 text-xs">
                        <CalendarDays className="w-3 h-3 text-gray-400" /> {formatDate(call.startTime)}
                      </p>
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-700 px-2.5 py-1 rounded-md text-xs font-bold border border-gray-200">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {formatDuration(call.durationSeconds)}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {call.answered ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Answered
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md">
                          <XCircle className="w-3.5 h-3.5" /> Not Answered
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
  );
};

export default DocCallHistory;