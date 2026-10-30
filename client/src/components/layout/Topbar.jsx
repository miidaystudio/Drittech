import React, { useState, useEffect } from 'react';
import {
  Bell,
  Wifi,
  WifiOff,
  Building2,
  User,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import './Topbar.scss';

export const Topbar = ({ title, subtitle }) => {
  const { user } = useAuth();
  const { connected, socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [timeframe, setTimeframe] = useState('This Month');

  useEffect(() => {
    if (socket) {
      const handleNotification = (notif) => {
        setNotifications((prev) => [notif, ...prev]);
      };
      socket.on('notification:new', handleNotification);
      socket.on('notification:clinic', handleNotification);

      return () => {
        socket.off('notification:new', handleNotification);
        socket.off('notification:clinic', handleNotification);
      };
    }
  }, [socket]);

  return (
    <header className="cf-topbar">
      <div className="cf-topbar__title-wrapper">
        <h1 className="cf-topbar__title">{title}</h1>
        {subtitle && <p className="cf-topbar__subtitle">{subtitle}</p>}
      </div>

      {/* Middle: Salesforce-style Timeframe Filter Switcher */}
      <div className="cf-topbar__timeframe">
        {['Today', 'This Week', 'This Month', 'Reports'].map((tab) => (
          <button
            key={tab}
            type="button"
            className={`timeframe-pill ${timeframe === tab ? 'timeframe-pill--active' : ''}`}
            onClick={() => setTimeframe(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="cf-topbar__actions">
        {/* Real-time Socket Connection Status Indicator */}
        <div
          className={`cf-topbar__status ${
            connected ? 'cf-topbar__status--connected' : 'cf-topbar__status--disconnected'
          }`}
          title={connected ? 'Live WebSocket Connected' : 'Connecting to real-time engine...'}
        >
          {connected ? <Wifi size={13} /> : <WifiOff size={13} />}
          <span>{connected ? 'Live Sync' : 'Reconnecting'}</span>
        </div>

        {/* Clinic Scope Dropdown Pill (Salesforce "All Outlets" style) */}
        <div className="cf-topbar__clinic-pill">
          <Building2 size={14} className="clinic-icon" />
          <span className="clinic-name">{user?.clinicId?.name || 'All Outlets (Main Clinic)'}</span>
          <ChevronDown size={14} className="chevron-icon" />
        </div>

        {/* Live Notification Bell */}
        <div className="cf-topbar__notif-wrapper">
          <button
            className="cf-topbar__notif-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
          >
            <Bell size={16} />
            {notifications.length > 0 && (
              <span className="cf-topbar__notif-count">{notifications.length}</span>
            )}
          </button>

          {showNotifications && (
            <div className="cf-topbar__notif-dropdown">
              <div className="cf-topbar__notif-header">
                <h5>Notifications</h5>
                <span className="text-muted">{notifications.length} alerts</span>
              </div>
              <div className="cf-topbar__notif-list">
                {notifications.length > 0 ? (
                  notifications.map((n, idx) => (
                    <div key={idx} className="cf-topbar__notif-item">
                      <CheckCircle2 size={16} color="#10B981" />
                      <div>
                        <h6>{n.title}</h6>
                        <p>{n.message}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="cf-topbar__notif-empty">No unread notifications</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar Mini Badge */}
        <div className="cf-topbar__avatar-pill" title={user?.name || 'User Profile'}>
          <div className="avatar-circle">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};
