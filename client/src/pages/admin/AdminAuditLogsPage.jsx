import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Calendar, User } from 'lucide-react';
import apiClient from '../../services/apiClient';
import './Admin.scss';

export const AdminAuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/admin/audit-logs');
        if (res.success) {
          setLogs(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="admin-page">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 style={{ margin: 0 }}>System & Clinical Security Audit Trail</h4>
            <p className="text-muted" style={{ fontSize: '0.8125rem' }}>
              Immutable operational logs with actor role, resource ID, and IP address
            </p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="cf-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Role</th>
                <th>Action</th>
                <th>Resource Type</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log._id}>
                    <td>
                      <span className="font-mono text-muted" style={{ fontSize: '0.75rem' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </td>
                    <td>{log.userId?.name || 'System / Guest'}</td>
                    <td>
                      <span className="badge badge--called" style={{ textTransform: 'capitalize' }}>
                        {log.userRole || log.userId?.role || 'user'}
                      </span>
                    </td>
                    <td>
                      <strong className="font-mono" style={{ fontSize: '0.8125rem' }}>
                        {log.action}
                      </strong>
                    </td>
                    <td>{log.resourceType}</td>
                    <td><span className="font-mono text-muted" style={{ fontSize: '0.75rem' }}>{log.ipAddress || '127.0.0.1'}</span></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted">
                    No audit log records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
