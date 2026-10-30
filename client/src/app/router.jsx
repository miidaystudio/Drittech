import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Layouts
import { DashboardLayout } from '../components/layout/DashboardLayout';

// Public Marketing Pages
import { HomePage } from '../pages/marketing/HomePage';
import { FeaturesPage } from '../pages/marketing/FeaturesPage';
import { ClinicsSolutionPage } from '../pages/marketing/ClinicsSolutionPage';
import { DiagnosticsSolutionPage } from '../pages/marketing/DiagnosticsSolutionPage';
import { HowItWorksPage } from '../pages/marketing/HowItWorksPage';
import { SecurityPage } from '../pages/marketing/SecurityPage';
import { AboutPage } from '../pages/marketing/AboutPage';
import { ContactPage } from '../pages/marketing/ContactPage';
import { PrivacyPage } from '../pages/marketing/PrivacyPage';
import { TermsPage } from '../pages/marketing/TermsPage';

// Auth Pages
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';

// Public Realtime TV Display & Mobile Tracker
import { WaitingRoomTvPage } from '../pages/public/WaitingRoomTvPage';
import { PatientTrackerPage } from '../pages/patient/PatientTrackerPage';

// Receptionist Pages
import { ReceptionOverviewPage } from '../pages/receptionist/ReceptionOverviewPage';
import { ReceptionQueuePage } from '../pages/receptionist/ReceptionQueuePage';
import { RegisterPatientPage } from '../pages/receptionist/RegisterPatientPage';
import { ReceptionPatientsPage } from '../pages/receptionist/ReceptionPatientsPage';
import { ReceptionCheckInPage } from '../pages/receptionist/ReceptionCheckInPage';

// Doctor Pages
import { DoctorConsolePage } from '../pages/doctor/DoctorConsolePage';
import { DoctorConsultationPage } from '../pages/doctor/DoctorConsultationPage';
import { DoctorQueuePage } from '../pages/doctor/DoctorQueuePage';
import { DoctorHistoryPage } from '../pages/doctor/DoctorHistoryPage';

// Lab Pages
import { LabOverviewPage } from '../pages/laboratory/LabOverviewPage';
import { LabOrdersPage } from '../pages/laboratory/LabOrdersPage';
import { UploadReportPage } from '../pages/laboratory/UploadReportPage';
import { LabReportsPage } from '../pages/laboratory/LabReportsPage';

// Patient Portal Pages
import { PatientPortalHomePage } from '../pages/patient/PatientPortalHomePage';
import { PatientAppointmentsPage } from '../pages/patient/PatientAppointmentsPage';
import { PatientReportsPage } from '../pages/patient/PatientReportsPage';
import { PatientProfilePage } from '../pages/patient/PatientProfilePage';

// Admin Pages
import { AdminOverviewPage } from '../pages/admin/AdminOverviewPage';
import { AdminAnalyticsPage } from '../pages/admin/AdminAnalyticsPage';
import { AdminStaffPage } from '../pages/admin/AdminStaffPage';
import { AdminDepartmentsPage } from '../pages/admin/AdminDepartmentsPage';
import { AdminAuditLogsPage } from '../pages/admin/AdminAuditLogsPage';
import { AdminSettingsPage } from '../pages/admin/AdminSettingsPage';

// Protected Route Wrapper with Role Authorization Check
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, loading, role } = useAuth();

  if (loading) {
    return <div className="p-8 text-center text-muted">Authenticating workspace session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Redirect to user's permitted home
    if (role === 'doctor') return <Navigate to="/app/doctor" replace />;
    if (role === 'receptionist') return <Navigate to="/app/reception" replace />;
    if (role === 'lab_technician') return <Navigate to="/app/lab" replace />;
    if (role === 'patient') return <Navigate to="/patient" replace />;
    return <Navigate to="/app/admin" replace />;
  }

  return children;
};

export const router = createBrowserRouter([
  // Public Marketing Routes
  { path: '/', element: <HomePage /> },
  { path: '/features', element: <FeaturesPage /> },
  { path: '/solutions/clinics', element: <ClinicsSolutionPage /> },
  { path: '/solutions/diagnostic-centers', element: <DiagnosticsSolutionPage /> },
  { path: '/how-it-works', element: <HowItWorksPage /> },
  { path: '/security', element: <SecurityPage /> },
  { path: '/about', element: <AboutPage /> },
  { path: '/contact', element: <ContactPage /> },
  { path: '/privacy', element: <PrivacyPage /> },
  { path: '/terms', element: <TermsPage /> },

  // Auth Routes
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },

  // Public Guest & Waiting Room Display Endpoints
  { path: '/display/:clinicId/:departmentId', element: <WaitingRoomTvPage /> },
  { path: '/track/:trackingToken', element: <PatientTrackerPage /> },

  // Patient Portal Authenticated Routes
  {
    path: '/patient',
    element: (
      <ProtectedRoute allowedRoles={['patient', 'super_admin']}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <PatientPortalHomePage /> },
      { path: 'appointments', element: <PatientAppointmentsPage /> },
      { path: 'reports', element: <PatientReportsPage /> },
      { path: 'profile', element: <PatientProfilePage /> },
    ],
  },

  // Internal Management App Routes
  {
    path: '/app',
    element: (
      <ProtectedRoute allowedRoles={['super_admin', 'clinic_admin', 'receptionist', 'doctor', 'lab_technician']}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      // Admin
      { path: 'admin', element: <AdminOverviewPage /> },
      { path: 'admin/queue', element: <ReceptionQueuePage /> },
      { path: 'admin/patients', element: <ReceptionPatientsPage /> },
      { path: 'admin/appointments', element: <ReceptionCheckInPage /> },
      { path: 'admin/staff', element: <AdminStaffPage /> },
      { path: 'admin/departments', element: <AdminDepartmentsPage /> },
      { path: 'admin/diagnostics', element: <LabOrdersPage /> },
      { path: 'admin/reports', element: <LabReportsPage /> },
      { path: 'admin/analytics', element: <AdminAnalyticsPage /> },
      { path: 'admin/audit-logs', element: <AdminAuditLogsPage /> },
      { path: 'admin/settings', element: <AdminSettingsPage /> },

      // Receptionist
      { path: 'reception', element: <ReceptionOverviewPage /> },
      { path: 'reception/queue', element: <ReceptionQueuePage /> },
      { path: 'reception/register-patient', element: <RegisterPatientPage /> },
      { path: 'reception/patients', element: <ReceptionPatientsPage /> },
      { path: 'reception/appointments', element: <ReceptionCheckInPage /> },
      { path: 'reception/check-in', element: <ReceptionCheckInPage /> },

      // Doctor
      { path: 'doctor', element: <DoctorConsolePage /> },
      { path: 'doctor/queue', element: <DoctorQueuePage /> },
      { path: 'doctor/patients', element: <ReceptionPatientsPage /> },
      { path: 'doctor/consultation/:consultationId', element: <DoctorConsultationPage /> },
      { path: 'doctor/history', element: <DoctorHistoryPage /> },

      // Lab
      { path: 'lab', element: <LabOverviewPage /> },
      { path: 'lab/orders', element: <LabOrdersPage /> },
      { path: 'lab/upload-report', element: <UploadReportPage /> },
      { path: 'lab/reports', element: <LabReportsPage /> },
    ],
  },

  // Fallback
  { path: '*', element: <Navigate to="/" replace /> },
]);
