import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Settings,
  X
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

const Calendar: React.FC<CalendarProps> = ({ onClose, initialEvents }) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 7, 1)); // Default August 2026
  const [activeView, setActiveView] = useState<'month' | 'week' | 'day'>('month');

  // Default Event Schedule Map (Key: "YYYY-M-D")
  const defaultEvents: Record<string, CalendarEvent[]> = {
    '2026-7-4': [
      { title: 'Prep Sync Call', time: '10:00 AM', color: 'text-emerald-700', bg: 'bg-emerald-100 border-emerald-300' }
    ],
    '2026-7-8': [
      { title: 'IRS E-Filing Review', time: '02:30 PM', color: 'text-indigo-700', bg: 'bg-indigo-100 border-indigo-300' }
    ],
    '2026-7-12': [
      { title: 'Document Verification', time: '11:15 AM', color: 'text-blue-700', bg: 'bg-blue-100 border-blue-300' },
      { title: 'Client Tax Consultation', time: '04:00 PM', color: 'text-amber-700', bg: 'bg-amber-100 border-amber-300' }
    ],
    '2026-7-18': [
      { title: 'Quarterly Audit Check', time: '01:00 PM', color: 'text-rose-700', bg: 'bg-rose-100 border-rose-300' }
    ],
    '2026-7-21': [
      { title: 'IRS Return Transmission', time: '09:00 AM', color: 'text-sky-700', bg: 'bg-sky-100 border-sky-300' }
    ],
    '2026-7-24': [
      { title: 'Team Status Review', time: '03:45 PM', color: 'text-purple-700', bg: 'bg-purple-100 border-purple-300' }
    ],
    '2026-7-28': [
      { title: 'Client Billing Due', time: '05:00 PM', color: 'text-teal-700', bg: 'bg-teal-100 border-teal-300' }
    ],
    '2026-7-31': [
      { title: 'Monthly Accounts Close', time: '06:00 PM', color: 'text-orange-700', bg: 'bg-orange-100 border-orange-300' }
    ]
  };

  const eventsData = initialEvents || defaultEvents;

  // Month Navigation Handlers
  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleGoToToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  // Calendar Calculations
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Starting offset for Monday-first calendar grid (Mon=0 ... Sun=6)
  const firstDayRaw = new Date(currentYear, currentMonth, 1).getDay();
  const startingDayOffset = firstDayRaw === 0 ? 6 : firstDayRaw - 1;
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Construct complete days grid array
  const fullCalendarDays: (number | null)[] = [];
  for (let i = 0; i < startingDayOffset; i++) {
    fullCalendarDays.push(null);
  }
  for (let d = 1; d <= totalDaysInMonth; d++) {
    fullCalendarDays.push(d);
  }
  while (fullCalendarDays.length % 7 !== 0) {
    fullCalendarDays.push(null);
  }

  const today = new Date();

  return (
    <div className="w-full h-full min-h-[600px] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden border border-gray-200 select-none font-sans">
      
      {/* 1. Header Toolbar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-800 tracking-tight">Calendar</h2>
              <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full font-semibold">
                Google Schedule
              </span>
            </div>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              Plan and view client meetings, tax filings, and deadlines
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button className="flex items-center gap-2 bg-[#5f41b2] hover:bg-[#4d3396] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition active:scale-95">
            <Plus className="w-4 h-4" /> Create Event
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-800 transition border border-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* 2. Google Calendar Control Strip */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-50/80 border-b border-gray-200 shrink-0">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleGoToToday}
            className="text-xs font-bold text-gray-700 border border-gray-300 bg-white px-3.5 py-1.5 rounded-lg hover:bg-gray-100 shadow-sm transition active:scale-95"
          >
            Today
          </button>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={handlePrevMonth}
              className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-600 transition active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-600 transition active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="text-lg font-bold text-gray-800">
            {monthNames[currentMonth]} {currentYear}
          </span>
        </div>

        {/* View Switchers */}
        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-200/80 p-1 rounded-xl text-xs font-semibold text-gray-600">
            <button
              onClick={() => setActiveView('month')}
              className={`px-3.5 py-1 rounded-lg transition ${
                activeView === 'month' ? 'bg-white shadow-sm text-blue-600 font-bold' : 'hover:text-gray-900'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setActiveView('week')}
              className={`px-3.5 py-1 rounded-lg transition ${
                activeView === 'week' ? 'bg-white shadow-sm text-blue-600 font-bold' : 'hover:text-gray-900'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setActiveView('day')}
              className={`px-3.5 py-1 rounded-lg transition ${
                activeView === 'day' ? 'bg-white shadow-sm text-blue-600 font-bold' : 'hover:text-gray-900'
              }`}
            >
              Day
            </button>
          </div>
        </div>
      </div>

      {/* 3. Full-Month Calendar Grid */}
      <div className="flex-1 flex flex-col bg-gray-200 gap-[1px] p-[1px] min-h-0 overflow-y-auto">
        
        {/* Weekdays Row (Mon -> Sun) */}
        <div className="grid grid-cols-7 bg-white text-center py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wider shrink-0 border-b border-gray-100">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span className="text-rose-500">Sat</span>
          <span className="text-rose-500">Sun</span>
        </div>

        {/* Calendar Day Cells */}
        <div className="grid grid-cols-7 auto-rows-fr gap-[1px] flex-1 bg-gray-200 min-h-0">
          {fullCalendarDays.map((dayNum, index) => {
            const eventKey = dayNum ? `${currentYear}-${currentMonth}-${dayNum}` : '';
            const dayEvents = dayNum ? eventsData[eventKey] : null;

            const isToday =
              dayNum !== null &&
              today.getDate() === dayNum &&
              today.getMonth() === currentMonth &&
              today.getFullYear() === currentYear;

            return (
              <div
                key={index}
                className={`bg-white p-2.5 min-h-[105px] flex flex-col justify-between transition group hover:bg-blue-50/20 ${
                  !dayNum ? 'bg-gray-50/50' : ''
                }`}
              >
                {/* Date Number */}
                <div className="flex items-center justify-between">
                  {dayNum ? (
                    <span
                      className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold transition ${
                        isToday
                          ? 'bg-blue-600 text-white font-bold shadow-sm'
                          : 'text-gray-700 group-hover:text-blue-600 group-hover:bg-blue-50'
                      }`}
                    >
                      {dayNum}
                    </span>
                  ) : (
                    <span />
                  )}
                </div>

                {/* Event Pills */}
                <div className="flex-1 flex flex-col gap-1.5 mt-1.5 overflow-hidden">
                  {dayEvents &&
                    dayEvents.map((evt, eIdx) => (
                      <div
                        key={eIdx}
                        className={`px-2 py-1 rounded-md text-[11px] font-semibold border flex items-center justify-between ${evt.bg} ${evt.color} shadow-xs truncate cursor-pointer hover:opacity-90 transition`}
                      >
                        <span className="truncate">{evt.title}</span>
                        {evt.time && <span className="text-[9px] opacity-75 pl-1.5 shrink-0">{evt.time}</span>}
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
};

export default Calendar;