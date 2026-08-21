// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  role: 'ADMIN' | 'TEAMLEAD' | 'EMPLOYEE';
  team: 'NONE' | 'DOCUMENTATION' | 'PREPARATION' | 'ESTIMATION' | 'PAYMENTS' | 'E-FILING';
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  
  // BUG FIX: Hardcoded dummy user theesesi, localStorage nunchi get chesthunnam
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('authUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = (userData: User) => {
    setUser(userData);
    // Login ayyaka user data ni browser storage lo save chestham
    localStorage.setItem('authUser', JSON.stringify(userData)); 
  };

  const logout = () => {
    setUser(null);
    // Logout kottagane browser storage nunchi lepestham
    localStorage.removeItem('authUser'); 
    localStorage.removeItem('token');
    localStorage.removeItem('role');
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