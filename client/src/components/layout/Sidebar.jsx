import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Layers,
  FlaskConical,
  FileText,
  BarChart3,
  Bell,
  Settings,
  ShieldCheck,
  Stethoscope,
  Tv,
  LogOut,
  UserCheck,
  FolderKanban,
  FileCheck2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.scss';

export const Sidebar = ({ isCollapsed, onToggleCollapse }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getNavItems = () => {
    if (role === 'super_admin' || role === 'clinic_admin') {
      return [
        { label: 'Overview', to: '/app/admin', icon: LayoutDashboard, end: true },
        { label: 'Patient Queue', to: '/app/admin/queue', icon: Layers },
        { label: 'Patients Directory', to: '/app/admin/patients', icon: Users },
        { label: 'Appointments', to: '/app/admin/appointments', icon: Calendar },
        { label: 'Doctors & Staff', to: '/app/admin/staff', icon: Stethoscope },
        { label: 'Departments', to: '/app/admin/departments', icon: FolderKanban },
        { label: 'Lab Orders', to: '/app/admin/diagnostics', icon: FlaskConical },
        { label: 'Medical Reports', to: '/app/admin/reports', icon: FileText },
        { label: 'Flow Analytics', to: '/app/admin/analytics', icon: BarChart3 },
        { label: 'Audit Logs', to: '/app/admin/audit-logs', icon: ShieldCheck },
        { label: 'Notifications', to: '/app/admin/notifications', icon: Bell },
        { label: 'Clinic Settings', to: '/app/admin/settings', icon: Settings },
      ];
    }
    if (role === 'receptionist') {
      return [
        { label: 'Overview', to: '/app/reception', icon: LayoutDashboard, end: true },
        { label: 'Live Queue Manager', to: '/app/reception/queue', icon: Layers },
        { label: 'Register Patient', to: '/app/reception/register-patient', icon: UserCheck },
        { label: 'Patients Directory', to: '/app/reception/patients', icon: Users },
        { label: 'Appointment Check-in', to: '/app/reception/check-in', icon: Calendar },
      ];
    }
    if (role === 'doctor') {
      return [
        { label: 'Doctor Console', to: '/app/doctor', icon: Stethoscope, end: true },
        { label: 'Patient Queue', to: '/app/doctor/queue', icon: Layers },
        { label: 'Patient Records', to: '/app/doctor/patients', icon: Users },
        { label: 'Consultation History', to: '/app/doctor/history', icon: FileCheck2 },
      ];
    }
    if (role === 'lab_technician') {
      return [
        { label: 'Lab Dashboard', to: '/app/lab', icon: LayoutDashboard, end: true },
        { label: 'Active Orders', to: '/app/lab/orders', icon: FlaskConical },
        { label: 'Upload Report', to: '/app/lab/upload-report', icon: FileText },
        { label: 'Published Reports', to: '/app/lab/reports', icon: FileCheck2 },
      ];
    }
    return [
      { label: 'My Health Home', to: '/patient', icon: LayoutDashboard, end: true },
      { label: 'Appointments', to: '/patient/appointments', icon: Calendar },
      { label: 'Diagnostic Reports', to: '/patient/reports', icon: FileText },
      { label: 'Profile & Settings', to: '/patient/profile', icon: Settings },
    ];
  };

  const items = getNavItems();

  return (
    <aside className="cf-sidebar">
      {/* Logo */}
      <div className="cf-sidebar__logo-wrap">
        <NavLink to="/" className="cf-sidebar__logo" title="Drittech Home">
          <svg viewBox="0 0 100 100" width="28" height="28" xmlns="http://www.w3.org/2000/svg">
            <circle cx="38" cy="50" r="32" fill="#00AEEF"/>
            <circle cx="38" cy="50" r="12" fill="white"/>
            <path d="M50 22 C70 22 88 28 88 42 C88 52 78 56 68 58 L50 62 L50 50 L66 48 C74 47 76 44 74 40 C72 36 64 34 50 34 Z" fill="#0090C8"/>
            <path d="M50 62 L50 74 L66 68 C76 64 82 58 80 52 C78 48 74 48 68 50 Z" fill="#007BB0"/>
          </svg>
        </NavLink>
      </div>

      {/* Nav Icons */}
      <nav className="cf-sidebar__nav">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `cf-sidebar__link${isActive ? ' cf-sidebar__link--active' : ''}`
              }
              title={item.label}
            >
              <Icon size={18} strokeWidth={2} />
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="cf-sidebar__footer">
        <a
          href="/display/all/all"
          target="_blank"
          rel="noopener noreferrer"
          className="cf-sidebar__link"
          title="Waiting-Room TV"
        >
          <Tv size={18} strokeWidth={2} />
        </a>

        <div className="cf-sidebar__user-avatar" title={user?.name}>
          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>

        <button
          className="cf-sidebar__logout"
          onClick={handleLogout}
          title="Log out"
        >
          <LogOut size={18} strokeWidth={2} />
        </button>
      </div>
    </aside>
  );
};
