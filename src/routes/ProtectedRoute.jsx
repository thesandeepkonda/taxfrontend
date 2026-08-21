import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  // User lekapothe login page ki redirect chestham
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // User unte lopaliki (Dashboard ki) allow chestham
  return <>{children}</>;
};

export default ProtectedRoute;