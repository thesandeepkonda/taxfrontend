// src/routes/AppRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Auth/Login';
import MainLayout from '../components/layout/MainLayout';
import ProtectedRoute from './ProtectedRoute';
import MainDashboard from '../pages/Dashboard/MainDashboard';
import Calendar from '../hooks/Calendar';
import NotFound from '../hooks/+Not_found';

// Admin
import XlsxUploader from '../features/admin/XlsxUploader';
import AdminTickets from '../features/admin/AdminTickets';
import Esculation from '../features/admin/Esculation';
import CreateDepartment from '../features/admin/CreateDepartment';
import CreateTeam from '../features/admin/CreateTeam';
import CreateRole from '../features/admin/CreateRole';
import CreateEmployee from '../features/admin/CreateEmployee';
import BulkEmployeesRegister from '../features/admin/BulkEmployeesRegister';
import Docteams from "../features/admin/teams/Docteams";
import DocTeamProfile from "../features/admin/teams/DocTeamProfile";

// Team Lead Management
import TeamRoster from '../pages/Dashboard/TeamRoster';
import TeamMetrics from '../pages/Dashboard/TeamMetrics';
import PendingApprovals from '../pages/Dashboard/PendingApprovals';
import TeamEscalations from '../pages/Dashboard/TeamEscalations';
import TeamSchedules from '../pages/Dashboard/TeamSchedules';

// Documentation
import DocumentationWorkspace from '../features/documentation/DocumentationWorkspace';
import ClientDetailsView from '../features/documentation/ClientDetailsView';
import ClientDocumentsView from '../features/documentation/ClientDocumentsView';
import DocCallHistory from '../features/documentation/DocCallHistory';
import ClientDocumentUpload from '../features/documentation/ClientDocumentUpload';

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

// Team Profiles & Admins
import AdminPreparationTeam from '../features/admin/teams/AdminPreparationTeam';
import AdminEstimationTeam from '../features/admin/teams/AdminEstimationTeam';
import AdminPaymentTeam from '../features/admin/teams/AdminPaymentTeam';
import EFilingAdmin from '../features/admin/teams/EFilingAdmin';
import AdminPreparationTeamProfile from '../features/admin/teams/AdminPreparationTeamProfile';
import AdminEstimationeamProfile from '../features/admin/teams/AdminEstimationeamProfile';
import AdminPaymentTeamProfile from '../features/admin/teams/AdminPaymentTeamProfile';
import EfilingAdminProfile from '../features/admin/teams/EfilingAdminProfile';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/document-upload/:token" element={<ClientDocumentUpload />} /> 
      <Route path="/" element={<Navigate to="/login" />} />
      
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
         <Route path="/dashboard" element={<MainDashboard />} />
         
         <Route path="/team-roster" element={<TeamRoster />} />
         <Route path="/team-metrics" element={<TeamMetrics />} />
         <Route path="/approvals" element={<PendingApprovals />} />
         <Route path="/escalations" element={<TeamEscalations />} />
         <Route path="/schedules" element={<TeamSchedules />} />
         
         <Route path="/leads/assigned" element={<DocumentationWorkspace />} />
         <Route path="/leads/follow-ups" element={<DocumentationWorkspace />} />
         <Route path="/leads/not-lifted" element={<DocumentationWorkspace />} />
         <Route path="/leads/completed" element={<DocumentationWorkspace />} />
         <Route path="/leads/rejected" element={<DocumentationWorkspace />} />
         <Route path="/leads/calls" element={<DocCallHistory />} />
         
         <Route path="/docs/pending" element={<ClientDocumentsView />} />
         <Route path="/docs/verified" element={<ClientDocumentsView />} />
         <Route path="/leads/detail/:id" element={<ClientDetailsView />} />

         <Route path="/prep/queue" element={<PreparationWorkspace />} />
         <Route path="/prep/in-progress" element={<PreparationWorkspace />} />
         <Route path="/prep/review" element={<PreparationWorkspace />} />
         <Route path="/prep/queries" element={<PreparationWorkspace />} />
         <Route path="/prep/detail/:id" element={<PreparationDetailsView />} />
         
         <Route path="/estimation/pending" element={<EstimationWorkspace />} />
         <Route path="/estimation/sent" element={<EstimationWorkspace />} />
         <Route path="/estimation/detail/:id" element={<EstimationDetailsView />} />

         <Route path="/payments/pending" element={<PaymentsWorkspace />} />
         <Route path="/payments/completed" element={<PaymentsWorkspace />} />
         <Route path="/payments/detail/:id" element={<PaymentDetailsView />} />

         <Route path="/transmit/ready" element={<EFilingWorkspace />} />
         <Route path="/transmit/rejected" element={<EFilingWorkspace />} />
         <Route path="/transmit/accepted" element={<EFilingWorkspace />} />
         <Route path="/transmit/detail/:id" element={<EFilingDetailsView />} />
         
         <Route path="/admin/postexcel" element={<XlsxUploader />} />
         <Route path="/admin/post-departments" element={<CreateDepartment />} />
         <Route path="/admin/post-teams" element={<CreateTeam />} />
         <Route path="/admin/post-roles" element={<CreateRole />} />
         <Route path="/admin/post-employees" element={<CreateEmployee />} />
         <Route path="/admin/tickets" element={<AdminTickets />} />
         <Route path="/admin/escalations" element={<Esculation />} />
         <Route path="/admin/schedules" element={<Calendar />} />
         <Route path="/admin/bulk-post-employees" element={<BulkEmployeesRegister />} />
         
         <Route path="/admin/docteams" element={<Docteams />} />
         <Route path="/admin/preparationteam" element={<AdminPreparationTeam />} />
         <Route path="/admin/estimationteam" element={<AdminEstimationTeam />} />
         <Route path="/admin/paymentteam" element={<AdminPaymentTeam />} />
         <Route path="/admin/e-filing-team" element={<EFilingAdmin />} />

         <Route path="/admin/docteams/:id" element={<DocTeamProfile />} />
         <Route path="/admin/preparationteam/:id" element={<AdminPreparationTeamProfile />} />
         <Route path="/admin/estimationteam/:id" element={<AdminEstimationeamProfile />} />
         <Route path="/admin/paymentteam/:id" element={<AdminPaymentTeamProfile />} />
         <Route path="/admin/efilingteam/:id" element={<EfilingAdminProfile />} />
      </Route>
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;