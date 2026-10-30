import React, { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
  Stethoscope,
  TrendingUp,
  BarChart2,
  Building2,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import apiClient from '../../services/apiClient';
import { Badge } from '../../components/ui/Badge';
import './Admin.scss';

export const AdminOverviewPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [flowData, setFlowData] = useState([]);
  const [doctorStats, setDoctorStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        const [overviewRes, flowRes, docRes] = await Promise.all([
          apiClient.get('/analytics/overview'),
          apiClient.get('/analytics/patient-flow?days=7'),
          apiClient.get('/analytics/doctor-stats'),
        ]);

        if (overviewRes.success) setMetrics(overviewRes.data);
        if (flowRes.success) setFlowData(flowRes.data);
        if (docRes.success) setDoctorStats(docRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-muted">Loading administrative analytics...</div>;
  }

  return (
    <div className="admin-page">
      {/* Top 5 Metrics */}
      <div className="grid md:grid-cols-5 gap-4">
        <div className="card metric-card">
          <div className="metric-card__icon metric-card__icon--primary">
            <Users size={20} />
          </div>
          <div>
            <span className="metric-card__label">Registered Today</span>
            <h3 className="metric-card__value">{metrics?.totalPatientsRegisteredToday || 0}</h3>
          </div>
        </div>

        <div className="card metric-card">
          <div className="metric-card__icon metric-card__icon--warning">
            <Clock size={20} />
          </div>
          <div>
            <span className="metric-card__label">Currently Waiting</span>
            <h3 className="metric-card__value">{metrics?.patientsWaitingNow || 0}</h3>
          </div>
        </div>

        <div className="card metric-card">
          <div className="metric-card__icon metric-card__icon--info">
            <TrendingUp size={20} />
          </div>
          <div>
            <span className="metric-card__label">Average Wait</span>
            <h3 className="metric-card__value">~{metrics?.avgWaitTimeMinutes || 14}m</h3>
          </div>
        </div>

        <div className="card metric-card">
          <div className="metric-card__icon metric-card__icon--success">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="metric-card__label">Visits Completed</span>
            <h3 className="metric-card__value">{metrics?.consultationsCompletedToday || 0}</h3>
          </div>
        </div>

        <div className="card metric-card">
          <div className="metric-card__icon metric-card__icon--warning">
            <FlaskConical size={20} />
          </div>
          <div>
            <span className="metric-card__label">Pending Lab Orders</span>
            <h3 className="metric-card__value">{metrics?.pendingLabReports || 0}</h3>
          </div>
        </div>
      </div>

      {/* 7-Day Patient Volume & Flow Trends */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="card md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 style={{ margin: 0 }}>7-Day Patient Flow & Wait Times</h4>
              <p className="text-muted" style={{ fontSize: '0.8125rem' }}>
                Daily registered visits vs. completed consultations
              </p>
            </div>
            <span className="badge badge--called">Real-time Data</span>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <AreaChart data={flowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRegistered" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2538" />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#141826',
                    borderColor: '#232B3E',
                    borderRadius: '12px',
                    color: '#FFFFFF',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="registered"
                  name="Registered"
                  stroke="#2563EB"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRegistered)"
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  name="Completed"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCompleted)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Queue Status Breakdown */}
        <div className="card">
          <h4 style={{ margin: '0 0 1rem' }}>Today's Queue Breakdown</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div className="flex items-center justify-between">
              <span className="badge badge--waiting">Waiting</span>
              <strong>{metrics?.statusBreakdown?.waiting || 0}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="badge badge--called">Called</span>
              <strong>{metrics?.statusBreakdown?.called || 0}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="badge badge--in_consultation">In Consultation</span>
              <strong>{metrics?.statusBreakdown?.in_consultation || 0}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="badge badge--completed">Completed</span>
              <strong>{metrics?.statusBreakdown?.completed || 0}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="badge badge--skipped">Skipped / Cancelled</span>
              <strong>
                {(metrics?.statusBreakdown?.skipped || 0) + (metrics?.statusBreakdown?.cancelled || 0)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Doctor Utilization & Availability Table */}
      <div className="card">
        <h4 style={{ margin: '0 0 1rem' }}>Physician Utilization & Consultation Pace</h4>
        <div className="table-responsive">
          <table className="cf-table">
            <thead>
              <tr>
                <th>Physician</th>
                <th>Department</th>
                <th>Room</th>
                <th>Patients Served Today</th>
                <th>Avg Duration</th>
                <th>Utilization Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {doctorStats.map((doc) => (
                <tr key={doc.id}>
                  <td><strong>Dr. {doc.name}</strong></td>
                  <td>{doc.department}</td>
                  <td>{doc.roomNumber}</td>
                  <td>{doc.patientsServed} visits</td>
                  <td>~{doc.avgConsultDuration} mins</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div
                        style={{
                          flex: 1,
                          height: '6px',
                          backgroundColor: '#1E2538',
                          borderRadius: '999px',
                          overflow: 'hidden',
                          maxWidth: '100px',
                        }}
                      >
                        <div
                          style={{
                            width: `${doc.utilizationScore}%`,
                            height: '100%',
                            backgroundColor: '#2563EB',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8' }}>{doc.utilizationScore}%</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge--completed">Active</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
