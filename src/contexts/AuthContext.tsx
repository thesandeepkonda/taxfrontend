// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { setCredentials, logout as logoutAction, User } from '../store/slices/authSlice';
import { decodeToken, isTokenExpired } from '../utils/jwtDecoder';

export type { User };

interface AuthContextType {
  user: User | null;
  login: (userData: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);

  // 1. Page load / refresh ayinappudu LocalStorage nunchi token & user restore cheyyadam
  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken') || '';
    const storedUser = localStorage.getItem('user');

    if (accessToken) {
      if (isTokenExpired(accessToken)) {
        // Token expire aithe logout cheyali
        logout();
      } else if (!user) {
        let userData: User;

        if (storedUser) {
          try {
            userData = JSON.parse(storedUser);
          } catch {
            const decoded = decodeToken(accessToken);
            userData = {
              id: String(decoded?.sub || decoded?.userId || '1'),
              employeeCode: decoded?.sub || 'USER',
              name: decoded?.name || decoded?.sub || 'User',
              role: (decoded?.role || 'EMPLOYEE') as any,
              team: (decoded?.team || 'NONE') as any,
              departmentName: decoded?.departmentName || null,
              teamName: decoded?.teamName || null,
              permissions: decoded?.permissions || [],
            };
          }
        } else {
          // Token decode chesi user create cheyadam
          const decoded = decodeToken(accessToken);
          userData = {
            id: String(decoded?.sub || decoded?.userId || '1'),
            employeeCode: decoded?.sub || 'USER',
            name: decoded?.name || decoded?.sub || 'User',
            role: (decoded?.role || 'EMPLOYEE') as any,
            team: (decoded?.team || 'NONE') as any,
            departmentName: decoded?.departmentName || null,
            teamName: decoded?.teamName || null,
            permissions: decoded?.permissions || [],
          };
        }

        // Redux store lo set cheyyadam
        dispatch(setCredentials({ user: userData, accessToken, refreshToken }));
      }
    }
  }, [dispatch, user]);

  const login = (userData: User, accessToken: string, refreshToken: string) => {
    dispatch(setCredentials({ user: userData, accessToken, refreshToken }));
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    dispatch(logoutAction());
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('sidebarState');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};