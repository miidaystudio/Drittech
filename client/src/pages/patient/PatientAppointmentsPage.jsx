import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, CheckCircle2 } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import apiClient from '../../services/apiClient';

export const PatientAppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApts = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/appointments');
        if (res.success) {
          setAppointments(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchApts();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1080px', margin: '0 auto' }}>
      <div className="card">
        <h4 style={{ margin: '0 0 1rem' }}>My Scheduled Appointments</h4>
        <div className="table-responsive">
          <table className="cf-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time Slot</th>
                <th>Doctor</th>
                <th>Department</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length > 0 ? (
                appointments.map((apt) => (
                  <tr key={apt._id}>
                    <td><strong>{new Date(apt.appointmentDate).toLocaleDateString()}</strong></td>
                    <td>{apt.slotTime}</td>
                    <td>Dr. {apt.doctorId?.userId?.name || 'Physician'}</td>
                    <td>{apt.departmentId?.name || 'General'}</td>
                    <td>{apt.reasonForVisit || 'Consultation'}</td>
                    <td><Badge status={apt.status} /></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted">
                    No appointments scheduled
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
