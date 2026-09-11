// src/pages/Dashboard/EmployeeDashboard.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../../store';
import { fetchUserDetails } from '../../store/slices/usersSlice';
import { 
  checkIn, checkOut, startBreak, endBreak, startIdle, endIdle, 
  fetchAttendancePolicy, fetchAttendanceCalendar, fetchTodayAttendance
} from '../../store/slices/attendanceSlice';
import { fetchMyClients } from '../../store/slices/employeeClientSlice';
import { fetchPrepClients } from '../../store/slices/prepSlice';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  Clock, ChevronRight, FileText, Send, Play, Square, Coffee, 
  MonitorOff, Activity, CalendarDays, CheckCheck, IdCard, Calendar, Users, User,
  Calculator, CreditCard, AlertTriangle
} from 'lucide-react';

const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  const userDetails = useSelector((state: RootState) => state.users?.currentUser || null);
  const attendance = useSelector((state: RootState) => state.attendance?.currentAttendance || null);
  const policy = useSelector((state: RootState) => state.attendance?.currentPolicy || null);
  const calendarData = useSelector((state: RootState) => state.attendance?.calendar || []);
  
  // Bring assigned clients from doc or prep based on team
  const { clients: docClients } = useSelector((state: RootState) => state.employeeClient);
  const prepState = useSelector((state: any) => state.prep || { list: [] });
  
  const teamString = user?.departmentName || user?.teamName || user?.team || '';
  const isPrep = teamString.toUpperCase().includes('PREP');
  const assignedClients = isPrep ? (Array.isArray(prepState.list) ? prepState.list : prepState.list?.content || []) : docClients;

  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 4); // Default to last 5 days
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
  const activeData = attendance || todayStats;

  const [isWorking, setIsWorking] = useState<boolean>(() => localStorage.getItem(`att_working_${user?.id}`) === 'true');
  const [isOnBreak, setIsOnBreak] = useState<boolean>(() => localStorage.getItem(`att_break_${user?.id}`) === 'true');
  const [isIdle, setIsIdle] = useState<boolean>(() => localStorage.getItem(`att_idle_${user?.id}`) === 'true');
  
  const [currentTime, setCurrentTime] = useState(new Date());

  const hasCheckedOut = Boolean(activeData?.checkOut);

  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isIdleRef = useRef<boolean>(isIdle);
  const isWorkingRef = useRef<boolean>(isWorking);
  const isOnBreakRef = useRef<boolean>(isOnBreak);

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

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let syncInterval: NodeJS.Timeout;
    if (isWorkingRef.current && !hasCheckedOut) {
      syncInterval = setInterval(() => dispatch(fetchTodayAttendance()), 60000);
    }
    return () => { if (syncInterval) clearInterval(syncInterval); };
  }, [hasCheckedOut, dispatch]);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchUserDetails(user.id));
      dispatch(fetchTodayAttendance());
      dispatch(fetchAttendanceCalendar({ fromDate, toDate }));
      
      if (isPrep) {
        dispatch(fetchPrepClients({ page: 0, size: 50 }));
      } else {
        dispatch(fetchMyClients({ page: 0, size: 50 }));
      }
    }
  }, [dispatch, user?.id, isPrep]);

  useEffect(() => {
    if (userDetails?.attendancePolicyId) {
      dispatch(fetchAttendancePolicy(userDetails.attendancePolicyId));
    }
  }, [dispatch, userDetails?.attendancePolicyId]);

  useEffect(() => {
    if (activeData) {
      if (activeData.checkOut) {
        setIsWorking(false); setIsOnBreak(false); setIsIdle(false);
      } else if (activeData.status === 'PRESENT') {
        setIsWorking(true);
        if (activeData.breakActive !== undefined) setIsOnBreak(activeData.breakActive);
      } else if (activeData.status === 'ABSENT' || activeData.status === 'ON_LEAVE') {
        setIsWorking(false);
      }
    }
  }, [activeData]);

  const resetIdleTimer = useCallback(() => {
    if (!isWorkingRef.current || isOnBreakRef.current || hasCheckedOut) return;
    
    if (isIdleRef.current) {
      dispatch(endIdle()).unwrap().then(() => {
        isIdleRef.current = false; setIsIdle(false);
        showToast('Welcome back! Activity detected.', 'info');
        dispatch(fetchTodayAttendance());
      }).catch(err => console.error("End Idle Error:", err));
    }
    
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    
    idleTimeoutRef.current = setTimeout(() => {
      if (isWorkingRef.current && !isOnBreakRef.current) {
        dispatch(startIdle()).unwrap().then(() => {
          isIdleRef.current = true; setIsIdle(true);
          showToast('You are now Idle (No activity for 5 mins)', 'warning');
          dispatch(fetchTodayAttendance());
        }).catch(err => console.error("Start Idle Error:", err));
      }
    }, 5 * 60 * 1000); 
  }, [dispatch, showToast, hasCheckedOut]);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'scroll', 'click'];
    let throttleTimer: NodeJS.Timeout | null = null;
    
    const handleActivity = () => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => { throttleTimer = null; resetIdleTimer(); }, 1000);
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
      setIsWorking(true); showToast('Checked in successfully', 'success'); dispatch(fetchTodayAttendance());
    } catch (err: any) {
      if (String(err).toLowerCase().includes('already checked in')) {
        setIsWorking(true); showToast('Session restored: You are already checked in.', 'info');
      } else { showToast(err || 'Check-in failed', 'error'); }
    }
  };

  const handleCheckOut = async () => {
    try {
      await dispatch(checkOut()).unwrap();
      setIsWorking(false); setIsOnBreak(false);
      if (isIdleRef.current) { isIdleRef.current = false; setIsIdle(false); }
      showToast('Checked out successfully', 'success'); dispatch(fetchTodayAttendance());
    } catch (err: any) {
      const errorStr = String(err).toLowerCase();
      if (errorStr.includes('already checked out') || errorStr.includes('not checked in')) {
        setIsWorking(false); setIsOnBreak(false); setIsIdle(false); showToast('You are already checked out.', 'info');
      } else { showToast(err || 'Check-out failed', 'error'); }
    }
  };

  const handleBreakStart = async () => {
    try {
      await dispatch(startBreak()).unwrap();
      setIsOnBreak(true);
      if (isIdleRef.current) { isIdleRef.current = false; setIsIdle(false); }
      showToast('Break started', 'info'); dispatch(fetchTodayAttendance());
    } catch (err: any) {
      if (String(err).toLowerCase().includes('already on break')) {
        setIsOnBreak(true); showToast('You are already on break.', 'info');
      } else { showToast(err || 'Failed to start break', 'error'); }
    }
  };

  const handleBreakEnd = async () => {
    try {
      await dispatch(endBreak()).unwrap();
      setIsOnBreak(false); showToast('Break ended. Back to work.', 'info'); dispatch(fetchTodayAttendance());
    } catch (err: any) { showToast(err || 'Failed to end break', 'error'); }
  };

  const handleAttendanceSearch = () => { dispatch(fetchAttendanceCalendar({ fromDate, toDate })); };

  const formatMinutes = (totalMinutes: number = 0) => {
    const h = Math.floor(totalMinutes / 60); const m = totalMinutes % 60; return `${h}h ${m}m`;
  };

  const formatScheduleTime = (timeStr?: string) => {
    if (!timeStr) return '--:--';
    try {
      if (timeStr.includes('T')) return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const [hour, minute] = timeStr.split(':');
      const d = new Date(); d.setHours(parseInt(hour, 10), parseInt(minute, 10), 0);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return timeStr; }
  };

  const parseTimeOnly = (timeStr?: string) => {
    if (!timeStr) return '--:--';
    try {
      if (timeStr.includes('T')) return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return timeStr.slice(0, 5); 
    } catch { return timeStr; }
  };

  const getTeamConfig = (deptOrTeam?: string) => {
    const name = (deptOrTeam || '').toUpperCase();
    if (name.includes('PREP')) {
      return {
        queueTitle: 'Preparation Tasks',
        queueLink: '/prep/assigned',
        actionLink: (clientId: number | string) => `/prep/detail/${clientId}`,
        quickAction1: { name: 'Assigned Tasks', link: '/prep/assigned', icon: FileText, colorClass: 'hover:border-[#5f41b2] hover:bg-[#5f41b2]/5', textClass: 'group-hover:text-[#5f41b2]' },
        quickAction2: { name: 'In Progress', link: '/prep/in-progress', icon: Clock, colorClass: 'hover:border-amber-500 hover:bg-amber-50', textClass: 'group-hover:text-amber-600' }
      };
    } else if (name.includes('ESTIM')) {
      return {
        queueTitle: 'Estimation Tasks',
        queueLink: '/estimation/pending',
        actionLink: (clientId: number | string) => `/estimation/detail/${clientId}`,
        quickAction1: { name: 'Pending Est', link: '/estimation/pending', icon: FileText, colorClass: 'hover:border-[#5f41b2] hover:bg-[#5f41b2]/5', textClass: 'group-hover:text-[#5f41b2]' },
        quickAction2: { name: 'Sent Est', link: '/estimation/sent', icon: Send, colorClass: 'hover:border-blue-500 hover:bg-blue-50', textClass: 'group-hover:text-blue-600' }
      };
    } else if (name.includes('PAYMENT')) {
      return {
        queueTitle: 'Payment Invoices',
        queueLink: '/payments/pending',
        actionLink: (clientId: number | string) => `/payments/detail/${clientId}`,
        quickAction1: { name: 'Pending Pay', link: '/payments/pending', icon: CreditCard, colorClass: 'hover:border-[#5f41b2] hover:bg-[#5f41b2]/5', textClass: 'group-hover:text-[#5f41b2]' },
        quickAction2: { name: 'Completed', link: '/payments/completed', icon: CheckCheck, colorClass: 'hover:border-emerald-500 hover:bg-emerald-50', textClass: 'group-hover:text-emerald-600' }
      };
    } else if (name.includes('FILING')) {
      return {
        queueTitle: 'E-Filing Queue',
        queueLink: '/transmit/ready',
        actionLink: (clientId: number | string) => `/transmit/detail/${clientId}`,
        quickAction1: { name: 'Ready Transmit', link: '/transmit/ready', icon: Send, colorClass: 'hover:border-[#5f41b2] hover:bg-[#5f41b2]/5', textClass: 'group-hover:text-[#5f41b2]' },
        quickAction2: { name: 'Rejections', link: '/transmit/rejected', icon: AlertTriangle, colorClass: 'hover:border-rose-500 hover:bg-rose-50', textClass: 'group-hover:text-rose-600' }
      };
    }
    return {
        queueTitle: 'Assigned Work Queue',
        queueLink: '/leads/assigned',
        actionLink: (clientId: number | string) => `/leads/detail/${clientId}`,
        quickAction1: { name: 'Assigned Leads', link: '/leads/assigned', icon: Users, colorClass: 'hover:border-[#5f41b2] hover:bg-[#5f41b2]/5', textClass: 'group-hover:text-[#5f41b2]' },
        quickAction2: { name: 'Pending Docs', link: '/docs/pending', icon: FileText, colorClass: 'hover:border-blue-500 hover:bg-blue-50', textClass: 'group-hover:text-blue-600' }
    };
  };

  const teamConfig = getTeamConfig(teamString);
  const displayQueue = assignedClients.slice(0, 3);

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-y-auto pr-2 pb-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 shrink-0 items-stretch">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center gap-2 h-full">
          <div className="w-16 h-16 bg-[#f4f0fd] text-[#5f41b2] rounded-full flex items-center justify-center border border-[#5f41b2]/10 mb-1 shrink-0">
            <User className="w-8 h-8" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#1b2559] tracking-tight">
              {userDetails ? `${userDetails.firstName} ${userDetails.lastName || ''}` : user?.name}
            </h1>
            <p className="text-xs font-semibold text-gray-500 flex items-center justify-center gap-1.5 mt-1">
              <IdCard className="w-3.5 h-3.5 text-gray-400" />
              {user?.employeeCode} &bull; {userDetails?.departmentName || user?.team}
            </p>
            <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border ${
                hasCheckedOut ? 'bg-gray-100 text-gray-500 border-gray-200' :
                !isWorking ? 'bg-gray-100 text-gray-600 border-gray-200' :
                isOnBreak ? 'bg-orange-100 text-orange-700 border-orange-200' :
                isIdle ? 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse' :
                'bg-emerald-100 text-emerald-700 border-emerald-200'
              }`}>
                {hasCheckedOut ? 'SHIFT COMPLETED' : !isWorking ? 'OFFLINE' : isOnBreak ? 'ON BREAK' : isIdle ? 'IDLE' : 'WORKING'}
              </span>
              {userDetails?.workMode && (
                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-purple-100 text-purple-700 border border-purple-200">
                  {userDetails.workMode.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-4 h-full">
          <div className="text-3xl font-extrabold text-[#1b2559] tracking-tight flex items-center justify-center gap-2 w-full">
            <Clock className="w-6 h-6 text-[#5f41b2]" />
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          
          <div className="flex items-center gap-4 text-sm font-semibold text-gray-800 bg-gray-50 px-5 py-2 rounded-lg border border-gray-100">
            <p>In: <span className={activeData?.checkIn ? 'text-emerald-600 font-bold' : 'text-gray-400'}>{parseTimeOnly(activeData?.checkIn)}</span></p>
            <div className="w-px h-4 bg-gray-300"></div>
            <p>Out: <span className={activeData?.checkOut ? 'text-rose-600 font-bold' : 'text-gray-400'}>{parseTimeOnly(activeData?.checkOut)}</span></p>
          </div>

          <div className="flex items-center justify-center gap-3 w-full flex-wrap mt-1">
            {hasCheckedOut ? (
              <div className="flex items-center justify-center gap-2 bg-gray-100 text-gray-500 px-6 py-2.5 rounded-xl text-sm font-bold border border-gray-200 shadow-sm w-full sm:w-auto">
                <CheckCheck className="w-4 h-4" /> Shift Completed
              </div>
            ) : (
              <>
                {!isWorking && (
                  <button onClick={handleCheckIn} className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition shadow-sm w-full sm:w-auto">
                    <Play className="w-4 h-4 fill-current" /> Check In
                  </button>
                )}
                
                {isWorking && !isOnBreak && (
                  <button onClick={handleBreakStart} className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition shadow-sm w-full sm:w-auto">
                    <Coffee className="w-4 h-4" /> Start Break
                  </button>
                )}
                {isWorking && isOnBreak && (
                  <button onClick={handleBreakEnd} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition shadow-sm w-full sm:w-auto">
                    <Play className="w-4 h-4 fill-current" /> End Break
                  </button>
                )}
                
                {isWorking && (
                  <button onClick={handleCheckOut} className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition shadow-sm w-full sm:w-auto">
                    <Square className="w-4 h-4 fill-current" /> Check Out
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 shrink-0 items-stretch">
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Work Time</p>
                <h3 className="text-2xl font-extrabold text-[#1b2559] leading-none">{formatMinutes(activeData?.totalWorkMinutes || 0)}</h3>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                <Coffee className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Break Time</p>
                <h3 className="text-2xl font-extrabold text-[#1b2559] leading-none">{formatMinutes(activeData?.totalBreakMinutes || 0)}</h3>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                <MonitorOff className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Idle Time</p>
                <h3 className="text-2xl font-extrabold text-[#1b2559] leading-none">{formatMinutes(activeData?.totalIdleMinutes || 0)}</h3>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-[250px]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold text-[#1b2559]">{teamConfig.queueTitle}</h2>
              <button 
                onClick={() => navigate(teamConfig.queueLink)}
                className="text-sm font-bold text-[#5f41b2] hover:text-[#4d3396] hover:underline transition-all cursor-pointer"
              >
                View all
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/80 sticky top-0 z-10 backdrop-blur-sm">
                  <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <th className="p-4 rounded-tl-lg">Client Details</th>
                    <th className="p-4">Assigned Info</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right rounded-tr-lg">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {displayQueue.map((item: any, idx) => {
                    const identifierId = item.assignmentId || item.clientId;
                    return (
                    <tr 
                      key={idx} 
                      onClick={() => navigate(teamConfig.actionLink(identifierId))}
                      className="hover:bg-blue-50/50 transition group cursor-pointer"
                    >
                      <td className="p-4">
                         <p className="font-bold text-[#1b2559]">{item.clientName || item.name}</p>
                         <p className="text-[11px] font-medium text-gray-500">ID: {item.clientId}</p>
                      </td>
                      <td className="p-4">
                         {isPrep ? (
                           <div className="flex flex-col gap-0.5">
                             <p className="text-xs font-medium text-gray-700">{item.assignedBy || 'System'}</p>
                             <p className="text-[10px] text-gray-500">{new Date(item.assignedAt || new Date()).toLocaleDateString()}</p>
                           </div>
                         ) : (
                           <p className="font-semibold text-gray-700">{item.name}</p>
                         )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          item.status?.includes('REJECTED') ? 'bg-rose-100 text-rose-700' : 
                          item.status?.includes('PENDING') || item.status?.includes('NEW') || item.status?.includes('READY') ? 'bg-amber-100 text-amber-700' : 
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {item.status ? item.status.replace(/_/g, ' ') : 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(teamConfig.actionLink(identifierId));
                          }}
                          className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-400 group-hover:border-[#5f41b2] group-hover:bg-[#5f41b2] group-hover:text-white flex items-center justify-center ml-auto transition-colors shadow-sm"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )})}
                  {displayQueue.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-400 font-medium text-sm">
                            No assigned tasks found.
                        </td>
                      </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="w-full xl:w-[320px] 2xl:w-[360px] flex flex-col gap-6 shrink-0">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 shrink-0">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-4">
              <CalendarDays className="w-5 h-5 text-[#5f41b2]" />
              <h2 className="text-lg font-bold text-[#1b2559]">Policy Details</h2>
            </div>
            
            {policy ? (
              <div className="flex flex-col gap-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold w-max ${policy.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                  {policy.name}
                </span>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Shift Timing</p>
                  <p className="text-sm font-bold text-gray-800">
                    {formatScheduleTime(policy.startTime)} - {formatScheduleTime(policy.endTime)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-gray-400 font-medium">
                No active schedule assigned.
              </div>
            )}
          </div>

          <div className="flex-1 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col min-h-[200px]">
            <h2 className="text-lg font-bold text-[#1b2559] mb-4 border-b border-gray-100 pb-4 shrink-0">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4 flex-1">
              <button 
                onClick={() => navigate(teamConfig.quickAction1.link)} 
                className={`flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 transition group shadow-sm hover:shadow ${teamConfig.quickAction1.colorClass}`}
              >
                <teamConfig.quickAction1.icon className={`w-7 h-7 text-gray-400 mb-3 transition ${teamConfig.quickAction1.textClass}`} />
                <span className={`text-xs font-bold text-gray-700 text-center ${teamConfig.quickAction1.textClass}`}>{teamConfig.quickAction1.name}</span>
              </button>
              
              <button 
                onClick={() => navigate(teamConfig.quickAction2.link)} 
                className={`flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 transition group shadow-sm hover:shadow ${teamConfig.quickAction2.colorClass}`}
              >
                <teamConfig.quickAction2.icon className={`w-7 h-7 text-gray-400 mb-3 transition ${teamConfig.quickAction2.textClass}`} />
                <span className={`text-xs font-bold text-gray-700 text-center ${teamConfig.quickAction2.textClass}`}>{teamConfig.quickAction2.name}</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col shrink-0 overflow-hidden mt-6">
         <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-gray-50/50">
            <h2 className="text-lg font-bold text-[#1b2559] flex items-center gap-2">
               <Calendar className="w-5 h-5 text-[#5f41b2]" /> Attendance History
            </h2>
            <div className="flex items-center gap-3 flex-wrap">
               <input 
                  type="date" 
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-[#5f41b2]"
               />
               <span className="text-xs font-bold text-gray-400">FROM</span>
               <input 
                  type="date" 
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-[#5f41b2]"
               />
               <button 
                  onClick={handleAttendanceSearch}
                  className="bg-[#1b2559] hover:bg-[#2c3979] text-white text-sm font-bold px-5 py-2 rounded-xl transition shadow-sm"
               >
                  Search
               </button>
            </div>
         </div>
         
         <div className="p-2 overflow-x-auto">
            <table className="w-full text-left text-sm">
               <thead className="bg-gray-50/80">
                  <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                     <th className="p-4 rounded-tl-lg">Date</th>
                     <th className="p-4 text-center">Status</th>
                     <th className="p-4 text-center">Check In</th>
                     <th className="p-4 text-center">Check Out</th>
                     <th className="p-4 text-center">Work Time</th>
                     <th className="p-4 text-center rounded-tr-lg">Break / Idle</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {[...calendarData].reverse().map((day, idx) => (
                     <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="p-4 font-bold text-[#1b2559]">
                          {day.date ? day.date.split('-').reverse().join('/') : ''}
                        </td>
                        <td className="p-4 text-center">
                           <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                              day.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                              day.status === 'ABSENT' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                              'bg-gray-50 text-gray-600 border-gray-200'
                           }`}>
                              {day.status ? day.status.replace(/_/g, ' ') : 'N/A'}
                           </span>
                        </td>
                        <td className="p-4 text-center font-semibold text-gray-600">{parseTimeOnly(day.checkIn)}</td>
                        <td className="p-4 text-center font-semibold text-gray-600">{parseTimeOnly(day.checkOut)}</td>
                        <td className="p-4 text-center font-bold text-emerald-600">{formatMinutes(day.totalWorkMinutes || 0)}</td>
                        <td className="p-4 text-center font-semibold text-orange-500">{formatMinutes(day.totalBreakMinutes || 0)} / {formatMinutes(day.totalIdleMinutes || 0)}</td>
                     </tr>
                  ))}
                  {calendarData.length === 0 && (
                     <tr>
                        <td colSpan={6} className="p-10 text-center text-gray-400 font-medium text-sm">
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