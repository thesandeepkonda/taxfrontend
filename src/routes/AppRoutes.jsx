// src/routes/AppRoutes.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Auth/Login';
import MainLayout from '../components/layout/MainLayout';
import ProtectedRoute from './ProtectedRoute';
import MainDashboard from '../pages/Dashboard/MainDashboard';
import XlsxUploader from '../features/admin/XlsxUploader';
import AdminTickets from '../features/admin/AdminTickets';
import Esculation from '../features/admin/Esculation';

import DocumentationWorkspace from '../features/documentation/DocumentationWorkspace';
import ClientDetailsView from '../features/documentation/ClientDetailsView';
import ClientDocumentsView from '../features/documentation/ClientDocumentsView';

import PreparationWorkspace from '../features/preparation/PreparationWorkspace';
import PreparationDetailsView from '../features/preparation/PreparationDetailsView';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/login" />} />

      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
         
         <Route path="/dashboard" element={<MainDashboard />} />
         
         {/* Documentation Team Routes */}
         <Route path="/leads/assigned" element={<DocumentationWorkspace />} />
         <Route path="/leads/follow-ups" element={<DocumentationWorkspace />} />
         <Route path="/leads/completed" element={<DocumentationWorkspace />} />
         <Route path="/leads/rejected" element={<DocumentationWorkspace />} />
         <Route path="/docs/pending" element={<ClientDocumentsView />} />
         <Route path="/docs/verified" element={<ClientDocumentsView />} />
         <Route path="/leads/detail/:id" element={<ClientDetailsView />} />

         {/* Preparation Team Routes */}
         <Route path="/prep/queue" element={<PreparationWorkspace />} />
         <Route path="/prep/in-progress" element={<PreparationWorkspace />} />
         <Route path="/prep/review" element={<PreparationWorkspace />} />
         <Route path="/prep/queries" element={<PreparationWorkspace />} />
         <Route path="/prep/detail/:id" element={<PreparationDetailsView />} />
         
         <Route path="/admin/xlsx" element={<XlsxUploader />} />
         <Route path="/admin/tickets" element={<AdminTickets />} />
         <Route path="/admin/escalations" element={<Esculation />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;