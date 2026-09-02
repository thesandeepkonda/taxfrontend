// src/hooks/Calendar.tsx
import React, { useState, useEffect } from 'react';
import { X, RotateCcw, ChevronLeft, ChevronRight, ChevronDown, Clock, CalendarDays, MapPin } from 'lucide-react';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  color: string;
}

interface CalendarProps {
  onClose?: () => void;
  initialEvents?: CalendarEvent[];
}

const Calendar: React.FC<CalendarProps> = ({ onClose }) => {
  const today = new Date();

  // ---------- Real-time Clock State ----------
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours24 = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const seconds = currentTime.getSeconds();

  const isAM = hours24 < 12;
  const displayHour = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const displayMinute = String(minutes).padStart(2, '0');
  const displaySecond = String(seconds).padStart(2, '0');

  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = (hours24 % 12) * 30 + minutes * 0.5;

  // ---------- Calendar State ----------
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [viewMonth, setViewMonth] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));
  const [showMonthDropdown, setShowMonthDropdown] = useState<boolean>(false);

  const isCurrentDate =
    selectedDate.getDate() === today.getDate() &&
    selectedDate.getMonth() === today.getMonth() &&
    selectedDate.getFullYear() === today.getFullYear() &&
    viewMonth.getMonth() === today.getMonth() &&
    viewMonth.getFullYear() === today.getFullYear();

  const currentYear = viewMonth.getFullYear();
  const currentMonth = viewMonth.getMonth();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Monday‑first offset
  const firstDayRaw = new Date(currentYear, currentMonth, 1).getDay();
  const startingDayOffset = firstDayRaw === 0 ? 6 : firstDayRaw - 1;
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const fullCalendarDays: (number | null)[] = [];
  for (let i = 0; i < startingDayOffset; i++) fullCalendarDays.push(null);
  for (let d = 1; d <= totalDaysInMonth; d++) fullCalendarDays.push(d);
  while (fullCalendarDays.length % 7 !== 0) fullCalendarDays.push(null);

  // ---------- Handlers ----------
  const resetToToday = () => {
    if (isCurrentDate) return;
    const now = new Date();
    setSelectedDate(now);
    setViewMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setShowMonthDropdown(false);
  };

  const goToPrevMonth = () => setViewMonth(new Date(currentYear, currentMonth - 1, 1));
  const goToNextMonth = () => setViewMonth(new Date(currentYear, currentMonth + 1, 1));

  const handleDateClick = (day: number) => {
    setSelectedDate(new Date(currentYear, currentMonth, day));
  };

  const handleMonthSelect = (monthIndex: number) => {
    setViewMonth(new Date(currentYear, monthIndex, 1));
    setSelectedDate(
      new Date(currentYear, monthIndex, Math.min(selectedDate.getDate(), new Date(currentYear, monthIndex + 1, 0).getDate()))
    );
    setShowMonthDropdown(false);
  };

  const handleYearSelect = (year: number) => {
    setSelectedDate(new Date(year, selectedDate.getMonth(), selectedDate.getDate()));
    setViewMonth(new Date(year, viewMonth.getMonth(), 1));
  };

  // Mock Events
  const mockEvents: CalendarEvent[] = [
    { id: '1', title: 'Team Meeting', date: 'Mon, 26 Aug', time: '10:00 AM', location: 'Zoom', color: 'bg-blue-50 border-blue-200 text-blue-900' },
    { id: '2', title: 'Client Call', date: 'Tue, 27 Aug', time: '02:30 PM', location: 'Phone', color: 'bg-amber-50 border-amber-200 text-amber-900' },
    { id: '3', title: 'File Review', date: 'Wed, 28 Aug', time: '11:15 AM', location: 'Office', color: 'bg-emerald-50 border-emerald-200 text-emerald-900' },
    { id: '4', title: 'IRS Deadline', date: 'Thu, 29 Aug', time: 'All Day', location: 'Online', color: 'bg-rose-50 border-rose-200 text-rose-900' },
    { id: '5', title: 'Payment Due', date: 'Fri, 30 Aug', time: '05:00 PM', location: 'Portal', color: 'bg-orange-50 border-orange-200 text-orange-900' },
    { id: '6', title: 'Team Sync', date: 'Sat, 31 Aug', time: '09:00 AM', location: 'Slack', color: 'bg-purple-50 border-purple-200 text-purple-900' },
  ];

  return (
    <div className="w-full h-full bg-slate-50 rounded-2xl shadow-xl flex flex-col overflow-hidden border border-slate-200 font-sans select-none relative">
      
      {/* Top Floating Controls */}
      <header className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 bg-white border-b border-slate-200 shrink-0 z-20">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-[#5f41b2]" />
          <h2 className="text-base sm:text-lg font-bold text-[#1b2559]">System Calendar</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetToToday}
            disabled={isCurrentDate}
            title={isCurrentDate ? 'Already on Today' : 'Reset to Today'}
            className={`min-h-[44px] sm:min-h-[36px] flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition border shadow-xs ${
              isCurrentDate
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                : 'bg-white hover:bg-slate-100 text-[#5f41b2] border-slate-300 cursor-pointer active:scale-95'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Today</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Calendar"
              className="min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] rounded-xl bg-white hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition border border-slate-200 shadow-xs cursor-pointer active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* Main Responsive Grid Layout */}
      <div className="flex-1 p-3.5 sm:p-6 lg:p-8 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-7xl mx-auto items-start">
          
          {/* ========================================================
              COLUMN 1: UPCOMING EVENTS
             ======================================================== */}
          <div className="w-full bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-[#5f41b2] p-4 text-white flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold tracking-wider uppercase opacity-80">Workspace Activity</p>
                <h3 className="text-xl font-bold tracking-tight">Upcoming Events</h3>
              </div>
              <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-semibold">
                {mockEvents.length} Tasks
              </span>
            </div>
            
            <div className="p-3.5 sm:p-4 space-y-2.5 max-h-[320px] md:max-h-[480px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {mockEvents.map((event) => (
                <div
                  key={event.id}
                  className={`rounded-xl border p-3 transition hover:shadow-xs ${event.color}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <p className="font-bold text-xs sm:text-sm truncate">{event.title}</p>
                    <span className="text-[10px] font-semibold opacity-75 shrink-0">{event.time}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] opacity-80 mt-1">
                    <span>{event.date}</span>
                    {event.location && (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-3 h-3 inline" />
                        {event.location}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================
              COLUMN 2: CALENDAR & YEAR SELECTOR
             ======================================================== */}
          <div className="w-full flex flex-col gap-4">
            
            {/* Year Selector Box */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-3.5 sm:p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Year</p>
              <div className="h-28 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pr-1">
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 text-center text-xs">
                  {Array.from({ length: 101 }, (_, i) => 1980 + i).map((year) => (
                    <button
                      key={year}
                      type="button"
                      onClick={() => handleYearSelect(year)}
                      className={`py-1.5 rounded-lg text-xs transition cursor-pointer min-h-[36px] flex items-center justify-center ${
                        year === selectedDate.getFullYear()
                          ? 'bg-[#5f41b2] text-white font-bold shadow-xs'
                          : 'text-slate-700 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Interactive Date Grid */}
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-3.5 sm:p-4 relative">
              
              {/* Month Selector Bar */}
              <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-3 px-1">
                <button
                  type="button"
                  onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl min-h-[36px] transition cursor-pointer"
                >
                  <span>{monthNames[currentMonth]} {currentYear}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${showMonthDropdown ? 'rotate-180' : ''}`} />
                </button>

                <div className="flex items-center gap-1">
                  <button 
                    type="button" 
                    onClick={goToPrevMonth} 
                    aria-label="Previous Month"
                    className="p-1.5 min-h-[36px] min-w-[36px] rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    type="button" 
                    onClick={goToNextMonth} 
                    aria-label="Next Month"
                    className="p-1.5 min-h-[36px] min-w-[36px] rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Month Dropdown Overlay */}
              {showMonthDropdown && (
                <div className="absolute inset-x-3.5 top-14 bg-white shadow-xl rounded-xl border border-slate-200 p-2.5 z-30 grid grid-cols-3 gap-1.5 animate-in fade-in">
                  {monthNames.map((m, idx) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleMonthSelect(idx)}
                      className={`py-2 text-xs rounded-lg transition min-h-[40px] font-medium ${
                        idx === currentMonth
                          ? 'bg-[#5f41b2] text-white font-bold'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {m.slice(0, 3)}
                    </button>
                  ))}
                </div>
              )}

              {/* Weekday Labels */}
              <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-400 mb-2">
                <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
              </div>

              {/* Day Cells (Standardized 44px on touch) */}
              <div className="grid grid-cols-7 text-center text-xs text-slate-700 gap-y-1.5 items-center">
                {fullCalendarDays.map((day, index) => {
                  if (day === null) return <span key={index} aria-hidden="true" />;
                  
                  const isSelected =
                    selectedDate.getDate() === day &&
                    selectedDate.getMonth() === currentMonth &&
                    selectedDate.getFullYear() === currentYear;
                  const isToday =
                    today.getDate() === day &&
                    today.getMonth() === currentMonth &&
                    today.getFullYear() === currentYear;

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleDateClick(day)}
                      className={`w-8 h-8 sm:w-8 sm:h-8 mx-auto flex items-center justify-center rounded-xl cursor-pointer transition min-h-[36px] sm:min-h-0 ${
                        isSelected
                          ? 'bg-[#5f41b2] text-white font-bold shadow-xs'
                          : isToday
                          ? 'border border-[#5f41b2] text-[#5f41b2] font-bold'
                          : 'hover:bg-slate-100 text-slate-700 font-medium'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* Selected Date Indicator Card */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Active Date:</span>
                <span className="font-bold text-[#1b2559]">
                  {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================
              COLUMN 3: LIVE ANALOG & DIGITAL CLOCK
             ======================================================== */}
          <div className="w-full bg-white rounded-2xl shadow-xs border border-slate-200 p-4 sm:p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Current Time</span>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>

            {/* Digital Readout */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-1 sm:gap-1.5 font-light">
                <div className="bg-[#f4f0fd] text-[#5f41b2] text-2xl sm:text-3xl w-11 h-13 sm:w-12 sm:h-14 rounded-xl font-bold flex items-center justify-center">
                  {displayHour}
                </div>
                <span className="text-xl text-slate-400 font-bold">:</span>
                <div className="bg-slate-100 text-slate-800 text-2xl sm:text-3xl w-11 h-13 sm:w-12 sm:h-14 rounded-xl font-bold flex items-center justify-center">
                  {displayMinute}
                </div>
                <span className="text-xl text-slate-400 font-bold">:</span>
                <div className="bg-slate-100 text-rose-500 text-2xl sm:text-3xl w-11 h-13 sm:w-12 sm:h-14 rounded-xl font-bold flex items-center justify-center">
                  {displaySecond}
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col text-[10px] font-bold">
                <span className={`px-2.5 py-1.5 ${isAM ? 'bg-[#5f41b2] text-white' : 'text-slate-400'}`}>AM</span>
                <span className={`px-2.5 py-1.5 ${!isAM ? 'bg-[#5f41b2] text-white' : 'text-slate-400'}`}>PM</span>
              </div>
            </div>

            {/* Fluid Scaled Analog Dial */}
            <div 
              className="relative rounded-full mx-auto flex items-center justify-center my-2 bg-slate-100 border border-slate-200 shadow-inner"
              style={{
                width: 'clamp(170px, 22vw, 210px)',
                height: 'clamp(170px, 22vw, 210px)'
              }}
            >
              {/* Dial Center Pin */}
              <div className="w-3 h-3 bg-[#5f41b2] rounded-full z-20 shadow-xs" />

              {/* Dial Numbers */}
              {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num) => {
                const angle = (num / 12) * 360 - 90;
                const radius = 74;
                const x = 95 + radius * Math.cos((angle * Math.PI) / 180);
                const y = 95 + radius * Math.sin((angle * Math.PI) / 180);
                const isCurrentHour = (hours24 % 12 || 12) === num;

                return (
                  <span
                    key={num}
                    className={`absolute text-[11px] font-bold select-none ${
                      isCurrentHour ? 'text-[#5f41b2]' : 'text-slate-500'
                    }`}
                    style={{ left: `${x}px`, top: `${y}px`, transform: 'translate(-50%, -50%)' }}
                  >
                    {num}
                  </span>
                );
              })}

              {/* Hour Hand */}
              <div
                className="absolute w-1 h-[44px] bg-[#5f41b2] rounded-full origin-bottom bottom-1/2 left-[calc(50%-2px)] z-10"
                style={{
                  transform: `rotate(${hourDeg}deg)`,
                  transition: 'transform 0.2s cubic-bezier(0.4, 2.08, 0.55, 0.44)'
                }}
              />

              {/* Minute Hand */}
              <div
                className="absolute w-0.5 h-[60px] bg-slate-700 rounded-full origin-bottom bottom-1/2 left-[calc(50%-1px)] z-10"
                style={{
                  transform: `rotate(${minuteDeg}deg)`,
                  transition: 'transform 0.2s cubic-bezier(0.4, 2.08, 0.55, 0.44)'
                }}
              />

              {/* Second Hand */}
              <div
                className="absolute w-[1.5px] h-[72px] bg-rose-500 origin-bottom bottom-1/2 left-[calc(50%-0.75px)] z-10"
                style={{
                  transform: `rotate(${secondDeg}deg)`,
                  transition: secondDeg === 0 ? 'none' : 'transform 0.15s cubic-bezier(0.4, 2.08, 0.55, 0.44)'
                }}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Calendar;