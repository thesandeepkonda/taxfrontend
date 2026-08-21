import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  Users,
  FileText,
  Calendar as CalendarIcon,
  BarChart2,
  Bell,
  Settings,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  LogOut
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Accordion Dropdown States
  const [isAudienceOpen, setIsAudienceOpen] = useState<boolean>(false);
  const [isIncomeOpen, setIsIncomeOpen] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={`relative h-screen max-h-screen bg-white border-r border-gray-100 flex flex-col justify-between p-4 select-none shrink-0 z-40 font-sans transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Collapse / Expand Button */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3.5 top-14 w-7 h-7 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center text-gray-500 hover:text-gray-900 z-50 cursor-pointer transition-transform hover:scale-110 active:scale-95"
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 stroke-[2.5]" />
        ) : (
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
        )}
      </button>

      {/* Top Section: Brand Header & Scrollable Nav List */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        
        {/* Brand Logo Header */}
        <div className="flex items-center justify-between px-2 pb-4 pt-1 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="relative w-7 h-7 bg-slate-900 rounded-full flex items-center justify-center shrink-0">
              <div className="w-3 h-3 bg-white rounded-full" />
              <div className="absolute top-0.5 right-0.5 w-2 h-2 bg-white rounded-full" />
            </div>
            {!isCollapsed && (
              <span className="text-lg font-extrabold text-slate-900 tracking-tight whitespace-nowrap">
                Metrix
              </span>
            )}
          </div>
          {!isCollapsed && (
            <button className="text-slate-400 hover:text-slate-700 transition">
              <MoreVertical className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Scrollable Navigation List (Hidden Scrollbar, Smooth Scroll) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          
          {/* MAIN Section */}
          <div>
            {!isCollapsed && (
              <span className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Main
              </span>
            )}
            
            <nav className="mt-1.5 space-y-1">
              
              {/* Dashboard */}
              <NavLink
                to="/dashboard"
                title="Dashboard"
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-xs font-semibold rounded-xl transition ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  } ${isCollapsed ? 'justify-center' : ''}`
                }
              >
                <Home className="w-4 h-4 text-slate-500 stroke-[2] shrink-0" />
                {!isCollapsed && <span className="ml-3 truncate">Dashboard</span>}
              </NavLink>

              {/* Audience Dropdown Accordion */}
              <div>
                <button
                  type="button"
                  title="Audience"
                  onClick={() => setIsAudienceOpen(!isAudienceOpen)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition ${
                    isCollapsed ? 'justify-center' : ''
                  }`}
                >
                  <div className="flex items-center min-w-0">
                    <Users className="w-4 h-4 text-slate-500 stroke-[2] shrink-0" />
                    {!isCollapsed && <span className="ml-3 truncate">Audience</span>}
                  </div>
                  {!isCollapsed && (
                    <span>
                      {isAudienceOpen ? (
                        <ChevronUp className="w-3.5 h-3.5 text-slate-700 stroke-[2.5]" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </span>
                  )}
                </button>

                {/* Audience Submenu */}
                {isAudienceOpen && !isCollapsed && (
                  <div className="relative ml-5 pl-4 border-l border-slate-200 mt-1 space-y-1">
                    <NavLink
                      to="/manage-users"
                      className="block py-1 px-3 text-xs font-medium text-slate-500 hover:text-slate-900 transition truncate"
                    >
                      Overview
                    </NavLink>
                    <NavLink
                      to="/team-performance"
                      className="block py-1 px-3 text-xs font-medium text-slate-500 hover:text-slate-900 transition truncate"
                    >
                      Demographics
                    </NavLink>
                  </div>
                )}
              </div>

              {/* Posts */}
              <NavLink
                to="/posts"
                title="Posts"
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-xs font-semibold rounded-xl transition ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  } ${isCollapsed ? 'justify-center' : ''}`
                }
              >
                <FileText className="w-4 h-4 text-slate-500 stroke-[2] shrink-0" />
                {!isCollapsed && <span className="ml-3 truncate">Posts</span>}
              </NavLink>

              {/* Schedules */}
              <NavLink
                to="/schedules"
                title="Schedules"
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-xs font-semibold rounded-xl transition ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  } ${isCollapsed ? 'justify-center' : ''}`
                }
              >
                <CalendarIcon className="w-4 h-4 text-slate-500 stroke-[2] shrink-0" />
                {!isCollapsed && <span className="ml-3 truncate">Schedules</span>}
              </NavLink>

              {/* Income Dropdown Accordion */}
              <div>
                <button
                  type="button"
                  title="Income"
                  onClick={() => setIsIncomeOpen(!isIncomeOpen)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition ${
                    isIncomeOpen
                      ? 'bg-slate-50 text-slate-900 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 font-semibold'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                >
                  <div className="flex items-center min-w-0">
                    <BarChart2 className="w-4 h-4 text-slate-900 stroke-[2.5] shrink-0" />
                    {!isCollapsed && <span className="ml-3 truncate">Income</span>}
                  </div>
                  {!isCollapsed && (
                    <span>
                      {isIncomeOpen ? (
                        <ChevronUp className="w-3.5 h-3.5 text-slate-700 stroke-[2.5]" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </span>
                  )}
                </button>

                {/* Income Submenu */}
                {isIncomeOpen && !isCollapsed && (
                  <div className="relative ml-5 pl-4 border-l border-slate-200 mt-1 space-y-1">
                    <NavLink
                      to="/earnings"
                      className="block py-1 px-3 text-xs font-medium text-slate-500 hover:text-slate-900 transition truncate"
                    >
                      Earnings
                    </NavLink>
                    <NavLink
                      to="/refunds"
                      className="block py-1.5 px-3 text-xs font-bold text-slate-900 bg-slate-100 rounded-lg transition truncate"
                    >
                      Refunds
                    </NavLink>
                    <NavLink
                      to="/declines"
                      className="block py-1 px-3 text-xs font-medium text-slate-500 hover:text-slate-900 transition truncate"
                    >
                      Declines
                    </NavLink>
                    <NavLink
                      to="/payouts"
                      className="block py-1 px-3 text-xs font-medium text-slate-500 hover:text-slate-900 transition truncate"
                    >
                      Payouts
                    </NavLink>
                  </div>
                )}
              </div>

            </nav>
          </div>

          {/* SETTINGS Section */}
          <div>
            {!isCollapsed && (
              <span className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Settings
              </span>
            )}
            
            <nav className="mt-1.5 space-y-1">
              {/* Notification */}
              <NavLink
                to="/notifications"
                title="Notification"
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-xs font-semibold rounded-xl transition ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  } ${isCollapsed ? 'justify-center' : ''}`
                }
              >
                <Bell className="w-4 h-4 text-slate-500 stroke-[2] shrink-0" />
                {!isCollapsed && <span className="ml-3 truncate">Notification</span>}
              </NavLink>

              {/* Settings Dropdown Accordion */}
              <div>
                <button
                  type="button"
                  title="Settings"
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition ${
                    isCollapsed ? 'justify-center' : ''
                  }`}
                >
                  <div className="flex items-center min-w-0">
                    <Settings className="w-4 h-4 text-slate-500 stroke-[2] shrink-0" />
                    {!isCollapsed && <span className="ml-3 truncate">Settings</span>}
                  </div>
                  {!isCollapsed && (
                    <span>
                      {isSettingsOpen ? (
                        <ChevronUp className="w-3.5 h-3.5 text-slate-700 stroke-[2.5]" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </span>
                  )}
                </button>

                {/* Settings Submenu */}
                {isSettingsOpen && !isCollapsed && (
                  <div className="relative ml-5 pl-4 border-l border-slate-200 mt-1 space-y-1">
                    <NavLink
                      to="/general-settings"
                      className="block py-1 px-3 text-xs font-medium text-slate-500 hover:text-slate-900 transition truncate"
                    >
                      General
                    </NavLink>
                    <NavLink
                      to="/security-settings"
                      className="block py-1 px-3 text-xs font-medium text-slate-500 hover:text-slate-900 transition truncate"
                    >
                      Account & Security
                    </NavLink>
                  </div>
                )}
              </div>
            </nav>
          </div>

        </div>

      </div>

      {/* Bottom Section: Logout Button */}
      <div className="mt-2 pt-2 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={handleLogout}
          title="Logout"
          className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center transition active:scale-[0.98] ${
            isCollapsed ? 'justify-center' : 'space-x-3'
          }`}
        >
          <LogOut className="w-4 h-4 stroke-[2] shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>

    </aside>
  );
};

export default Sidebar;