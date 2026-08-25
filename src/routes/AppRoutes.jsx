// src/routes/AppRoutes.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Auth/Login';
import MainLayout from '../components/layout/MainLayout';
import ProtectedRoute from './ProtectedRoute';
import MainDashboard from '../pages/Dashboard/MainDashboard';
import XlsxUploader from '../features/admin/XlsxUploader';
import AdminTickets from '../features/admin/AdminTickets';
import Esculation from '../features/admin/Esculation';

// Documentation
import DocumentationWorkspace from '../features/documentation/DocumentationWorkspace';
import ClientDetailsView from '../features/documentation/ClientDetailsView';
import ClientDocumentsView from '../features/documentation/ClientDocumentsView';

// Preparation
import PreparationWorkspace from '../features/preparation/PreparationWorkspace';
import PreparationDetailsView from '../features/preparation/PreparationDetailsView';

// Estimation
import EstimationWorkspace from '../features/estimation/EstimationWorkspace';
import EstimationDetailsView from '../features/estimation/EstimationDetailsView';

// Payments
import PaymentsWorkspace from '../features/payments/PaymentsWorkspace';
import PaymentDetailsView from '../features/payments/PaymentDetailsView';

// E-Filing
import EFilingWorkspace from '../features/efiling/EFilingWorkspace';
import EFilingDetailsView from '../features/efiling/EFilingDetailsView';

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
         
         {/* Estimation Team Routes */}
         <Route path="/estimation/pending" element={<EstimationWorkspace />} />
         <Route path="/estimation/sent" element={<EstimationWorkspace />} />
         <Route path="/estimation/detail/:id" element={<EstimationDetailsView />} />

         {/* Payments Team Routes */}
         <Route path="/payments/pending" element={<PaymentsWorkspace />} />
         <Route path="/payments/completed" element={<PaymentsWorkspace />} />
         <Route path="/payments/detail/:id" element={<PaymentDetailsView />} />

         {/* E-Filing Team Routes */}
         <Route path="/transmit/ready" element={<EFilingWorkspace />} />
         <Route path="/transmit/rejected" element={<EFilingWorkspace />} />
         <Route path="/transmit/accepted" element={<EFilingWorkspace />} />
         <Route path="/transmit/detail/:id" element={<EFilingDetailsView />} />
         
         {/* Admin Routes */}
         <Route path="/admin/xlsx" element={<XlsxUploader />} />
         <Route path="/admin/tickets" element={<AdminTickets />} />
         <Route path="/admin/escalations" element={<Esculation />} />
      </Route>
    </Routes>
  );
};
export default AppRoutes;