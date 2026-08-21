// src/components/layout/Navbar.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, User as UserIcon, Bell } from 'lucide-react';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  // Context nunchi actual user and logout function theeskuntunnam
  const { user, logout } = useAuth(); 

  const handleLogout = () => {
    // Local storage clear chestham
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    
    // Context state nunchi user ni clear chestham
    logout(); 
    
    // Login ki pamputham
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-10">
      
      {/* Left Side - Page Title / Branding */}
      <div className="flex items-center">
        <h2 className="text-xl font-bold text-blue-600">
          Metrix Tax Filing
        </h2>
      </div>

      {/* Right Side - Actions & Profile */}
      <div className="flex items-center space-x-6">
        
        {/* Notifications */}
        <button className="text-gray-500 hover:text-blue-600 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            3
          </span>
        </button>

        {/* User Profile Info */}
        <div className="flex items-center space-x-3 border-l pl-6">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
            <p className="text-xs text-gray-500">
              {user?.role} {user?.team !== 'NONE' && `- ${user?.team}`}
            </p>
          </div>
          
          <div className="h-9 w-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 border border-blue-200">
            <UserIcon className="w-5 h-5" />
          </div>
        </div>

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-red-600 transition-colors bg-gray-50 hover:bg-red-50 px-3 py-2 rounded-lg"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;