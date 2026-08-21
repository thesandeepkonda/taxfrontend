import React, { useState } from 'react';
import {
  Sparkles,
  ChevronDown,
  Inbox,
  User,
  CheckCircle2,
  MessageSquare,
  Crown,
  Award,
  Calendar as CalendarIcon
} from 'lucide-react';

// Import the standalone Calendar from hooks
import Calendar from '../../hooks/Calendar';

// Local Image Imports
import v0_713 from './images/v0_713.png';
import v0_229 from './images/v0_229.png';
import v0_260 from './images/v0_260.png';
import v0_267 from './images/v0_267.png';
import v0_274 from './images/v0_274.png';
import v0_390 from './images/v0_390.png';
import v0_396 from './images/v0_396.png';

const AdminDashboard: React.FC = () => {
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);

  return (
    <div className="w-full h-full flex flex-col justify-between select-none font-sans overflow-hidden relative">
      
      {/* Top Banner (Greeting, Sparkle Header & Calendar Action) */}
      <div className="flex items-center justify-between shrink-0 mb-3">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[#5f41b2] fill-[#5f41b2]" />
            </div>
            <span className="text-lg font-bold text-[#5f41b2] tracking-tight">Sparkle</span>
          </div>

          <div className="h-5 w-[1px] bg-gray-300" />

          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#1b2559] tracking-tight leading-none">
              Hi Nimi,
            </h1>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              It's looking like a slow day.
            </p>
          </div>
        </div>

        {/* Right Header Actions (Full Calendar Button & Profile) */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsCalendarOpen(true)}
            className="flex items-center gap-1.5 bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-full shadow-sm text-xs font-semibold transition active:scale-95"
          >
            <CalendarIcon className="w-4 h-4 text-blue-600" />
            <span>Open Calendar</span>
          </button>

          <div className="flex items-center space-x-2 cursor-pointer bg-white px-2.5 py-1 rounded-full shadow-sm border border-gray-100 hover:shadow transition">
            <img
              src={v0_713}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80';
              }}
              alt="Nimi User Avatar"
              className="w-6 h-6 rounded-full object-cover border border-white shadow-sm"
            />
            <span className="text-xs font-semibold text-gray-700">Nimi</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
        
        {/* Left Column: KPI Cards + Spline Chart + Table */}
        <div className="flex-1 flex flex-col justify-between min-h-0 gap-3">
          
          {/* 4 KPI Cards */}
          <div className="grid grid-cols-4 gap-3 shrink-0">
            <div className="bg-white rounded-xl p-3 flex items-center space-x-3 shadow-sm border border-gray-100">
              <div className="w-10 h-10 rounded-full bg-[#f4f7fe] flex items-center justify-center text-[#5f41b2] shrink-0">
                <Inbox className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-gray-400 truncate">Unassigned</p>
                <h3 className="text-lg font-bold text-[#1b2559]">350</h3>
              </div>
            </div>

            <div className="bg-white rounded-xl p-3 flex items-center space-x-3 shadow-sm border border-gray-100">
              <div className="w-10 h-10 rounded-full bg-[#f4f7fe] flex items-center justify-center text-[#5f41b2] shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-gray-400 truncate">Assigned</p>
                <h3 className="text-lg font-bold text-[#1b2559]">450</h3>
              </div>
            </div>

            <div className="bg-white rounded-xl p-3 flex items-center space-x-3 shadow-sm border border-gray-100">
              <div className="w-10 h-10 rounded-full bg-[#f4f7fe] flex items-center justify-center text-[#5f41b2] shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-gray-400 truncate">Closed</p>
                <h3 className="text-lg font-bold text-[#1b2559]">3500</h3>
              </div>
            </div>

            <div className="bg-white rounded-xl p-3 flex items-center space-x-3 shadow-sm border border-gray-100">
              <div className="w-10 h-10 rounded-full bg-[#f4f7fe] flex items-center justify-center text-[#5f41b2] shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-gray-400 truncate">Channels</p>
                <h3 className="text-lg font-bold text-[#1b2559]">3</h3>
              </div>
            </div>
          </div>

          {/* Graph Container */}
          <div className="flex-1 bg-white rounded-xl p-3.5 shadow-sm border border-gray-100 flex flex-col justify-between min-h-0">
            <div className="flex items-center justify-between shrink-0 mb-1">
              <div className="flex items-center space-x-1 cursor-pointer">
                <span className="text-xs font-bold text-[#1b2559]">Today</span>
                <ChevronDown className="w-3 h-3 text-gray-500" />
              </div>
              <div className="flex items-center space-x-3 text-[10px] font-medium text-gray-400">
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-[#5f41b2]" />
                  <span>Today</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-gray-300" />
                  <span>Yesterday</span>
                </div>
              </div>
            </div>

            {/* Spline Chart */}
            <div className="relative flex-1 w-full min-h-0 flex items-center">
              <div className="w-full h-full flex flex-col justify-between py-1 text-[9px] text-gray-400">
                <div className="flex items-center w-full">
                  <span className="w-4 text-right pr-1">30</span>
                  <div className="flex-1 border-b border-dashed border-gray-100" />
                </div>
                <div className="flex items-center w-full">
                  <span className="w-4 text-right pr-1">20</span>
                  <div className="flex-1 border-b border-dashed border-gray-100" />
                </div>
                <div className="flex items-center w-full">
                  <span className="w-4 text-right pr-1">10</span>
                  <div className="flex-1 border-b border-dashed border-gray-100" />
                </div>
                <div className="flex items-center w-full">
                  <span className="w-4 text-right pr-1">0</span>
                  <div className="flex-1 border-b border-dashed border-gray-100" />
                </div>
              </div>

              <svg
                className="absolute inset-0 w-full h-full pl-6 pr-2 py-2 overflow-visible"
                viewBox="0 0 700 120"
                preserveAspectRatio="none"
              >
                <path
                  d="M 0,110 Q 70,105 130,85 T 260,20 T 380,45 T 510,75 T 700,110"
                  fill="none"
                  stroke="#d9dde2"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M 0,110 Q 70,95 130,70 T 260,10 T 380,35 T 510,65 T 700,110"
                  fill="none"
                  stroke="#5f41b2"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>

              <div className="absolute left-[46%] top-[10%] bg-white px-2.5 py-1 rounded-md shadow-md border border-gray-100 text-[9px] space-y-0.5 pointer-events-none z-10">
                <div className="flex items-center justify-between space-x-2 font-semibold text-[#5f41b2]">
                  <span>Today</span>
                  <span>25</span>
                </div>
                <div className="flex items-center justify-between space-x-2 text-gray-400">
                  <span>Yesterday</span>
                  <span>23</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between text-[9px] text-gray-400 pt-1 shrink-0 px-6 font-medium">
              <span>10:23 PM</span>
              <span>10:30 PM</span>
              <span>10:40 PM</span>
              <span>10:50 PM</span>
              <span>11:00 PM</span>
              <span>11:10 PM</span>
              <span>11:20 PM</span>
              <span>11:30 PM</span>
              <span>11:40 PM</span>
            </div>
          </div>

          {/* Bottom Table */}
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 shrink-0">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[10px] font-bold text-[#1b2559] border-b border-gray-100 pb-1.5">
                  <th className="pb-1.5 font-bold">Teammates</th>
                  <th className="pb-1.5 font-bold">Assigned conversations</th>
                  <th className="pb-1.5 font-bold">Closed conversations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <tr className="text-gray-700">
                  <td className="py-1.5 flex items-center space-x-2">
                    <img
                      src={v0_396}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80';
                      }}
                      alt="Nimi Martins"
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <span className="font-medium text-xs text-gray-800">Nimi Martins</span>
                  </td>
                  <td className="py-1.5 font-medium text-xs text-gray-600">34</td>
                  <td className="py-1.5 font-medium text-xs text-gray-600">30</td>
                </tr>
                <tr className="text-gray-700">
                  <td className="py-1.5 flex items-center space-x-2">
                    <img
                      src={v0_390}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80';
                      }}
                      alt="Collins Iheagwara"
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <span className="font-medium text-xs text-gray-800">Collins Iheagwara</span>
                  </td>
                  <td className="py-1.5 font-medium text-xs text-gray-600">34</td>
                  <td className="py-1.5 font-medium text-xs text-gray-600">34</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Leaderboard Card */}
        <aside className="w-72 bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">
              Leaderboard
            </span>
            <Crown className="w-4 h-4 text-[#5f41b2]" />
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center text-center my-auto py-2">
            <p className="text-xs font-bold text-[#5f41b2] mb-2">Most Sales</p>
            <div className="relative mb-2">
              <div className="w-14 h-14 rounded-full p-0.5 bg-amber-400 flex items-center justify-center">
                <img
                  src={v0_229}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80';
                  }}
                  alt="Sarah Martins"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#5f41b2] rounded-full border border-white flex items-center justify-center text-amber-300">
                <Award className="w-2.5 h-2.5" />
              </div>
            </div>
            <h4 className="font-semibold text-xs text-gray-900 leading-tight">Sarah Martins</h4>
            <p className="text-sm font-extrabold text-[#5f41b2] mt-0.5">50,000</p>
          </div>

          {/* 2nd, 3rd, 4th Rows */}
          <div className="space-y-1.5 mt-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#f8fafd]">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold text-[#211791] w-3.5">2nd</span>
                <img
                  src={v0_260}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80';
                  }}
                  alt="Nimi Martins"
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span className="text-xs font-semibold text-gray-800">Nimi Martins</span>
              </div>
              <span className="text-xs font-bold text-[#5f41b2]">2300</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-[#f8fafd]">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold text-[#211791] w-3.5">3rd</span>
                <img
                  src={v0_267}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80';
                  }}
                  alt="Yomi Ndu"
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span className="text-xs font-semibold text-gray-800">Yomi Ndu</span>
              </div>
              <span className="text-xs font-bold text-[#5f41b2]">2300</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-[#f8fafd]">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold text-[#211791] w-3.5">4th</span>
                <img
                  src={v0_274}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=100&q=80';
                  }}
                  alt="Akin Siyanbola"
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span className="text-xs font-semibold text-gray-800 truncate max-w-[80px]">
                  Akin Siyanbola
                </span>
              </div>
              <span className="text-xs font-bold text-[#5f41b2]">2300</span>
            </div>
          </div>
        </aside>

      </div>

      {/* FULL-SCREEN MODAL POWERED BY IMPORTED Calendar.tsx */}
      {isCalendarOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200">
          <div className="w-full max-w-6xl h-[90vh]">
            <Calendar onClose={() => setIsCalendarOpen(false)} />
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;