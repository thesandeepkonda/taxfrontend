
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { ChatProvider } from './contexts/ChatContext';

function App() {
  return (
    <BrowserRouter basename="/crm">
      <ToastProvider>
        <AuthProvider>
          <ChatProvider>
            <NotificationProvider>
              <SidebarProvider>
                <AppRoutes />
              </SidebarProvider>
            </NotificationProvider>
          </ChatProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;