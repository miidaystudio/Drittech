import React, { useState, useEffect } from 'react';
import { FileCheck2, Search, Calendar, User, Eye } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import apiClient from '../../services/apiClient';
import './Doctor.scss';

export const DoctorHistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/consultations', { params: { status: 'completed' } });
        if (res.success) {
          setHistory(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="doctor-console">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 style={{ margin: 0 }}>Completed Consultations History</h4>
            <p className="text-muted" style={{ fontSize: '0.8125rem' }}>
              Archive of finalized clinical visits, assessments, and prescriptions
            </p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="cf-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Patient Name</th>
                <th>Primary Diagnosis</th>
                <th>Chief Complaint</th>
                <th>Duration</th>
                <th>Prescriptions</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? (
                history.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <strong>{new Date(c.completedAt || c.createdAt).toLocaleDateString()}</strong>
                      <span className="text-muted" style={{ display: 'block', fontSize: '0.75rem' }}>
                        {new Date(c.completedAt || c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td>
                      <div className="patient-cell">
                        <strong>{c.patientId?.fullName}</strong>
                        <span>ID: {c.patientId?.patientIdentifier}</span>
                      </div>
                    </td>
                    <td><strong>{c.diagnosis || 'Clinical visit'}</strong></td>
                    <td><span className="intake-notes-text">{c.chiefComplaint || '-'}</span></td>
                    <td>{c.durationMinutes || 15} mins</td>
                    <td>
                      {c.prescriptions && c.prescriptions.length > 0 ? (
                        <span className="badge badge--completed">{c.prescriptions.length} prescribed</span>
                      ) : (
                        <span className="text-muted">None</span>
                      )}
                    </td>
                    <td><Badge status={c.status} /></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted">
                    No completed consultations found in archive
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
