import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { LogOut, User as UserIcon, Bell, Menu } from 'lucide-react';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toggleMobileMenu } = useSidebar();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      logout();
      navigate('/login');
    }
  };

  return (
    <header className="bg-white shadow-xs border-b border-slate-200 h-14 md:h-16 lg:h-18 flex items-center justify-between px-3.5 sm:px-6 lg:px-8 sticky top-0 z-30 shrink-0">
      
      {/* Left: Mobile Drawer Trigger + User Greeting */}
      <div className="flex items-center space-x-2.5 sm:space-x-4">
        <button
          type="button"
          onClick={toggleMobileMenu}
          aria-label="Open menu"
          className="md:hidden flex items-center justify-center min-h-[44px] min-w-[44px] p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-50 active:bg-slate-100"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 sm:h-9 sm:w-9 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 border border-blue-200 shrink-0">
            <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-tight">
              {user?.name || 'User'}
            </p>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
              {user?.role || 'Guest'} {user?.team && user?.team !== 'NONE' ? `• ${user?.team}` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Right: Actions, Notifications & Logout */}
      <div className="flex items-center space-x-2 sm:space-x-4 lg:space-x-6">
        <button
          type="button"
          aria-label="Notifications (3 unread)"
          className="text-slate-500 hover:text-blue-600 transition-colors relative min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-slate-50"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
            3
          </span>
        </button>

        <button
          type="button"
          onClick={handleLogout}
          aria-label="Logout"
          className="flex items-center space-x-2 min-h-[44px] px-3 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-rose-600 transition-colors bg-slate-50 hover:bg-rose-50 rounded-xl border border-slate-200/80 active:scale-95"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;