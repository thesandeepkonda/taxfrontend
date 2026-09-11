// src/routes/AppRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Auth/Login';
import MainLayout from '../components/layout/MainLayout';
import ProtectedRoute from './ProtectedRoute';
import MainDashboard from '../pages/Dashboard/MainDashboard';
import Calendar from '../hooks/Calendar';
import NotFound from '../hooks/+Not_found';

// Admin - Existing
import XlsxUploader from '../features/admin/XlsxUploader';
import AdminTickets from '../features/admin/AdminTickets';
import Esculation from '../features/admin/Esculation';
import CreateDepartment from '../features/admin/CreateDepartment';
import CreateTeam from '../features/admin/CreateTeam';
import CreateRole from '../features/admin/roles/CreateRole';
import CreateEmployee from '../features/admin/CreateEmployee';
import BulkEmployeesRegister from '../features/admin/BulkEmployeesRegister';
import Docteams from "../features/admin/teams/Docteams";
import DocTeamProfile from "../features/admin/teams/DocTeamProfile";

// Admin - View Data (Existing)
import AdminViewDepartments from '../features/admin/teams/AdminViewDepartments';
import AdminViewTeams from '../features/admin/teams/AdminViewTeams';
import AdminViewEmployees from '../features/admin/teams/AdminViewEmployees';
import AdminViewAttendance from '../features/admin/teams/AdminViewAttendance';

// NEW: Admin - Roles & Permissions
import AdminViewRoles from '../features/admin/roles/AdminViewRoles';
import CreatePermission from '../features/admin/permissions/CreatePermission';

// NEW: Admin - CRM
import AdminClients from '../features/admin/crm/AdminClients';
import AdminCalls from '../features/admin/crm/AdminCalls';
import AdminReports from '../features/admin/crm/AdminReports';
import AdminComments from '../features/admin/crm/AdminComments';

// NEW: Admin - Leave Approvals
import AdminLeaveApprovals from '../features/admin/AdminLeaveApprovals';

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

// NEW: Leave Management (Employee)
import LeaveManagement from '../features/leave/LeaveManagement';

// Team Profiles & Admins (Existing)
import AdminPreparationTeam from '../features/admin/teams/AdminPreparationTeam';
import AdminEstimationTeam from '../features/admin/teams/AdminEstimationTeam';
import AdminPaymentTeam from '../features/admin/teams/AdminPaymentTeam';
import EFilingAdmin from '../features/admin/teams/EFilingAdmin';
import AdminPreparationTeamProfile from '../features/admin/teams/AdminPreparationTeamProfile';
import AdminEstimationeamProfile from '../features/admin/teams/AdminEstimationeamProfile';
import AdminPaymentTeamProfile from '../features/admin/teams/AdminPaymentTeamProfile';
import EfilingAdminProfile from '../features/admin/teams/EfilingAdminProfile';
import AdminViewTeamMembers from '../features/admin/teams/AdminViewTeamMembers';
import AdminDocuments from '../features/admin/crm/AdminDocuments';
import AdminViewClientsByEmpID from '../features/admin/crm/AdminViewClientsByEmpID';
import AdminViewDocsByClientID from '../features/admin/crm/AdminViewDocsByClientID';
import AdminViewCommentsByClientID from '../features/admin/crm/AdminViewCommentsByClientID';
import AdminViewDraftsByClientID from '../features/admin/crm/AdminViewDraftsByClientID';
import AdminVIewTaxOrganizerByClinetID from '../features/admin/crm/AdminVIewTaxOrganizerByClinetID';
import Notifications from '../pages/Notifications';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/document-upload/:token" element={<ClientDocumentUpload />} />
      
      <Route path="/" element={<Navigate to="/login" />} />
      
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<MainDashboard />} />
        
        {/* New Events Calendar Route */}
        <Route path="/events" element={<Calendar />} />
        
        {/* New Leave Management Route */}
        <Route path="/leaves" element={<LeaveManagement />} />

        <Route path="/team-roster" element={<TeamRoster />} />
        <Route path="/team-metrics" element={<TeamMetrics />} />
        <Route path="/approvals" element={<PendingApprovals />} />
        <Route path="/escalations" element={<TeamEscalations />} />
        <Route path="/schedules" element={<TeamSchedules />} />
        
        <Route path="/leads/assigned" element={<DocumentationWorkspace />} />
        <Route path="/leads/interested" element={<DocumentationWorkspace />} />
        <Route path="/leads/not-interested" element={<DocumentationWorkspace />} />
        <Route path="/leads/follow-ups" element={<DocumentationWorkspace />} />
        <Route path="/leads/call-back" element={<DocumentationWorkspace />} />
        <Route path="/leads/not-lifted" element={<DocumentationWorkspace />} />
        <Route path="/leads/completed" element={<DocumentationWorkspace />} />
        <Route path="/leads/calls" element={<DocCallHistory />} />
        
        <Route path="/docs/pending" element={<ClientDocumentsView />} />
        <Route path="/docs/verified" element={<ClientDocumentsView />} />
        <Route path="/leads/detail/:id" element={<ClientDetailsView />} />

        {/* --- UPDATED PREPARATION ROUTES --- */}
        <Route path="/prep/assigned" element={<PreparationWorkspace />} />
        <Route path="/prep/in-progress" element={<PreparationWorkspace />} />
        <Route path="/prep/queries" element={<PreparationWorkspace />} />
        <Route path="/prep/review" element={<PreparationWorkspace />} />
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
        
        {/* ---------- ADMIN: EXISTING ---------- */}
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
        
        {/* ---------- ADMIN: VIEW DATA (EXISTING) ---------- */}
        <Route path="/admin/view-departments" element={<AdminViewDepartments />} />
        <Route path="/admin/view-teams" element={<AdminViewTeams />} />
        <Route path="/admin/view-employees" element={<AdminViewEmployees />} />
        <Route path="/admin/view-attendance" element={<AdminViewAttendance />} />

        {/* NEW: ADMIN - ROLES & PERMISSIONS */}
        <Route path="/admin/view-roles" element={<AdminViewRoles />} />
        <Route path="/admin/create-permission" element={<CreatePermission />} />

        {/* NEW: ADMIN - CRM */}
        <Route path="/admin/crm/clients" element={<AdminClients />} />
        <Route path="/admin/crm/calls" element={<AdminCalls />} />
        <Route path="/admin/crm/reports" element={<AdminReports />} />
        <Route path="/admin/crm/comments" element={<AdminComments />} />

        {/*   NEW: ADMIN - LEAVE APPROVALS */}
        <Route path="/admin/leave-approvals" element={<AdminLeaveApprovals />} />
        <Route path="/admin/view-team-members/:teamID" element={<AdminViewTeamMembers />} />
        <Route path="/admin/crm/documents" element={<AdminDocuments />} />
        <Route path="/admin/crm/view-employee-clients/:empID" element={<AdminViewClientsByEmpID />} />
        <Route path="/admin/crm/client-documents/:clientId" element={< AdminViewDocsByClientID/>} />
        <Route path="/admin/crm/view-client-comments/:clientId" element={< AdminViewCommentsByClientID/>} />
        <Route path="/admin/crm/view-drafts/:clientId" element={< AdminViewDraftsByClientID/>} />
        <Route path="/admin/crm/view-tax-organizer/:clientId" element={< AdminVIewTaxOrganizerByClinetID/>} />
        <Route path="/view/notifications" element={< Notifications/>} />
      </Route>
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;