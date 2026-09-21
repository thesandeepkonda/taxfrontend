// src/features/documentation/DocCallHistory.tsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchCallHistory, fetchAuthorizedRecording } from '../../store/slices/docClientsSlice';
import { 
  PhoneOutgoing, 
  PhoneIncoming, 
  Loader2, 
  Search,
  Globe,
  PlayCircle,
  Info,
  PhoneOff,
  X
} from 'lucide-react';

const DocCallHistory: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { callHistory, loading, callHistoryPage, callHistoryHasMore } = useSelector((state: RootState) => state.docClients);

  const [clientId, setClientId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // NEW: States for tracking recording fetch and inline audio playback
  const [fetchingRecordId, setFetchingRecordId] = useState<number | null>(null);
  const [playingRecordId, setPlayingRecordId] = useState<number | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchCallHistory({ page: 0, size: 20, append: false }));
  }, [dispatch]);

  const handleSearch = () => {
    dispatch(fetchCallHistory({
      clientId: clientId ? Number(clientId) : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      page: 0,
      size: 20,
      append: false
    }));
  };

  const handleReset = () => {
    setClientId('');
    setStartDate('');
    setEndDate('');
    dispatch(fetchCallHistory({ page: 0, size: 20, append: false }));
  };

  // Infinite Scroll Handler with threshold buffer
  const handleCallLogScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop - target.clientHeight < 50) {
      if (!loading && callHistoryHasMore) {
        dispatch(fetchCallHistory({ 
          clientId: clientId ? Number(clientId) : undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          page: callHistoryPage + 1, 
          size: 20, 
          append: true 
        }));
      }
    }
  };

  // Date Formatter matching exactly the required UI design
  const formatLogDate = (dateStr: string | undefined | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' });
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    const strTime = hours.toString().padStart(2, '0') + ':' + minutes + ' ' + ampm;
    return `${day} ${month} ${strTime}`;
  };

  // Mask Phone Number Logic
  const maskPhoneNumber = (phone: string | null | undefined) => {
    if (!phone) return '-';
    if (phone.length <= 5) return phone;
    return phone.substring(0, 5) + '*'.repeat(phone.length - 5);
  };

  // NEW: Secure Recording Fetch & Inline Play Logic
  const handlePlayRecording = async (call: any) => {
    const recordId = call.id || call.callHistoryId;
    
    // Prevent double fetch if already playing
    if (playingRecordId === recordId) return;

    // Reset previous audio
    setAudioUrl(null);
    setPlayingRecordId(null);

    if (!call.callSid) {
       // Fallback to direct URL if callSid is somehow missing but URL exists
       if (call.recordingUrl) {
         setAudioUrl(call.recordingUrl);
         setPlayingRecordId(recordId);
       }
       return;
    }
    
    setFetchingRecordId(recordId);
    try {
       const mp3Url = await dispatch(fetchAuthorizedRecording({ 
          callSid: call.callSid, 
          callTime: call.callTime || call.startTime
       })).unwrap();
       
       if (mp3Url) {
          setAudioUrl(mp3Url);
          setPlayingRecordId(recordId);
       } else {
          alert("Recording is currently processing or unavailable.");
       }
    } catch (err: any) {
       alert(err || "Failed to fetch secure recording link. Please try again.");
    } finally {
       setFetchingRecordId(null);
    }
  };

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden">
      {/* Search Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between shrink-0 mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1b2559] tracking-tight leading-none flex items-center gap-3">
            <PhoneOutgoing className="w-7 h-7 text-[#5f41b2]" />
            Call History
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Review all your client calls.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:flex-none min-w-[120px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="number"
              placeholder="Client ID..."
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5f41b2] shadow-sm"
            />
          </div>
          
          <div className="flex items-center gap-2 flex-1 sm:flex-none min-w-[280px]">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5f41b2] shadow-sm text-gray-600"
            />
            <span className="text-xs font-bold text-gray-400">TO</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5f41b2] shadow-sm text-gray-600"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleSearch}
              className="flex-1 sm:flex-none bg-[#5f41b2] hover:bg-[#4d3396] text-white px-5 py-2 rounded-lg text-sm font-bold transition shadow-sm"
            >
              Search
            </button>
            <button
              onClick={handleReset}
              className="flex-1 sm:flex-none bg-gray-100 hover:bg-gray-200 text-gray-600 px-5 py-2 rounded-lg text-sm font-bold transition shadow-sm"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Table Container exactly matching the modal UI */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-0 bg-white" onScroll={handleCallLogScroll}>
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/80 sticky top-0 z-10 border-b border-gray-200 shadow-sm">
              <tr className="text-xs font-bold text-gray-800 tracking-wide">
                 <th className="p-4 px-6 w-12 text-center"></th>
                 <th className="p-4">Number Name</th>
                 <th className="p-4">User</th>
                 <th className="p-4">Client</th>
                 <th className="p-4">Status <Info className="w-3 h-3 inline text-gray-400 ml-1"/></th>
                 <th className="p-4">Date & Time</th>
                 <th className="p-4 text-center">Duration</th>
                 <th className="p-4 text-center pr-6">Recording</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {callHistory.map((call, idx) => {
                const isOutgoing = call.callType?.toUpperCase() === 'OUTGOING';
                const recordId = call.id || call.callHistoryId;
                
                return (
                 <tr key={idx} className="hover:bg-gray-50/50 transition">
                    {/* Direction Icon */}
                    <td className="p-4 px-6 text-center">
                      {isOutgoing ? (
                        <div className="relative inline-flex text-gray-400">
                          <PhoneOutgoing className="w-5 h-5" />
                          <span className="absolute -top-1 -right-1 text-emerald-500 font-bold text-[14px]">↗</span>
                        </div>
                      ) : (
                        <div className="relative inline-flex text-gray-400">
                          <PhoneIncoming className="w-5 h-5" />
                          <span className="absolute -top-1 -right-1 text-blue-500 font-bold text-[14px]">↙</span>
                        </div>
                      )}
                    </td>

                    {/* Number Name (Country) */}
                    <td className="p-4 text-gray-600 font-medium">
                       {call.countryName || 'United States'}
                    </td>

                    {/* User (Agent) */}
                    <td className="p-4 text-gray-600 font-medium">
                       {call.employeeName}
                    </td>

                    {/* Client (To Number) - MASKED */}
                    <td className="p-4 text-gray-600 font-medium flex items-center gap-2">
                       <Globe className="w-4 h-4 text-orange-400" />
                       {maskPhoneNumber(call.toNumber || call.fromNumber)}
                    </td>

                    {/* Status */}
                    <td className="p-4 text-gray-600 font-medium capitalize">
                       {call.status ? call.status.toLowerCase().replace('_', ' ') : '-'}
                    </td>

                    {/* Date & Time */}
                    <td className="p-4 text-gray-600 font-medium">
                       {formatLogDate(call.callTime || call.startTime)}
                    </td>

                    {/* Duration */}
                    <td className="p-4 text-center text-gray-600 font-medium">
                       {call.duration ? call.duration : '-'}
                    </td>

                    {/* Recording - Inline Overlay Audio Player */}
                    <td className="p-4 text-center pr-6 relative align-middle">
                       {/* Floating Absolute Audio Player - FIXED LAYOUT JUMP */}
                       {playingRecordId === recordId && audioUrl && (
                         <div className="absolute right-6 top-1/2 -translate-y-1/2 z-50 flex items-center bg-white shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-gray-200 rounded-full p-1 animate-in fade-in slide-in-from-right-4">
                           <div className="w-[200px] sm:w-[260px] flex items-center">
                             <audio 
                               src={audioUrl} 
                               controls 
                               autoPlay 
                               className="h-8 w-full outline-none" 
                               controlsList="nodownload" 
                             />
                           </div>
                           <button 
                             onClick={() => { setPlayingRecordId(null); setAudioUrl(null); }}
                             className="p-1.5 shrink-0 bg-transparent hover:bg-rose-50 rounded-full text-gray-400 hover:text-rose-500 transition-colors ml-1"
                             title="Close Player"
                           >
                             <X className="w-4 h-4" />
                           </button>
                         </div>
                       )}

                       {/* Default Play Button */}
                       <div className={`flex justify-center items-center transition-opacity ${playingRecordId === recordId ? 'opacity-0' : 'opacity-100'}`}>
                         {call.recordingUrl || call.callSid ? (
                           <button 
                              onClick={() => handlePlayRecording(call)}
                              disabled={fetchingRecordId === recordId}
                              title="Play Recording"
                              className="inline-block hover:scale-110 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                           >
                             {fetchingRecordId === recordId ? (
                               <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                             ) : (
                               <PlayCircle className="w-6 h-6 text-orange-500" strokeWidth={1.5} />
                             )}
                           </button>
                         ) : (
                           <span className="text-gray-300">-</span>
                         )}
                       </div>
                    </td>
                 </tr>
              )})}
            </tbody>
          </table>
          
          {loading && (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-[#5f41b2]" />
            </div>
          )}
          
          {!loading && callHistory.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
               <PhoneOff className="w-12 h-12 opacity-20 mb-2" />
               <p className="text-sm font-semibold">No call records found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocCallHistory;