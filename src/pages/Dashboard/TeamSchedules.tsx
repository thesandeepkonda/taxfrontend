// src/pages/Dashboard/TeamSchedules.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchTeamSchedule } from '../../store/slices/attendanceSlice';
import { Calendar as CalendarIcon, Clock, Users, Search, Loader2 } from 'lucide-react';

const TeamSchedules: React.FC = () => {
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get today's date for default value and max restriction
  const todayDateString = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(() => todayDateString);

  const teamName = user?.team && user.team !== 'NONE' ? user.team : 'General';
  
  // Get data from Redux state
  const { teamSchedule, loading } = useSelector((state: RootState) => state.attendance);

  // When date changes, trigger API
  useEffect(() => {
    dispatch(fetchTeamSchedule(selectedDate));
  }, [dispatch, selectedDate]);

  // Frontend Search filtering based on name or code
  const filteredSchedules = (teamSchedule || []).filter(schedule => 
    schedule.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    schedule.employeeCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Time format helper (HH:MM:SS or YYYY-MM-DDTHH:MM:SS -> HH:MM)
  const formatTime = (timeString: string | null) => {
    if (!timeString) return '--:--';
    const timePart = timeString.includes('T') ? timeString.split('T')[1] : timeString;
    return timePart.split(':').slice(0, 2).join(':');
  };

  // Minutes to Hours/Minutes converter
  const formatMinutes = (totalMinutes: number | null | undefined) => {
    if (!totalMinutes) return '0h 0m';
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div className="w-full h-full flex flex-col font-sans overflow-hidden">
      <div className="flex items-center justify-between shrink-0 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1b2559] tracking-tight leading-none flex items-center gap-3">
            <CalendarIcon className="w-7 h-7 text-[#5f41b2]" /> Team Schedules
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Shift management for {teamName} Team</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Dynamic Date Picker for API filtering - Max date set to today */}
          <input 
            type="date"
            value={selectedDate}
            max={todayDateString}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5f41b2] shadow-sm font-semibold text-gray-700"
          />

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search schedules..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5f41b2] shadow-sm w-64"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-2">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 sticky top-0 z-10">
              <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                <th className="p-4 rounded-tl-lg">Agent Name</th>
                <th className="p-4">Shift Details</th>
                <th className="p-4 text-center">In / Out</th>
                <th className="p-4 text-center">Durations</th>
                <th className="p-4 text-right rounded-tr-lg">Status & Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-gray-400 font-medium text-sm">
                    <Loader2 className="w-6 h-6 animate-spin text-[#5f41b2] mx-auto mb-2" />
                    Loading schedules...
                  </td>
                </tr>
              ) : filteredSchedules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-gray-400 font-medium text-sm">
                    No schedules found for this date.
                  </td>
                </tr>
              ) : (
                filteredSchedules.map((schedule) => (
                  <tr key={schedule.employeeId} className="hover:bg-blue-50/30 transition group">
                    <td className="p-4 font-semibold text-[#1b2559] flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate">{schedule.employeeName}</p>
                        <p className="text-[10px] text-gray-400 font-normal">{schedule.employeeCode}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1.5 text-gray-700 font-bold bg-gray-100 px-2 py-0.5 rounded-md w-max border border-gray-200 text-[11px]">
                          <Clock className="w-3 h-3 text-[#5f41b2]" /> 
                          {formatTime(schedule.shiftStartTime)} - {formatTime(schedule.shiftEndTime)}
                        </span>
                        <span className="text-[10px] text-gray-500 font-medium">{schedule.workingDays}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col gap-1 text-[11px] font-semibold">
                        <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 w-max mx-auto">
                          In: {formatTime(schedule.checkIn)}
                        </span>
                        <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 w-max mx-auto">
                          Out: {formatTime(schedule.checkOut)}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col gap-1 text-[11px]">
                        <span className="font-bold text-[#1b2559]">Work: {formatMinutes(schedule.totalWorkMinutes)}</span>
                        <span className="font-medium text-gray-500">Break: {formatMinutes(schedule.totalBreakMinutes)} | Idle: {formatMinutes(schedule.totalIdleMinutes)}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-2 justify-end flex-wrap">
                          {schedule.status && (
                            <span className={`text-[9px] font-bold uppercase border px-1.5 py-0.5 rounded ${
                              schedule.status === 'PRESENT' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                              schedule.status === 'ABSENT' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                              schedule.status === 'ON_LEAVE' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                              'bg-gray-50 text-gray-600 border-gray-200'
                            }`}>
                              {schedule.status.replace(/_/g, ' ')}
                            </span>
                          )}
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            schedule.currentStatus === 'On Shift' || schedule.currentStatus === 'Working' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                            schedule.currentStatus === 'Upcoming' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-gray-50 text-gray-500 border-gray-200'
                          }`}>
                            {schedule.currentStatus}
                          </span>
                        </div>
                        {/* Badges for Early Checkout, Late, Policy Violation */}
                        {(schedule.late || schedule.earlyCheckout || schedule.policyViolation) && (
                          <div className="flex gap-1 justify-end flex-wrap mt-0.5">
                            {schedule.late && (
                              <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">Late</span>
                            )}
                            {schedule.earlyCheckout && (
                              <span className="text-[9px] font-bold bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded border border-orange-200">Early Logout: Yes</span>
                            )}
                            {schedule.policyViolation && (
                               <span className="text-[9px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded border border-red-200">Violation</span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeamSchedules;