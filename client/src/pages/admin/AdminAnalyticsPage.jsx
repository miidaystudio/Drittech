import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingDown, Users, Clock, CheckCircle2, AlertTriangle, XCircle, Stethoscope } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import apiClient from '../../services/apiClient';
import { schedulingService } from '../../services/schedulingService';
import './Admin.scss';

export const AdminAnalyticsPage = () => {
  const [flowData, setFlowData] = useState([]);
  const [schedulingData, setSchedulingData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllAnalytics = async () => {
      try {
        setLoading(true);
        const [flowRes, schedRes] = await Promise.all([
          apiClient.get('/analytics/patient-flow?days=14'),
          schedulingService.getSchedulingAnalytics({ days: 14 }),
        ]);

        if (flowRes.success) setFlowData(flowRes.data);
        if (schedRes.success) setSchedulingData(schedRes.data);
      } catch (err) {
        console.error('Analytics fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllAnalytics();
  }, []);

  const summary = schedulingData?.summary || {
    totalBooked: 0,
    totalCompleted: 0,
    totalCancelled: 0,
    totalNoShow: 0,
    noShowRate: 0,
    cancellationRate: 0,
  };

  return (
    <div className="admin-page" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* KPI Cards Header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Appointments Booked
          </span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.75rem', color: '#FFFFFF' }}>{summary.totalBooked}</h3>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(37, 99, 235, 0.15)', color: '#60A5FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart3 size={20} />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Completed Visits
          </span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.75rem', color: '#10B981' }}>{summary.totalCompleted}</h3>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            No-Show Rate
          </span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.75rem', color: '#F59E0B' }}>{summary.noShowRate}%</h3>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={20} />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Cancellation Rate
          </span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.75rem', color: '#EF4444' }}>{summary.cancellationRate}%</h3>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <XCircle size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Trends Chart */}
      {schedulingData?.dailyTrends && (
        <div className="card">
          <h4 style={{ margin: '0 0 1.25rem', color: '#FFFFFF' }}>
            14-Day Appointment Booking & Completion Trends
          </h4>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={schedulingData.dailyTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2538" />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#141826',
                    borderColor: '#232B3E',
                    borderRadius: '12px',
                    color: '#FFFFFF',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                  }}
                />
                <Legend />
                <Bar dataKey="booked" name="Booked" fill="#2563EB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cancelled" name="Cancelled" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="noShow" name="No Show" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Doctor Utilization Breakdown */}
      {schedulingData?.doctorUtilization?.length > 0 && (
        <div className="card">
          <h4 style={{ margin: '0 0 1.25rem', color: '#FFFFFF' }}>
            Physician Caseload & Utilization
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {schedulingData.doctorUtilization.map((doc) => (
              <div
                key={doc.doctorName}
                style={{
                  padding: '1rem 1.25rem',
                  backgroundColor: '#171B29',
                  border: '1px solid #1E2538',
                  borderRadius: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <Stethoscope size={20} color="#2563EB" />
                  <strong style={{ fontSize: '0.9375rem', color: '#FFFFFF' }}>{doc.doctorName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#94A3B8', marginBottom: '0.5rem' }}>
                  <span>Total Appointments:</span>
                  <strong style={{ color: '#FFFFFF' }}>{doc.total}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#94A3B8' }}>
                  <span>Completed Consultations:</span>
                  <strong style={{ color: '#10B981' }}>{doc.completed}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Flow & Wait Turnaround Chart (Existing) */}
      <div className="card">
        <h4 style={{ margin: '0 0 1.5rem', color: '#FFFFFF' }}>Clinic Volume & Wait Turnaround</h4>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={flowData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2538" />
              <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} />
              <YAxis stroke="#94A3B8" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#141826',
                  borderColor: '#232B3E',
                  borderRadius: '12px',
                  color: '#FFFFFF',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                }}
              />
              <Legend />
              <Bar dataKey="registered" name="Patients Registered" fill="#2563EB" radius={[6, 6, 0, 0]} />
              <Bar dataKey="completed" name="Completed Visits" fill="#10B981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="avgWaitMins" name="Avg Wait (Mins)" fill="#F59E0B" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
