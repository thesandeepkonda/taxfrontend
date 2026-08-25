// src/hooks/Calendar.tsx
import React, { useState, useEffect } from 'react';
import {
  X,
  RotateCcw,
  Calendar as CalendarIcon,
} from 'lucide-react';

export interface CalendarEvent {
  title: string;
  time?: string;
  color: string;
  bg: string;
}

interface CalendarProps {
  onClose?: () => void;
  initialEvents?: Record<string, CalendarEvent[]>;
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
  const [showMonthDropdownCard1, setShowMonthDropdownCard1] = useState<boolean>(false);

  // Check if currently selected date is today's date
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
    setShowMonthDropdownCard1(false);
  };

  const goToPrevMonth = () => setViewMonth(new Date(currentYear, currentMonth - 1, 1));
  const goToNextMonth = () => setViewMonth(new Date(currentYear, currentMonth + 1, 1));

  const handleDateClick = (day: number) => {
    setSelectedDate(new Date(currentYear, currentMonth, day));
  };

  const handleMonthSelect = (monthIndex: number) => {
    setViewMonth(new Date(currentYear, monthIndex, 1));
    setSelectedDate(new Date(currentYear, monthIndex, Math.min(selectedDate.getDate(), new Date(currentYear, monthIndex + 1, 0).getDate())));
    setShowMonthDropdown(false);
    setShowMonthDropdownCard1(false);
  };

  const handleYearSelect = (year: number) => {
    setSelectedDate(new Date(year, selectedDate.getMonth(), selectedDate.getDate()));
    setViewMonth(new Date(year, viewMonth.getMonth(), 1));
  };

  const formattedDate = selectedDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="w-full h-full min-h-[600px] bg-[#F8F9FA] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 select-none font-sans relative">
      {/* Top Action Buttons */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <button
          onClick={resetToToday}
          disabled={isCurrentDate}
          title={isCurrentDate ? 'Already on Today' : 'Reset to Today'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs transition border shadow-sm ${
            isCurrentDate
              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
              : 'bg-white hover:bg-gray-100 text-[#6200EE] border-gray-200 cursor-pointer'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Today</span>
        </button>

        {onClose && (
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-800 transition border border-gray-200 shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Scrollable Container with Hidden Scrollbar */}
      <div className="flex-1 p-6 md:p-8 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
          
          {/* COLUMN 1 */}
          <div className="flex flex-col gap-8">
            <div className="bg-white rounded-lg shadow-md overflow-hidden w-full max-w-[328px]">
              <div className="bg-[#6200EE] p-4 text-white">
                <p className="text-[10px] font-medium tracking-wider uppercase opacity-90">ENTER DATE</p>
                <div className="flex justify-between items-center mt-2">
                  <h2 className="text-2xl font-normal">Select date</h2>
                  <button className="text-white hover:opacity-80">
                    <CalendarIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="bg-[#ECEFF1] rounded-t border-b-2 border-[#6200EE] px-3 pt-2 pb-1 relative">
                  <label className="block text-[11px] font-medium text-[#6200EE]">Date</label>
                  <input
                    type="text"
                    value={selectedDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                    className="w-full bg-transparent text-sm text-gray-700 font-medium focus:outline-none"
                    readOnly
                  />
                </div>
                <div className="flex justify-between items-center mt-8">
                  <button
                    onClick={resetToToday}
                    disabled={isCurrentDate}
                    className={`text-xs font-bold tracking-wider uppercase flex items-center gap-1 transition ${
                      isCurrentDate
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-500 hover:text-[#6200EE] cursor-pointer'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> TODAY
                  </button>
                  <div className="flex gap-6 text-xs font-bold tracking-wider text-[#6200EE] uppercase">
                    <button className="hover:opacity-80" onClick={onClose}>CANCEL</button>
                    <button className="hover:opacity-80" onClick={onClose}>OK</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden w-full max-w-[328px] relative">
              <div className="bg-[#6200EE] p-4 text-white">
                <p className="text-[10px] font-medium tracking-wider uppercase opacity-90">SELECTED DATE</p>
                <div className="flex justify-between items-center mt-2">
                  <h2 className="text-2xl font-normal">{formattedDate}</h2>
                  <button
                    disabled={isCurrentDate}
                    className={`text-white transition ${isCurrentDate ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-80 cursor-pointer'}`}
                    onClick={resetToToday}
                    title={isCurrentDate ? 'Already on Today' : 'Jump to Today'}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4 relative">
                <div className="flex justify-between items-center text-xs font-medium text-gray-700 px-2 mb-4">
                  <div
                    className="flex items-center gap-1 cursor-pointer bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                    onClick={() => setShowMonthDropdownCard1(!showMonthDropdownCard1)}
                  >
                    <span>{monthNames[currentMonth]} {currentYear}</span>
                    <svg className={`w-4 h-4 transition-transform ${showMonthDropdownCard1 ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div className="flex items-center gap-4 text-gray-600">
                    <button onClick={goToPrevMonth} className="hover:text-black">&lt;</button>
                    <button onClick={goToNextMonth} className="hover:text-black">&gt;</button>
                  </div>
                </div>

                {showMonthDropdownCard1 && (
                  <div className="absolute inset-x-4 top-14 bg-white shadow-xl rounded-lg border border-gray-200 p-3 z-30 grid grid-cols-3 gap-2">
                    {monthNames.map((m, idx) => (
                      <button
                        key={m}
                        className={`py-1.5 text-xs rounded-md transition ${
                          idx === currentMonth
                            ? 'bg-[#6200EE] text-white font-bold'
                            : 'hover:bg-[#6200EE]/10 text-gray-700'
                        }`}
                        onClick={() => handleMonthSelect(idx)}
                      >
                        {m.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-400 mb-2">
                  <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
                </div>
                <div className="grid grid-cols-7 text-center text-xs text-gray-700 gap-y-1">
                  {fullCalendarDays.slice(0, 7).map((day, idx) => (
                    <span key={idx} className="py-1">{day || ''}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 2 */}
          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-lg shadow-md p-4 w-full max-w-[280px]">
              <div className="grid grid-cols-4 gap-y-3 gap-x-2 text-center text-xs text-gray-700">
                {Array.from({ length: 20 }, (_, i) => today.getFullYear() - 5 + i).map((year) => (
                  <span
                    key={year}
                    className={`py-1 cursor-pointer hover:bg-[#6200EE]/10 rounded-full transition ${
                      year === selectedDate.getFullYear()
                        ? 'bg-[#6200EE] text-white rounded-full font-medium'
                        : ''
                    }`}
                    onClick={() => handleYearSelect(year)}
                  >
                    {year}
                  </span>
                ))}
              </div>
            </div>

            <div className="w-full max-w-[280px]">
              <div className="bg-[#ECEFF1] rounded-t border-b-2 border-[#6200EE] px-3 pt-2 pb-1">
                <label className="block text-[11px] font-medium text-[#6200EE]">Date</label>
                <div className="text-sm font-semibold text-gray-800">
                  {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 w-full max-w-[280px] relative">
              <div className="flex justify-between items-center text-xs font-medium text-gray-700 mb-4 px-1">
                <div
                  className="flex items-center gap-1 cursor-pointer bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                  onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                >
                  <span>{monthNames[currentMonth]} {currentYear}</span>
                  <svg className={`w-4 h-4 transition-transform ${showMonthDropdown ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </div>

                <div className="flex items-center gap-3 text-gray-600">
                  <button onClick={goToPrevMonth} className="hover:text-black">&lt;</button>
                  <button onClick={goToNextMonth} className="hover:text-black">&gt;</button>
                </div>
              </div>

              {showMonthDropdown && (
                <div className="absolute inset-x-3 top-12 bg-white shadow-xl rounded-lg border border-gray-200 p-3 z-30 grid grid-cols-3 gap-2">
                  {monthNames.map((m, idx) => (
                    <button
                      key={m}
                      className={`py-2 text-xs rounded-md transition ${
                        idx === currentMonth
                          ? 'bg-[#6200EE] text-white font-bold'
                          : 'hover:bg-[#6200EE]/10 text-gray-700'
                      }`}
                      onClick={() => handleMonthSelect(idx)}
                    >
                      {m.slice(0, 3)}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-400 mb-3">
                <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
              </div>

              <div className="grid grid-cols-7 text-center text-xs text-gray-700 gap-y-2 items-center">
                {fullCalendarDays.map((day, index) => {
                  if (day === null) return <span key={index}></span>;
                  const isSelected =
                    selectedDate.getDate() === day &&
                    selectedDate.getMonth() === currentMonth &&
                    selectedDate.getFullYear() === currentYear;
                  const isToday =
                    today.getDate() === day &&
                    today.getMonth() === currentMonth &&
                    today.getFullYear() === currentYear;

                  return (
                    <span
                      key={index}
                      className={`w-7 h-7 mx-auto flex items-center justify-center rounded-full cursor-pointer transition ${
                        isSelected
                          ? 'bg-[#6200EE] text-white font-bold'
                          : isToday
                          ? 'border border-gray-800 font-semibold'
                          : 'hover:bg-[#6200EE]/10'
                      }`}
                      onClick={() => handleDateClick(day)}
                    >
                      {day}
                    </span>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-center">
                <button
                  onClick={resetToToday}
                  disabled={isCurrentDate}
                  className={`text-xs font-bold flex items-center gap-1 uppercase tracking-wider transition ${
                    isCurrentDate
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-[#6200EE] hover:opacity-80 cursor-pointer'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Jump to Current Date
                </button>
              </div>
            </div>
          </div>

          {/* COLUMN 3: Live Real-Time Analog Clock */}
          <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-[328px] flex flex-col justify-between">
            <p className="text-[10px] font-medium tracking-wider uppercase text-gray-500 mb-4">CURRENT TIME</p>

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-1.5">
                <div className="bg-[#f2e7fe] text-[#6200EE] text-4xl font-light w-14 h-16 rounded flex items-center justify-center">
                  {displayHour}
                </div>
                <span className="text-2xl font-light text-gray-800">:</span>
                <div className="bg-[#ECEFF1] text-gray-800 text-4xl font-light w-14 h-16 rounded flex items-center justify-center">
                  {displayMinute}
                </div>
                <span className="text-2xl font-light text-gray-800">:</span>
                <div className="bg-[#ECEFF1] text-rose-500 text-4xl font-light w-14 h-16 rounded flex items-center justify-center">
                  {displaySecond}
                </div>
              </div>

              <div className="border border-gray-300 rounded overflow-hidden flex flex-col text-xs font-medium">
                <span className={`px-3 py-2 ${isAM ? 'bg-[#f2e7fe] text-[#6200EE] font-bold' : 'text-gray-400'}`}>
                  AM
                </span>
                <span className={`px-3 py-2 ${!isAM ? 'bg-[#f2e7fe] text-[#6200EE] font-bold' : 'text-gray-400'}`}>
                  PM
                </span>
              </div>
            </div>

            <div className="relative w-56 h-56 bg-[#ECEFF1] rounded-full mx-auto flex items-center justify-center mb-8 shadow-inner">
              <div className="w-3 h-3 bg-[#6200EE] rounded-full z-20 shadow"></div>

              {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num) => {
                const angle = (num / 12) * 360 - 90;
                const radius = 86;
                const x = 112 + radius * Math.cos((angle * Math.PI) / 180);
                const y = 112 + radius * Math.sin((angle * Math.PI) / 180);
                const isCurrentHour = (hours24 % 12 || 12) === num;

                return (
                  <span
                    key={num}
                    className={`absolute text-xs font-semibold select-none ${
                      isCurrentHour
                        ? 'w-7 h-7 bg-[#6200EE] text-white rounded-full flex items-center justify-center'
                        : 'text-gray-700'
                    }`}
                    style={{ left: `${x}px`, top: `${y}px`, transform: 'translate(-50%, -50%)' }}
                  >
                    {num}
                  </span>
                );
              })}

              <div
                className="absolute w-1 h-[52px] bg-[#6200EE] rounded-full origin-bottom bottom-1/2 left-[calc(50%-2px)] z-10"
                style={{
                  transform: `rotate(${hourDeg}deg)`,
                  transition: 'transform 0.2s cubic-bezier(0.4, 2.08, 0.55, 0.44)'
                }}
              />

              <div
                className="absolute w-0.5 h-[72px] bg-gray-700 rounded-full origin-bottom bottom-1/2 left-[calc(50%-1px)] z-10"
                style={{
                  transform: `rotate(${minuteDeg}deg)`,
                  transition: 'transform 0.2s cubic-bezier(0.4, 2.08, 0.55, 0.44)'
                }}
              />

              <div
                className="absolute w-[1.5px] h-[82px] bg-rose-500 origin-bottom bottom-1/2 left-[calc(50%-0.75px)] z-10"
                style={{
                  transform: `rotate(${secondDeg}deg)`,
                  transition: secondDeg === 0 ? 'none' : 'transform 0.15s cubic-bezier(0.4, 2.08, 0.55, 0.44)'
                }}
              />
            </div>

            <div className="flex justify-end gap-6 text-xs font-bold tracking-wider text-[#6200EE] uppercase pt-2">
              <button className="hover:opacity-80" onClick={onClose}>CLOSE</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Calendar;