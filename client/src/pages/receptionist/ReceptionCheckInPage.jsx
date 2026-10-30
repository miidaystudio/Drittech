import React, { useState, useEffect } from 'react';
import { Calendar, Clock, UserCheck, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import apiClient from '../../services/apiClient';
import './Reception.scss';

export const ReceptionCheckInPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkInSuccess, setCheckInSuccess] = useState(null);

  const fetchAppointments = async () => {
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

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCheckIn = async (appointmentId) => {
    try {
      const res = await apiClient.post(`/appointments/${appointmentId}/check-in`);
      if (res.success) {
        setCheckInSuccess(`Checked in: Token ${res.data.queueEntry.tokenNumber} assigned!`);
        fetchAppointments();
        setTimeout(() => setCheckInSuccess(null), 4000);
      }
    } catch (err) {
      alert(err.message || 'Check-in failed');
    }
  };

  return (
    <div className="reception-page">
      {checkInSuccess && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem',
            backgroundColor: '#D1FAE5',
            color: '#065F46',
            borderRadius: '8px',
          }}
        >
          <CheckCircle2 size={20} />
          <strong>{checkInSuccess}</strong>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 style={{ margin: 0 }}>Scheduled Appointments Check-in</h4>
            <p className="text-muted" style={{ fontSize: '0.8125rem' }}>
              Confirm patient arrival and dispatch queue token automatically
            </p>
          </div>
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchAppointments}>
            Refresh
          </Button>
        </div>

        <div className="table-responsive">
          <table className="cf-table">
            <thead>
              <tr>
                <th>Appointment Date & Time</th>
                <th>Patient Name</th>
                <th>Doctor</th>
                <th>Department</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length > 0 ? (
                appointments.map((apt) => (
                  <tr key={apt._id}>
                    <td>
                      <strong>{new Date(apt.appointmentDate).toLocaleDateString()}</strong>
                      <span className="text-muted" style={{ display: 'block', fontSize: '0.75rem' }}>
                        Slot: {apt.slotTime}
                      </span>
                    </td>
                    <td>
                      <div className="patient-cell">
                        <strong>{apt.patientId?.fullName}</strong>
                        <span>{apt.patientId?.patientIdentifier}</span>
                      </div>
                    </td>
                    <td>Dr. {apt.doctorId?.userId?.name || 'Physician'}</td>
                    <td>{apt.departmentId?.name || 'General'}</td>
                    <td>{apt.reasonForVisit || apt.type}</td>
                    <td>
                      <Badge status={apt.status} />
                    </td>
                    <td>
                      {apt.status === 'scheduled' ? (
                        <Button
                          variant="primary"
                          size="sm"
                          icon={UserCheck}
                          onClick={() => handleCheckIn(apt._id)}
                        >
                          Check In Now
                        </Button>
                      ) : (
                        <span className="text-muted" style={{ fontSize: '0.8125rem' }}>
                          ✓ In Queue
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted">
                    No scheduled appointments found
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
