import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Auth/Login';
import MainLayout from '../components/layout/MainLayout';
import ProtectedRoute from './ProtectedRoute';
import MainDashboard from '../pages/Dashboard/MainDashboard';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/login" />} />

      {/* Protected Routes inside MainLayout (Contains Sidebar & Navbar) */}
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
         <Route path="/dashboard" element={<MainDashboard />} />
         {/* Team specific routes ikkada add chestham */}
      </Route>
    </Routes>
  );
};

export default AppRoutes;