import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { SidebarProvider } from '../../contexts/SidebarContext';

const MainLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-slate-50 antialiased selection:bg-blue-500 selection:text-white">
        {/* Responsive Sidebar (Flyout on mobile, Fixed rail/expanded on Desktop) */}
        <Sidebar />

        {/* Content Container */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <Navbar />

          {/* Fluid Scroll Area with clamp padding & max-width container */}
          <main 
            className="flex-1 overflow-x-hidden overflow-y-auto"
            style={{
              padding: 'clamp(0.75rem, 2.5vw, 2.5rem)',
              paddingBottom: 'clamp(5rem, 8vw, 2.5rem)' // Thumb-accessible clearance on mobile
            }}
          >
            <div className="w-full mx-auto max-w-[1400px] transition-all duration-200">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;