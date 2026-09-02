// src/components/dashboard/AdminDashboard.tsx
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
  Calendar as CalendarIcon,
  X
} from 'lucide-react';

// Import standalone Calendar modal hook/component
import Calendar from '../../hooks/Calendar';

// Fallback image urls
const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';
const FALLBACK_MALE_AVATAR = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80';
const FALLBACK_USER_2 = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80';
const FALLBACK_USER_3 = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80';
const FALLBACK_USER_4 = 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80';

const AdminDashboard: React.FC = () => {
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [isLeaderboardCollapsed, setIsLeaderboardCollapsed] = useState<boolean>(false);

  return (
    <div 
      className="w-full flex flex-col justify-start select-none font-sans overflow-x-hidden text-slate-800"
      style={{
        gap: 'clamp(0.75rem, 1.8vw, 1.5rem)'
      }}
    >
      
      {/* ========================================================
          TOP BANNER: BRANDING, GREETING & HEADER ACTIONS
          - Mobile (320px–480px): Flex-col wrap with 44px tap targets
          - Tablet+ (481px+): Flex-row with space-between
         ======================================================== */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="flex items-center space-x-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#5f41b2]/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#5f41b2] fill-[#5f41b2]" />
            </div>
            <span className="text-base sm:text-lg font-extrabold text-[#5f41b2] tracking-tight">
              Sparkle
            </span>
          </div>

          <div className="h-6 w-[1px] bg-slate-200" aria-hidden="true" />

          <div className="min-w-0">
            <h1 
              className="font-extrabold text-[#1b2559] tracking-tight leading-tight truncate"
              style={{ fontSize: 'clamp(1.125rem, 2.2vw, 1.625rem)' }}
            >
              Hi Nimi,
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
              It's looking like a slow day.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setIsCalendarOpen(true)}
            aria-label="Open Calendar"
            className="flex items-center justify-center gap-1.5 bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 px-3.5 py-2 sm:py-1.5 min-h-[44px] sm:min-h-[36px] rounded-xl sm:rounded-full shadow-xs text-xs font-semibold transition active:scale-95 cursor-pointer"
          >
            <CalendarIcon className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="truncate">Open Calendar</span>
          </button>

          <div 
            className="flex items-center space-x-2 cursor-pointer bg-white px-3 py-2 sm:py-1 min-h-[44px] sm:min-h-[36px] rounded-xl sm:rounded-full shadow-xs border border-slate-200 hover:shadow transition"
          >
            <img
              src={FALLBACK_AVATAR}
              alt="Nimi User Avatar"
              className="w-6 h-6 rounded-full object-cover border border-white shadow-xs shrink-0"
              loading="lazy"
            />
            <span className="text-xs font-semibold text-slate-700 hidden xs:inline truncate">Nimi</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </div>
        </div>
      </header>

      {/* ========================================================
          MAIN WORKSPACE
          - Mobile/Tablet: Stacked vertically
          - Desktop (1025px+): 2-Column Grid (Left Content + Right Leaderboard)
         ======================================================== */}
      <div className="flex flex-col lg:flex-row gap-4 w-full min-h-0">
        
        {/* LEFT COLUMN: KPI Cards + Chart + Table */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          
          {/* ========================================================
              4 KPI CARDS
              - Mobile (320px–480px): 2 columns
              - Tablet (481px–768px): 2 columns
              - Laptop/Desktop (769px+): 4 columns
             ======================================================== */}
          <section aria-label="Key Performance Indicators" className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5 shrink-0">
            {/* KPI 1 */}
            <div className="bg-white rounded-2xl p-3 sm:p-4 flex items-center space-x-3 shadow-xs border border-slate-100 hover:border-slate-200 transition">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#f4f7fe] flex items-center justify-center text-[#5f41b2] shrink-0">
                <Inbox className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-400 truncate">Unassigned</p>
                <h2 className="text-base sm:text-xl font-bold text-[#1b2559] leading-tight">350</h2>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-white rounded-2xl p-3 sm:p-4 flex items-center space-x-3 shadow-xs border border-slate-100 hover:border-slate-200 transition">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#f4f7fe] flex items-center justify-center text-[#5f41b2] shrink-0">
                <User className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-400 truncate">Assigned</p>
                <h2 className="text-base sm:text-xl font-bold text-[#1b2559] leading-tight">450</h2>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="bg-white rounded-2xl p-3 sm:p-4 flex items-center space-x-3 shadow-xs border border-slate-100 hover:border-slate-200 transition">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#f4f7fe] flex items-center justify-center text-[#5f41b2] shrink-0">
                <CheckCircle2 className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-400 truncate">Closed</p>
                <h2 className="text-base sm:text-xl font-bold text-[#1b2559] leading-tight">3500</h2>
              </div>
            </div>

            {/* KPI 4 */}
            <div className="bg-white rounded-2xl p-3 sm:p-4 flex items-center space-x-3 shadow-xs border border-slate-100 hover:border-slate-200 transition">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#f4f7fe] flex items-center justify-center text-[#5f41b2] shrink-0">
                <MessageSquare className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-400 truncate">Channels</p>
                <h2 className="text-base sm:text-xl font-bold text-[#1b2559] leading-tight">3</h2>
              </div>
            </div>
          </section>

          {/* ========================================================
              RESPONSIVE SPLINE CHART & TIMELINE
             ======================================================== */}
          <section 
            aria-label="Activity Chart"
            className="bg-white rounded-2xl p-3.5 sm:p-5 shadow-xs border border-slate-100 flex flex-col justify-between"
            style={{ minHeight: 'clamp(240px, 30vh, 320px)' }}
          >
            <div className="flex items-center justify-between shrink-0 mb-3">
              <button 
                type="button"
                className="flex items-center space-x-1.5 text-xs font-bold text-[#1b2559] hover:text-[#5f41b2] transition min-h-[32px] cursor-pointer"
              >
                <span>Today</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>
              
              <div className="flex items-center space-x-3 text-[11px] font-medium text-slate-400">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#5f41b2]" />
                  <span>Today</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <span>Yesterday</span>
                </div>
              </div>
            </div>

            {/* Spline Chart SVG Area */}
            <div className="relative flex-1 w-full min-h-[140px] flex items-center">
              {/* Background Grid Lines */}
              <div className="w-full h-full flex flex-col justify-between py-1 text-[10px] text-slate-400 select-none">
                <div className="flex items-center w-full">
                  <span className="w-5 text-right pr-1.5">30</span>
                  <div className="flex-1 border-b border-dashed border-slate-100" />
                </div>
                <div className="flex items-center w-full">
                  <span className="w-5 text-right pr-1.5">20</span>
                  <div className="flex-1 border-b border-dashed border-slate-100" />
                </div>
                <div className="flex items-center w-full">
                  <span className="w-5 text-right pr-1.5">10</span>
                  <div className="flex-1 border-b border-dashed border-slate-100" />
                </div>
                <div className="flex items-center w-full">
                  <span className="w-5 text-right pr-1.5">0</span>
                  <div className="flex-1 border-b border-dashed border-slate-100" />
                </div>
              </div>

              {/* Responsive SVG Curves */}
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

              {/* Floating Tooltip Indicator */}
              <div className="absolute left-[48%] top-[12%] -translate-x-1/2 bg-white px-2.5 py-1.5 rounded-lg shadow-md border border-slate-100 text-[10px] space-y-0.5 pointer-events-none z-10">
                <div className="flex items-center justify-between gap-2 font-semibold text-[#5f41b2]">
                  <span>Today</span>
                  <span>25</span>
                </div>
                <div className="flex items-center justify-between gap-2 text-slate-400">
                  <span>Yesterday</span>
                  <span>23</span>
                </div>
              </div>
            </div>

            {/* Horizontal Timeline Labels */}
            <div className="flex justify-between overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden text-[10px] text-slate-400 pt-2 shrink-0 px-6 font-medium gap-3">
              <span className="shrink-0">10:23 PM</span>
              <span className="shrink-0">10:30 PM</span>
              <span className="shrink-0">10:40 PM</span>
              <span className="shrink-0 hidden sm:inline">10:50 PM</span>
              <span className="shrink-0">11:00 PM</span>
              <span className="shrink-0 hidden sm:inline">11:10 PM</span>
              <span className="shrink-0">11:20 PM</span>
              <span className="shrink-0 hidden sm:inline">11:30 PM</span>
              <span className="shrink-0">11:40 PM</span>
            </div>
          </section>

          {/* ========================================================
              RESPONSIVE TEAMMATES TABLE
              - Scrollable container prevents layout breaks
             ======================================================== */}
          <section aria-label="Teammate Activity" className="bg-white rounded-2xl p-3.5 sm:p-5 shadow-xs border border-slate-100 overflow-hidden">
            <h3 className="text-xs font-bold text-[#1b2559] uppercase tracking-wider mb-3">
              Active Teammates
            </h3>
            
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[340px]">
                <thead>
                  <tr className="text-[11px] font-bold text-slate-400 border-b border-slate-100 pb-2">
                    <th scope="col" className="pb-2.5 font-bold">Teammates</th>
                    <th scope="col" className="pb-2.5 font-bold text-center">Assigned</th>
                    <th scope="col" className="pb-2.5 font-bold text-right">Closed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <tr className="text-slate-700 hover:bg-slate-50/80 transition">
                    <td className="py-2.5 flex items-center space-x-2.5">
                      <img
                        src={FALLBACK_AVATAR}
                        alt="Nimi Martins avatar"
                        className="w-6 h-6 rounded-full object-cover shrink-0"
                        loading="lazy"
                      />
                      <span className="font-semibold text-xs text-slate-800 truncate">Nimi Martins</span>
                    </td>
                    <td className="py-2.5 font-medium text-xs text-slate-600 text-center">34</td>
                    <td className="py-2.5 font-medium text-xs text-slate-600 text-right">30</td>
                  </tr>
                  <tr className="text-slate-700 hover:bg-slate-50/80 transition">
                    <td className="py-2.5 flex items-center space-x-2.5">
                      <img
                        src={FALLBACK_MALE_AVATAR}
                        alt="Collins Iheagwara avatar"
                        className="w-6 h-6 rounded-full object-cover shrink-0"
                        loading="lazy"
                      />
                      <span className="font-semibold text-xs text-slate-800 truncate">Collins Iheagwara</span>
                    </td>
                    <td className="py-2.5 font-medium text-xs text-slate-600 text-center">34</td>
                    <td className="py-2.5 font-medium text-xs text-slate-600 text-right">34</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* ========================================================
            RIGHT COLUMN / LEADERBOARD CARD
            - Mobile (320px–480px): Collapsible card to save vertical viewport space
            - Tablet: Full width card
            - Desktop (1025px+): Fixed-width right column (w-72 to w-80)
           ======================================================== */}
        <aside 
          aria-label="Sales Leaderboard"
          className="w-full lg:w-72 xl:w-80 bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-100 flex flex-col justify-between shrink-0"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Leaderboard
            </span>
            
            <div className="flex items-center space-x-2">
              <Crown className="w-4 h-4 text-[#5f41b2]" />
              {/* Mobile collapse toggle */}
              <button
                type="button"
                onClick={() => setIsLeaderboardCollapsed(prev => !prev)}
                className="lg:hidden p-1 min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-slate-600"
                aria-label="Toggle leaderboard visibility"
              >
                <ChevronDown className={`w-4 h-4 transform transition-transform ${isLeaderboardCollapsed ? '-rotate-90' : ''}`} />
              </button>
            </div>
          </div>

          {!isLeaderboardCollapsed && (
            <>
              {/* 1st Place Podium */}
              <div className="flex flex-col items-center text-center my-auto py-3">
                <p className="text-xs font-bold text-[#5f41b2] mb-2 uppercase tracking-wide">
                  Most Sales
                </p>
                <div className="relative mb-2">
                  <div className="w-16 h-16 rounded-full p-0.5 bg-amber-400 flex items-center justify-center shadow-sm">
                    <img
                      src={FALLBACK_USER_2}
                      alt="Sarah Martins"
                      className="w-full h-full rounded-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#5f41b2] rounded-full border-2 border-white flex items-center justify-center text-amber-300">
                    <Award className="w-3 h-3" />
                  </div>
                </div>
                <h4 className="font-semibold text-xs text-slate-800 leading-tight">Sarah Martins</h4>
                <p className="text-base font-extrabold text-[#5f41b2] mt-0.5">50,000</p>
              </div>

              {/* 2nd, 3rd, 4th Runners up */}
              <div className="space-y-2 mt-2">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span className="text-[11px] font-bold text-[#5f41b2] w-4">2nd</span>
                    <img
                      src={FALLBACK_AVATAR}
                      alt="Nimi Martins"
                      className="w-6 h-6 rounded-full object-cover shrink-0"
                      loading="lazy"
                    />
                    <span className="text-xs font-semibold text-slate-800 truncate">Nimi Martins</span>
                  </div>
                  <span className="text-xs font-bold text-[#5f41b2] shrink-0 ml-2">2300</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span className="text-[11px] font-bold text-[#5f41b2] w-4">3rd</span>
                    <img
                      src={FALLBACK_USER_3}
                      alt="Yomi Ndu"
                      className="w-6 h-6 rounded-full object-cover shrink-0"
                      loading="lazy"
                    />
                    <span className="text-xs font-semibold text-slate-800 truncate">Yomi Ndu</span>
                  </div>
                  <span className="text-xs font-bold text-[#5f41b2] shrink-0 ml-2">2300</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span className="text-[11px] font-bold text-[#5f41b2] w-4">4th</span>
                    <img
                      src={FALLBACK_USER_4}
                      alt="Akin Siyanbola"
                      className="w-6 h-6 rounded-full object-cover shrink-0"
                      loading="lazy"
                    />
                    <span className="text-xs font-semibold text-slate-800 truncate">Akin Siyanbola</span>
                  </div>
                  <span className="text-xs font-bold text-[#5f41b2] shrink-0 ml-2">2300</span>
                </div>
              </div>
            </>
          )}
        </aside>

      </div>

      {/* ========================================================
          FULL-SCREEN RESPONSIVE MODAL: STANDALONE CALENDAR
         ======================================================== */}
      {isCalendarOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-5xl h-[88vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <button
              type="button"
              onClick={() => setIsCalendarOpen(false)}
              aria-label="Close Calendar"
              className="absolute top-3 right-3 z-10 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex-1 overflow-auto p-4">
              <Calendar onClose={() => setIsCalendarOpen(false)} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;