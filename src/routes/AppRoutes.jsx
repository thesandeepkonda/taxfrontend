import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Auth/Login';
import MainLayout from '../components/layout/MainLayout';
import ProtectedRoute from './ProtectedRoute';
import MainDashboard from '../pages/Dashboard/MainDashboard';
import XlsxUploader from '../features/admin/XlsxUploader';
import AdminTickets from '../features/admin/AdminTickets';
import Esculation from '../features/admin/Esculation';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/login" />} />

      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
         <Route path="/dashboard" element={<MainDashboard />} />
         <Route path="/admin/xlsx" element={<XlsxUploader />} />
         <Route path="/admin/tickets" element={<AdminTickets />} />
         <Route path="/admin/escalations" element={<Esculation />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;