// src/features/admin/crm/AdminViewCallHistoryWithcliendEmpID.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store';
import {
  fetchAdminCallReportCalls,
  fetchCallHippoActivityFeed,
} from '../../../store/slices/adminDocumentsSlice';
import {
  ArrowLeft,
  PhoneOutgoing,
  PhoneIncoming,
  PhoneOff,
  Loader2,
  RefreshCw,
  Globe,
  Info,
  User,
  Calendar,
  Activity,
  PlayCircle,
  X,
  Phone,
  Clock,
  DollarSign,
  Signal,
  History,
  Users,
} from 'lucide-react';

const PAGE_SIZE = 20;

const AdminViewCallHistoryWithcliendEmpID: React.FC = () => {
  const params = useParams<{ clientID?: string; empID?: string }>();
  const clientID = params.clientID;
  const empID = params.empID;

  const [searchParams] = useSearchParams();
  const clientName = searchParams.get('name') || '';
  const empName = searchParams.get('empName') || '';
  const empCode = searchParams.get('empCode') || '';

  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const {
    adminCallReport,
    adminCallReportTotal,
    adminCallReportHasMore,
    isCallHippoLoading,
  } = useSelector((state: RootState) => state.adminDocuments);

  const [page, setPage] = useState(0);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Recording player state
  const [playingRecordId, setPlayingRecordId] = useState<number | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [fetchingRecordId, setFetchingRecordId] = useState<number | null>(null);

  const clientIdNum = clientID ? parseInt(clientID, 10) : NaN;
  const empIdNum = empID ? parseInt(empID, 10) : NaN;

  // ============================================================
  // Initial Load
  // ============================================================
  useEffect(() => {
    if (isNaN(clientIdNum) || isNaN(empIdNum)) return;

    setPage(0);
    dispatch(
      fetchAdminCallReportCalls({
        employeeId: empIdNum,
        clientId: clientIdNum,
        page: 0,
        size: PAGE_SIZE,
        append: false,
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, clientIdNum, empIdNum]);

  // ============================================================
  // Load More
  // ============================================================
  useEffect(() => {
    if (page === 0) return;
    if (isNaN(clientIdNum) || isNaN(empIdNum)) return;

    setIsFetchingMore(true);
    dispatch(
      fetchAdminCallReportCalls({
        employeeId: empIdNum,
        clientId: clientIdNum,
        page,
        size: PAGE_SIZE,
        append: true,
      })
    )
      .unwrap()
      .finally(() => setIsFetchingMore(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, dispatch, clientIdNum, empIdNum]);

  // ============================================================
  // Infinite Scroll Observer
  // ============================================================
  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isCallHippoLoading || isFetchingMore) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && adminCallReportHasMore && !isFetchingMore) {
            setPage((prev) => prev + 1);
          }
        },
        { rootMargin: '120px' }
      );

      if (node) observerRef.current.observe(node);
    },
    [isCallHippoLoading, isFetchingMore, adminCallReportHasMore]
  );

  // ============================================================
  // Refresh
  // ============================================================
  const handleRefresh = () => {
    if (isNaN(clientIdNum) || isNaN(empIdNum)) return;

    setPlayingRecordId(null);
    setAudioUrl(null);
    setFetchingRecordId(null);

    if (page === 0) {
      dispatch(
        fetchAdminCallReportCalls({
          employeeId: empIdNum,
          clientId: clientIdNum,
          page: 0,
          size: PAGE_SIZE,
          append: false,
        })
      );
    } else {
      setPage(0);
    }
  };

  // ============================================================
  // Format Date for Activity Feed → "YYYY/MM/DD"
  // ============================================================
  const formatDateForActivityFeed = (dateStr?: string | null): string | null => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}/${m}/${d}`;
    } catch {
      return null;
    }
  };

  // ============================================================
  // Play Recording — via Activity Feed
  // ============================================================
  const handlePlayRecording = async (recordId: number, call: any) => {
    if (playingRecordId === recordId) {
      setPlayingRecordId(null);
      setAudioUrl(null);
      return;
    }

    setAudioUrl(null);
    setPlayingRecordId(null);

    if (!call.callSid) {
      alert('Recording is not available for this call.');
      return;
    }

    const callDate =
      formatDateForActivityFeed(call.startTime) ||
      formatDateForActivityFeed(call.callTime);

    if (!callDate) {
      alert('Unable to determine call date for recording.');
      return;
    }

    setFetchingRecordId(recordId);

    try {
      const response: any = await dispatch(
        fetchCallHippoActivityFeed({
          skip: '0',
          limit: '20',
          startDate: callDate,
          endDate: callDate,
          crmUniqueId: '',
          callSid: call.callSid,
        })
      ).unwrap();

      const callLogs = response?.data?.callLogs;
      const log = Array.isArray(callLogs) ? callLogs[0] : callLogs;
      const mp3Url = log?.recordingUrl;

      if (mp3Url && typeof mp3Url === 'string') {
        setAudioUrl(mp3Url);
        setPlayingRecordId(recordId);
      } else {
        alert('Recording is currently processing or unavailable for this call.');
      }
    } catch (err: any) {
      console.error('Failed to fetch recording:', err);
      alert(err || 'Failed to fetch recording. Please try again.');
    } finally {
      setFetchingRecordId(null);
    }
  };

  const closePlayer = () => {
    setPlayingRecordId(null);
    setAudioUrl(null);
  };

  // ============================================================
  // Helpers
  // ============================================================
  const formatLogDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      const day = date.getDate().toString().padStart(2, '0');
      const month = date.toLocaleString('default', { month: 'short' });
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const strTime =
        hours.toString().padStart(2, '0') + ':' + minutes + ' ' + ampm;
      return `${day} ${month} ${strTime}`;
    } catch {
      return dateStr || '-';
    }
  };

  const maskPhoneNumber = (phone?: string | null) => {
    if (!phone) return '-';
    if (phone.length <= 5) return phone;
    return phone.substring(0, 5) + '*'.repeat(phone.length - 5);
  };

  const getStatusColor = (status?: string | null) => {
    const s = (status || '').toUpperCase();
    if (s === 'COMPLETED' || s === 'ANSWERED' || s === 'CONNECTED') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (s === 'FAILED' || s === 'ERROR' || s === 'BUSY') {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (s === 'INITIATED' || s === 'RINGING') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const formatDuration = (
    duration?: string | null,
    seconds?: number | null
  ) => {
    if (duration) return duration;
    if (seconds) {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return '-';
  };

  if (!clientID || !empID || isNaN(clientIdNum) || isNaN(empIdNum)) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-rose-500 font-bold">Invalid Client ID or Employee ID</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 shrink-0 mb-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 hover:text-[#5f41b2] transition cursor-pointer text-slate-600 shadow-2xs"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-purple-50 rounded-lg border border-purple-100">
                <History className="w-5 h-5 text-[#5f41b2]" />
              </div>
              <h1 className="text-xl font-extrabold text-[#1b2559] tracking-tight leading-none">
                Call History Report
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-[#5f41b2] border border-purple-200">
                {adminCallReportTotal} Total
              </span>
              {adminCallReport.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {adminCallReport.length} Loaded
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1 flex flex-wrap items-center gap-2">
              <span>
                <span className="text-slate-400">Client:</span>{' '}
                <span className="font-bold text-[#1b2559]">
                  {clientName || `ID #${clientID}`}
                </span>{' '}
                <span className="text-slate-400">(ID #{clientID})</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center gap-1">
                <User className="w-3 h-3 text-[#5f41b2]" />
                <span className="text-slate-400">Employee:</span>{' '}
                <span className="font-bold text-[#1b2559]">
                  {empName || `ID #${empID}`}
                </span>
                {empCode && (
                  <span className="text-slate-400 font-mono">({empCode})</span>
                )}
              </span>
            </p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isCallHippoLoading}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isCallHippoLoading ? 'animate-spin text-[#5f41b2]' : ''}`}
          />
          Refresh
        </button>
      </div>

      {/* Main Table */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200/80 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-auto p-0 [scrollbar-width:thin]">
          {isCallHippoLoading && adminCallReport.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 py-16">
              <Loader2 className="w-8 h-8 animate-spin text-[#5f41b2]" />
              <p className="text-sm font-semibold">Loading call history...</p>
            </div>
          ) : adminCallReport.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 py-16">
              <PhoneOff className="w-12 h-12 opacity-20" />
              <p className="text-sm font-semibold">
                No call records found for this client & employee.
              </p>
            </div>
          ) : (
            <>
              <table className="w-full text-left text-sm whitespace-nowrap min-w-[1500px]">
                <thead className="bg-slate-50/90 sticky top-0 z-10 border-b border-slate-200 shadow-2xs">
                  <tr className="text-[11px] font-bold text-slate-600 tracking-wide uppercase">
                    <th className="p-4 px-4 w-12 text-center">#</th>
                    <th className="p-4">Employee</th>
                    <th className="p-4">Number</th>
                    <th className="p-4">
                      Status <Info className="w-3 h-3 inline text-slate-400 ml-1" />
                    </th>
                    <th className="p-4">Hangup By</th>
                    <th className="p-4">Answered Device</th>
                    <th className="p-4">Date & Time</th>
                    <th className="p-4 text-center">Duration</th>
                    <th className="p-4 text-center">Billed</th>
                    <th className="p-4 text-center">Charge</th>
                    <th className="p-4 text-center">Call Type</th>
                    <th className="p-4 text-center pr-6">Recording</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {adminCallReport.map((call, idx) => {
                    const isOutgoing =
                      (call.callType || '').toUpperCase() === 'OUTGOING';
                    const hasCallSid = Boolean(call.callSid);
                    const recordId = call.callHistoryId;
                    const isPlaying = playingRecordId === recordId;
                    const isFetching = fetchingRecordId === recordId;

                    return (
                      <tr
                        key={recordId || idx}
                        className={`hover:bg-slate-50/60 transition ${
                          isPlaying ? 'bg-blue-50/40' : ''
                        }`}
                      >
                        {/* Index */}
                        <td className="p-4 px-4 text-center text-xs text-slate-400 font-mono">
                          {idx + 1}
                        </td>

                        {/* Direction + Employee */}
                        <td className="p-4 text-slate-700 font-medium">
                          <div className="flex items-center gap-2">
                            {isOutgoing ? (
                              <div className="relative inline-flex text-slate-400 shrink-0">
                                <PhoneOutgoing className="w-4 h-4" />
                                <span className="absolute -top-1 -right-1 text-emerald-500 font-bold text-[12px]">
                                  ↗
                                </span>
                              </div>
                            ) : (
                              <div className="relative inline-flex text-slate-400 shrink-0">
                                <PhoneIncoming className="w-4 h-4" />
                                <span className="absolute -top-1 -right-1 text-blue-500 font-bold text-[12px]">
                                  ↙
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="text-xs font-semibold">
                                {call.employeeName || '—'}
                              </span>
                              {call.employeeCode && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  ({call.employeeCode})
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Number */}
                        <td className="p-4 text-slate-600 font-medium">
                          <span className="flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                            <span className="text-xs font-mono">
                              {maskPhoneNumber(call.toNumber || call.fromNumber)}
                            </span>
                          </span>
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase tracking-wide ${getStatusColor(
                              call.status
                            )}`}
                          >
                            {call.status
                              ? call.status.replace(/_/g, ' ')
                              : '—'}
                          </span>
                        </td>

                        {/* Hangup By */}
                        <td className="p-4 text-slate-600 font-medium text-xs">
                          {call.hangupBy ? (
                            <span className="inline-flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              {call.hangupBy}
                            </span>
                          ) : (
                            <span className="text-slate-300 italic">—</span>
                          )}
                        </td>

                        {/* Answered Device */}
                        <td className="p-4 text-slate-600 font-medium text-xs">
                          {call.answeredDevice ? (
                            <span className="inline-flex items-center gap-1">
                              <Signal className="w-3 h-3 text-slate-400 shrink-0" />
                              {call.answeredDevice}
                            </span>
                          ) : (
                            <span className="text-slate-300 italic">—</span>
                          )}
                        </td>

                        {/* Date & Time */}
                        <td className="p-4 text-slate-600 font-medium text-xs">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {formatLogDate(call.callTime || call.startTime)}
                          </span>
                        </td>

                        {/* Duration */}
                        <td className="p-4 text-center text-slate-600 font-medium text-xs">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                            {formatDuration(call.duration, call.durationSeconds)}
                          </span>
                        </td>

                        {/* Billed Minutes */}
                        <td className="p-4 text-center text-slate-600 font-medium text-xs">
                          {call.billedMinutes != null ? (
                            `${call.billedMinutes} min`
                          ) : (
                            <span className="text-slate-300 italic">—</span>
                          )}
                        </td>

                        {/* Call Charge */}
                        <td className="p-4 text-center text-slate-600 font-medium text-xs">
                          {call.callCharge ? (
                            <span className="inline-flex items-center gap-1">
                              <DollarSign className="w-3 h-3 text-emerald-500 shrink-0" />
                              {call.callCharge}
                            </span>
                          ) : (
                            <span className="text-slate-300 italic">—</span>
                          )}
                        </td>

                        {/* Call Type */}
                        <td className="p-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase tracking-wide ${
                              isOutgoing
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {call.callType || '—'}
                          </span>
                        </td>

                        {/* Recording */}
                        <td className="p-4 text-center pr-6 relative align-middle">
                          {hasCallSid ? (
                            <>
                              {isPlaying && audioUrl && (
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 z-50 flex items-center bg-white shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-blue-200 rounded-full p-1 animate-in fade-in slide-in-from-right-4">
                                  <div className="w-[220px] sm:w-[280px] flex items-center">
                                    <audio
                                      src={audioUrl}
                                      controls
                                      autoPlay
                                      className="h-8 w-full outline-none"
                                      controlsList="nodownload"
                                    />
                                  </div>
                                  <button
                                    onClick={closePlayer}
                                    className="p-1.5 shrink-0 bg-transparent hover:bg-rose-50 rounded-full text-slate-400 hover:text-rose-500 transition-colors ml-1 cursor-pointer"
                                    title="Close Player"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              )}

                              <div
                                className={`flex justify-center items-center transition-opacity ${
                                  isPlaying ? 'opacity-0' : 'opacity-100'
                                }`}
                              >
                                <button
                                  onClick={() =>
                                    handlePlayRecording(recordId, call)
                                  }
                                  disabled={isFetching}
                                  title="Play Recording"
                                  className="inline-block hover:scale-110 transition-transform cursor-pointer disabled:opacity-50 disabled:hover:scale-100"
                                >
                                  {isFetching ? (
                                    <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                                  ) : (
                                    <PlayCircle
                                      className="w-6 h-6 text-orange-500"
                                      strokeWidth={1.5}
                                    />
                                  )}
                                </button>
                              </div>
                            </>
                          ) : (
                            <span className="text-slate-300 text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Infinite scroll sentinel */}
              <div
                ref={lastElementRef}
                className="w-full py-4 flex items-center justify-center"
              >
                {isFetchingMore && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#5f41b2]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading more calls...</span>
                  </div>
                )}
                {!adminCallReportHasMore &&
                  adminCallReport.length > 0 &&
                  !isFetchingMore && (
                    <span className="text-xs text-slate-400 font-medium">
                      All {adminCallReport.length} calls loaded
                    </span>
                  )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {adminCallReport.length > 0 && (
          <div className="p-3.5 border-t border-slate-100 shrink-0 text-xs text-slate-500 flex justify-between items-center bg-slate-50/50">
            <span>
              Showing{' '}
              <span className="font-bold text-[#5f41b2]">
                {adminCallReport.length}
              </span>{' '}
              of{' '}
              <span className="font-bold text-slate-700">
                {adminCallReportTotal}
              </span>{' '}
              calls
            </span>
            <span className="flex items-center gap-1.5 text-[#5f41b2] font-semibold">
              <Activity className="w-3.5 h-3.5" /> Admin Call Report
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminViewCallHistoryWithcliendEmpID;