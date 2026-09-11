// src/components/layout/MainLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { SidebarProvider } from '../../contexts/SidebarContext';
import { useNotificationSSE } from '../../hooks/useNotificationSSE';

const MainLayout: React.FC = () => {
  useNotificationSSE();
  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-slate-50 antialiased selection:bg-blue-500 selection:text-white">
        <Sidebar />

        {/* Content Container */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <Navbar />

          {/* Main Area - Only Top and Left padding */}
          <main className="flex-1 overflow-x-hidden overflow-y-auto pt-[10px] pl-[10px] m-0">
            <div className="w-full h-full p-0 m-0 transition-all duration-200">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;