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
  // Temporary initial state for UI testing
  const [user, setUser] = useState<User | null>({
    id: '1',
    name: 'Admin User',
    role: 'ADMIN',
    team: 'NONE'
  });

  const login = (userData: User) => setUser(userData);
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Error vacchindi deeni valle, idhi unte import error radhu
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};