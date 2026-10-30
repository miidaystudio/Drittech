import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAuth } from '../../context/AuthContext';

export const DashboardLayout = () => {
  const location = useLocation();
  const { role } = useAuth();

  // Determine dynamic title based on active path
  const getHeaderMeta = () => {
    const p = location.pathname;
    if (p.includes('/admin/queue') || p.includes('/reception/queue') || p.includes('/doctor/queue')) {
      return { title: 'Live Patient Queue', subtitle: 'Real-time patient flow, wait-time estimation, and room dispatch' };
    }
    if (p.includes('/doctor/consultation')) {
      return { title: 'Clinical Consultation Workspace', subtitle: 'Doctor assessment, diagnosis, prescription, and diagnostics' };
    }
    if (p.includes('/reception/register-patient')) {
      return { title: 'Patient Registration & Check-in', subtitle: 'Instant token generation and queue assignment' };
    }
    if (p.includes('/lab/upload-report')) {
      return { title: 'Diagnostic Report Upload', subtitle: 'Secure verification, AI plain-language summary, and publishing' };
    }
    if (p.includes('/lab')) {
      return { title: 'Diagnostic Laboratory Center', subtitle: 'Order processing, sample tracking, and pathology reports' };
    }
    if (p.includes('/admin/analytics')) {
      return { title: 'Clinic Flow Analytics', subtitle: 'Patient volume, wait times, provider utilization, and turnaround metrics' };
    }
    if (p.includes('/admin/audit-logs')) {
      return { title: 'System & Clinical Audit Trail', subtitle: 'Security and data governance logs' };
    }
    if (p.includes('/patient/reports')) {
      return { title: 'Diagnostic Lab Reports', subtitle: 'Encrypted patient records and verified lab results' };
    }
    if (p.includes('/patient')) {
      return { title: 'Patient Health Portal', subtitle: 'Your active tokens, visits, and reports' };
    }

    return {
      title: `${role ? role.replace('_', ' ').toUpperCase() : 'MANAGEMENT'} CONSOLE`,
      subtitle: 'Drittech Clinic & Diagnostic Center Operations',
    };
  };

  const meta = getHeaderMeta();

  return (
    <div className="app-container">
      <Sidebar />
      <main className="dashboard-main">
        <Topbar title={meta.title} subtitle={meta.subtitle} />
        <div className="content-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
