import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingDown, Users, Clock, CheckCircle2 } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import apiClient from '../../services/apiClient';
import './Admin.scss';

export const AdminAnalyticsPage = () => {
  const [flowData, setFlowData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/analytics/patient-flow?days=14');
        if (res.success) {
          setFlowData(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="admin-page">
      <div className="card">
        <h4 style={{ margin: '0 0 1.5rem' }}>14-Day Clinic Volume & Turnaround Analytics</h4>
        <div style={{ width: '100%', height: 320 }}>
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
