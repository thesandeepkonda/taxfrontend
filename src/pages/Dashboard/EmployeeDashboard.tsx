// src/pages/Dashboard/EmployeeDashboard.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../../store';
import { fetchUserDetails } from '../../store/slices/usersSlice';
import { 
  checkIn, 
  checkOut, 
  startBreak, 
  endBreak, 
  startIdle, 
  endIdle, 
  fetchAttendancePolicy,
  fetchAttendanceCalendar,
  fetchTodayAttendance
} from '../../store/slices/attendanceSlice';
import { fetchMyClients } from '../../store/slices/employeeClientSlice';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  Clock, ChevronRight, FileText, Send, Search, Play, Square, Coffee, 
  MonitorOff, Activity, CalendarDays, CheckCheck, IdCard, Calendar, Users
} from 'lucide-react';

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  
  const userDetails = useSelector((state: RootState) => state.users?.currentUser || null);
  const attendance = useSelector((state: RootState) => state.attendance?.currentAttendance || null);
  const policy = useSelector((state: RootState) => state.attendance?.currentPolicy || null);
  const calendarData = useSelector((state: RootState) => state.attendance?.calendar || []);
  const { clients: assignedClients } = useSelector((state: RootState) => state.employeeClient);

  // Date states for historical attendance check
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1); // Default to 1st of current month
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayDateStr = getTodayDateString();
  const todayStats = calendarData.find(day => day.date === todayDateStr);
  
  // Use current live attendance payload if available, else fallback to calendar daily stat
  const activeData = attendance || todayStats;

  // Session States
  const [isWorking, setIsWorking] = useState<boolean>(() => localStorage.getItem(`att_working_${user?.id}`) === 'true');
  const [isOnBreak, setIsOnBreak] = useState<boolean>(() => localStorage.getItem(`att_break_${user?.id}`) === 'true');
  const [isIdle, setIsIdle] = useState<boolean>(() => localStorage.getItem(`att_idle_${user?.id}`) === 'true');
  
  const [currentTime, setCurrentTime] = useState(new Date());

  const hasCheckedOut = Boolean(activeData?.checkOut);

  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isIdleRef = useRef<boolean>(isIdle);
  const isWorkingRef = useRef<boolean>(isWorking);
  const isOnBreakRef = useRef<boolean>(isOnBreak);

  // Sync state with refs and persist to localStorage
  useEffect(() => {
    isWorkingRef.current = isWorking;
    isOnBreakRef.current = isOnBreak;
    isIdleRef.current = isIdle;
    
    if (user?.id) {
      localStorage.setItem(`att_working_${user.id}`, String(isWorking));
      localStorage.setItem(`att_break_${user.id}`, String(isOnBreak));
      localStorage.setItem(`att_idle_${user.id}`, String(isIdle));
    }
  }, [isWorking, isOnBreak, isIdle, user?.id]);

  // Live Clock Update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Background Sync: Fetch accurate data from backend every 1 minute if working
  useEffect(() => {
    let syncInterval: NodeJS.Timeout;
    if (isWorkingRef.current && !hasCheckedOut) {
      syncInterval = setInterval(() => {
        dispatch(fetchTodayAttendance());
      }, 60000); // 60 seconds
    }
    return () => {
      if (syncInterval) clearInterval(syncInterval);
    };
  }, [hasCheckedOut, dispatch]);

  // Initial Data Fetch
  useEffect(() => {
    if (user?.id) {
      dispatch(fetchUserDetails(user.id));
      dispatch(fetchTodayAttendance());
      dispatch(fetchAttendanceCalendar({ fromDate, toDate }));
      dispatch(fetchMyClients({ page: 0, size: 50 }));
    }
  }, [dispatch, user?.id]);

  useEffect(() => {
    if (userDetails?.attendancePolicyId) {
      dispatch(fetchAttendancePolicy(userDetails.attendancePolicyId));
    }
  }, [dispatch, userDetails?.attendancePolicyId]);

  // Sync Session Flags with Backend Real State
  useEffect(() => {
    if (activeData) {
      if (activeData.checkOut) {
        setIsWorking(false);
        setIsOnBreak(false);
        setIsIdle(false);
      } else if (activeData.status === 'PRESENT') {
        setIsWorking(true);
        if (activeData.breakActive !== undefined) {
           setIsOnBreak(activeData.breakActive);
        }
      } else if (activeData.status === 'ABSENT' || activeData.status === 'ON_LEAVE') {
        setIsWorking(false);
      }
    }
  }, [activeData]);

  // Automated Idle Logic (Hits API to calculate idle time on backend)
  const resetIdleTimer = useCallback(() => {
    if (!isWorkingRef.current || isOnBreakRef.current || hasCheckedOut) return;
    
    // If returning from Idle, end idle API
    if (isIdleRef.current) {
      dispatch(endIdle()).unwrap()
        .then(() => {
          isIdleRef.current = false;
          setIsIdle(false);
          showToast('Welcome back! Activity detected.', 'info');
          dispatch(fetchTodayAttendance());
        })
        .catch(err => console.error("End Idle Error:", err));
    }
    
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    
    // Start idle if no activity for 5 minutes
    idleTimeoutRef.current = setTimeout(() => {
      if (isWorkingRef.current && !isOnBreakRef.current) {
        dispatch(startIdle()).unwrap()
          .then(() => {
            isIdleRef.current = true;
            setIsIdle(true);
            showToast('You are now Idle (No activity for 5 mins)', 'warning');
            dispatch(fetchTodayAttendance());
          })
          .catch(err => console.error("Start Idle Error:", err));
      }
    }, 5 * 60 * 1000); 
  }, [dispatch, showToast, hasCheckedOut]);

  // Attach System Activity Listeners
  useEffect(() => {
    const events = ['mousemove', 'keydown', 'scroll', 'click'];
    let throttleTimer: NodeJS.Timeout | null = null;
    
    const handleActivity = () => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        throttleTimer = null;
        resetIdleTimer();
      }, 1000);
    };

    if (isWorking && !isOnBreak && !hasCheckedOut) {
      events.forEach(e => window.addEventListener(e, handleActivity));
      resetIdleTimer(); 
    } else {
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    }

    return () => {
      events.forEach(e => window.removeEventListener(e, handleActivity));
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, [isWorking, isOnBreak, hasCheckedOut, resetIdleTimer]);

  const handleCheckIn = async () => {
    try {
      await dispatch(checkIn()).unwrap();
      setIsWorking(true);
      showToast('Checked in successfully', 'success');
      dispatch(fetchTodayAttendance());
    } catch (err: any) {
      const errorStr = String(err).toLowerCase();
      if (errorStr.includes('already checked in')) {
        setIsWorking(true);
        showToast('Session restored: You are already checked in.', 'info');
      } else {
        showToast(err || 'Check-in failed', 'error');
      }
    }
  };

  const handleCheckOut = async () => {
    try {
      await dispatch(checkOut()).unwrap();
      setIsWorking(false);
      setIsOnBreak(false);
      if (isIdleRef.current) {
        isIdleRef.current = false;
        setIsIdle(false);
      }
      showToast('Checked out successfully', 'success');
      dispatch(fetchTodayAttendance());
    } catch (err: any) {
      const errorStr = String(err).toLowerCase();
      if (errorStr.includes('already checked out') || errorStr.includes('not checked in')) {
        setIsWorking(false);
        setIsOnBreak(false);
        setIsIdle(false);
        showToast('You are already checked out.', 'info');
      } else {
        showToast(err || 'Check-out failed', 'error');
      }
    }
  };

  const handleBreakStart = async () => {
    try {
      await dispatch(startBreak()).unwrap();
      setIsOnBreak(true);
      if (isIdleRef.current) {
        isIdleRef.current = false;
        setIsIdle(false);
      }
      showToast('Break started', 'info');
      dispatch(fetchTodayAttendance());
    } catch (err: any) {
      const errorStr = String(err).toLowerCase();
      if (errorStr.includes('already on break')) {
        setIsOnBreak(true);
        showToast('You are already on break.', 'info');
      } else {
        showToast(err || 'Failed to start break', 'error');
      }
    }
  };

  const handleBreakEnd = async () => {
    try {
      await dispatch(endBreak()).unwrap();
      setIsOnBreak(false);
      showToast('Break ended. Back to work.', 'info');
      dispatch(fetchTodayAttendance());
    } catch (err: any) {
      showToast(err || 'Failed to end break', 'error');
    }
  };

  const handleAttendanceSearch = () => {
    dispatch(fetchAttendanceCalendar({ fromDate, toDate }));
  };

  // Static Formatter purely based on Backend Minutes Response
  const formatMinutes = (totalMinutes: number = 0) => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h ${m}m`;
  };

  const formatScheduleTime = (timeStr?: string) => {
    if (!timeStr) return '--:--';
    try {
      if (timeStr.includes('T')) return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const [hour, minute] = timeStr.split(':');
      const d = new Date();
      d.setHours(parseInt(hour, 10), parseInt(minute, 10), 0);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeStr;
    }
  };

  const parseTimeOnly = (timeStr?: string) => {
    if (!timeStr) return '--:--';
    try {
      if (timeStr.includes('T')) return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return timeStr.slice(0, 5); 
    } catch {
      return timeStr;
    }
  };

  // Check if current time falls within a break window
  const isBreakActive = (startTime: string, endTime: string) => {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;
    const nowTotal = currentTime.getHours() * 60 + currentTime.getMinutes();
    return nowTotal >= startTotal && nowTotal <= endTotal;
  };

  const filteredQueue = assignedClients.filter(task => 
    task.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(task.clientId).includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-y-auto pr-2 pb-6 space-y-6">
      
      {/* HEADER: ID Card & Times */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between shrink-0">
        
        {/* Left: ID Card Layout */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#5f41b2]/10 text-[#5f41b2] rounded-xl flex items-center justify-center text-2xl font-extrabold border border-[#5f41b2]/20">
            {userDetails?.firstName?.charAt(0) || user?.name?.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#1b2559] tracking-tight flex items-center gap-2">
              {userDetails ? `${userDetails.firstName} ${userDetails.lastName}` : user?.name}
            </h1>
            <p className="text-sm font-semibold text-gray-500 flex items-center gap-2 mt-0.5">
              <IdCard className="w-4 h-4 text-gray-400" />
              {user?.employeeCode} &bull; {userDetails?.departmentName || user?.team}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                hasCheckedOut ? 'bg-gray-100 text-gray-500 border-gray-200' :
                !isWorking ? 'bg-gray-100 text-gray-600 border-gray-200' :
                isOnBreak ? 'bg-orange-100 text-orange-700 border-orange-200' :
                isIdle ? 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse' :
                'bg-emerald-100 text-emerald-700 border-emerald-200'
              }`}>
                {hasCheckedOut ? 'SHIFT COMPLETED' : !isWorking ? 'OFFLINE' : isOnBreak ? 'ON BREAK' : isIdle ? 'IDLE' : 'WORKING'}
              </span>
              {userDetails?.workMode && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-700 border border-purple-200">
                  {userDetails.workMode.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Clock & Actions */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end pr-6 border-r border-gray-200">
            <div className="text-2xl font-extrabold text-[#1b2559] tracking-tight flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#5f41b2]" />
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <p className="text-xs font-semibold text-gray-500 mt-1">
              {currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          
          <div className="flex flex-col items-start gap-1 pr-6 border-r border-gray-200 min-w-[140px]">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Today's Shift</p>
            <p className="text-sm font-semibold text-gray-800">
              In: <span className={activeData?.checkIn ? 'text-emerald-600 font-bold' : 'text-gray-400'}>
                {parseTimeOnly(activeData?.checkIn)}
              </span>
            </p>
            <p className="text-sm font-semibold text-gray-800">
              Out: <span className={activeData?.checkOut ? 'text-rose-600 font-bold' : 'text-gray-400'}>
                {parseTimeOnly(activeData?.checkOut)}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {hasCheckedOut ? (
              <div className="flex items-center gap-2 bg-gray-100 text-gray-500 px-5 py-3 rounded-xl text-sm font-bold border border-gray-200 shadow-sm">
                <CheckCheck className="w-4 h-4" /> Shift Completed
              </div>
            ) : (
              <>
                {!isWorking && (
                  <button onClick={handleCheckIn} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl text-sm font-bold transition shadow-sm">
                    <Play className="w-4 h-4 fill-current" /> Check In
                  </button>
                )}
                {isWorking && isOnBreak && (
                  <button onClick={handleBreakEnd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-sm font-bold transition shadow-sm">
                    <Play className="w-4 h-4 fill-current" /> End Break
                  </button>
                )}
                {isWorking && (
                  <button onClick={handleCheckOut} className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-3 rounded-xl text-sm font-bold transition shadow-sm">
                    <Square className="w-4 h-4 fill-current" /> Check Out
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* KPI & Work Area */}
      <div className="flex gap-6 shrink-0">
        
        {/* Left Column */}
        <div className="flex-[2] flex flex-col gap-6 min-w-0">
          
          {/* Live KPI Cards Calculated Directly By Backend */}
          <div className="grid grid-cols-3 gap-4 shrink-0">
            <div className="bg-white rounded-2xl p-4 flex items-center space-x-4 shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Work Time</p>
                <h3 className="text-2xl font-extrabold text-[#1b2559]">{formatMinutes(activeData?.totalWorkMinutes || 0)}</h3>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-4 flex items-center space-x-4 shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                <Coffee className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Break Time</p>
                <h3 className="text-2xl font-extrabold text-[#1b2559]">{formatMinutes(activeData?.totalBreakMinutes || 0)}</h3>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 flex items-center space-x-4 shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                <MonitorOff className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Idle Time</p>
                <h3 className="text-2xl font-extrabold text-[#1b2559]">{formatMinutes(activeData?.totalIdleMinutes || 0)}</h3>
              </div>
            </div>
          </div>

          {/* Active Work Queue via dynamic assigned clients */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-[400px]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold text-[#1b2559]">Assigned Work Queue</h2>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search client..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#5f41b2] shadow-sm w-48 transition-all"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/50 sticky top-0 z-10">
                  <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <th className="p-3 rounded-tl-lg">Client ID</th>
                    <th className="p-3">Client Name</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Last Contacted</th>
                    <th className="p-3 text-right rounded-tr-lg">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredQueue.map((item, idx) => (
                    <tr 
                      key={idx} 
                      onClick={() => navigate(`/leads/detail/${item.clientId}`)}
                      className="hover:bg-blue-50/30 transition group cursor-pointer"
                    >
                      <td className="p-3 font-bold text-[#1b2559]">{item.clientId}</td>
                      <td className="p-3 font-semibold text-gray-700">{item.name}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          item.status?.includes('REJECTED') ? 'bg-rose-100 text-rose-700' : 
                          item.status?.includes('PENDING') ? 'bg-amber-100 text-amber-700' : 
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {item.status ? item.status.replace(/_/g, ' ') : 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="p-3 text-gray-500 font-medium flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> 
                        {item.lastCalledAt ? new Date(item.lastCalledAt).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="p-3 text-right">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/leads/detail/${item.clientId}`);
                          }}
                          className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 group-hover:bg-[#5f41b2] group-hover:text-white flex items-center justify-center ml-auto transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredQueue.length === 0 && (
                     <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-400 font-medium text-sm">
                           No assigned clients found.
                        </td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column: Schedule & Dynamic Breaks */}
        <div className="flex-1 flex flex-col gap-6 shrink-0 min-w-0">
          
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 shrink-0">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
              <CalendarDays className="w-5 h-5 text-[#5f41b2]" />
              <h2 className="text-lg font-bold text-[#1b2559]">Policy & Breaks</h2>
            </div>
            
            {policy ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Shift Timing</p>
                    <p className="text-sm font-bold text-gray-800 mt-0.5">
                      {formatScheduleTime(policy.startTime)} - {formatScheduleTime(policy.endTime)}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${policy.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                    {policy.name}
                  </span>
                </div>

                {policy.breaks && policy.breaks.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-600 mb-3 uppercase tracking-wider">Available Breaks</p>
                    <div className="space-y-3">
                      {policy.breaks.map((b, idx) => {
                        const activeWindow = isBreakActive(b.startTime, b.endTime);
                        return (
                          <div key={idx} className="flex justify-between items-center text-sm border border-gray-100 rounded-xl p-3 bg-white hover:border-[#5f41b2]/30 transition">
                            <div>
                              <span className="font-bold text-[#1b2559] block">{b.name}</span>
                              <span className="text-xs text-gray-500 font-semibold">
                                {formatScheduleTime(b.startTime)} - {formatScheduleTime(b.endTime)}
                              </span>
                            </div>
                            
                            {isWorking && !hasCheckedOut && !isOnBreak && activeWindow && (
                               <button 
                                 onClick={handleBreakStart} 
                                 className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm"
                               >
                                 <Coffee className="w-3.5 h-3.5" /> Start
                               </button>
                            )}
                            
                            {(!isWorking || hasCheckedOut || !activeWindow || isOnBreak) && (
                               <span className="text-[10px] font-bold px-2 py-1 rounded bg-gray-100 text-gray-400">
                                  {isOnBreak ? 'UNAVAILABLE' : activeWindow ? 'READY' : 'LOCKED'}
                               </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-sm text-gray-400 font-medium">
                No active schedule assigned.
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 shrink-0">
            <h2 className="text-lg font-bold text-[#1b2559] mb-4 border-b border-gray-100 pb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => navigate('/leads/assigned')}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 hover:border-[#5f41b2] hover:bg-[#5f41b2]/5 transition group"
              >
                <Users className="w-6 h-6 text-gray-400 group-hover:text-[#5f41b2] mb-2 transition" />
                <span className="text-xs font-bold text-gray-600 group-hover:text-[#5f41b2]">Assigned Leads</span>
              </button>
              <button 
                onClick={() => navigate('/docs/pending')}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition group"
              >
                <FileText className="w-6 h-6 text-gray-400 group-hover:text-blue-500 mb-2 transition" />
                <span className="text-xs font-bold text-gray-600 group-hover:text-blue-600">Pending Docs</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Date-to-Date Attendance Tracker */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col shrink-0 overflow-hidden">
         <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-lg font-bold text-[#1b2559] flex items-center gap-2">
               <Calendar className="w-5 h-5 text-[#5f41b2]" /> Attendance History
            </h2>
            <div className="flex items-center gap-3">
               <input 
                  type="date" 
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 outline-none focus:border-[#5f41b2]"
               />
               <span className="text-sm font-bold text-gray-400">TO</span>
               <input 
                  type="date" 
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 outline-none focus:border-[#5f41b2]"
               />
               <button 
                  onClick={handleAttendanceSearch}
                  className="bg-[#1b2559] hover:bg-[#2c3979] text-white text-sm font-bold px-4 py-1.5 rounded-lg transition"
               >
                  Search
               </button>
            </div>
         </div>
         
         <div className="p-2 overflow-x-auto">
            <table className="w-full text-left text-sm">
               <thead className="bg-gray-50/50">
                  <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                     <th className="p-3">Date</th>
                     <th className="p-3 text-center">Status</th>
                     <th className="p-3 text-center">Check In</th>
                     <th className="p-3 text-center">Check Out</th>
                     <th className="p-3 text-center">Work Time</th>
                     <th className="p-3 text-center">Break / Idle</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {calendarData.map((day, idx) => (
                     <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-bold text-[#1b2559]">{new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                        <td className="p-3 text-center">
                           <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              day.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                              day.status === 'ABSENT' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                              'bg-gray-50 text-gray-500 border-gray-200'
                           }`}>
                              {day.status || 'N/A'}
                           </span>
                        </td>
                        <td className="p-3 text-center font-semibold text-gray-600">{parseTimeOnly(day.checkIn)}</td>
                        <td className="p-3 text-center font-semibold text-gray-600">{parseTimeOnly(day.checkOut)}</td>
                        <td className="p-3 text-center font-bold text-emerald-700">{Math.floor((day.totalWorkMinutes || 0) / 60)}h {(day.totalWorkMinutes || 0) % 60}m</td>
                        <td className="p-3 text-center font-semibold text-orange-600">{Math.floor((day.totalBreakMinutes || 0) / 60)}h {(day.totalBreakMinutes || 0) % 60}m / {Math.floor((day.totalIdleMinutes || 0) / 60)}h {(day.totalIdleMinutes || 0) % 60}m</td>
                     </tr>
                  ))}
                  {calendarData.length === 0 && (
                     <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-400 font-medium text-sm">
                           No attendance records found for this date range.
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

    </div>
  );
};

export default EmployeeDashboard;