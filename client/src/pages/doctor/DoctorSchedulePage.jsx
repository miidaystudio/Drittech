import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  Plus,
  Play,
  RotateCcw,
  Ban,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { appointmentService } from '../../services/appointmentService';
import { schedulingService } from '../../services/schedulingService';
import apiClient from '../../services/apiClient';
import { useSocket } from '../../context/SocketContext';
import './Doctor.scss';

export const DoctorSchedulePage = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [viewRange, setViewRange] = useState('today'); // 'today' | 'week'
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Time off modal
  const [isTimeOffModalOpen, setIsTimeOffModalOpen] = useState(false);
  const [timeOffStart, setTimeOffStart] = useState(() => new Date().toISOString().split('T')[0]);
  const [timeOffEnd, setTimeOffEnd] = useState(() => new Date().toISOString().split('T')[0]);
  const [timeOffReason, setTimeOffReason] = useState('');
  const [submittingTimeOff, setSubmittingTimeOff] = useState(false);

  const [notification, setNotification] = useState('');

  // Fetch appointments & doctor exceptions
  const fetchScheduleData = async () => {
    try {
      setLoading(true);
      const params = {};

      if (viewRange === 'today') {
        params.date = selectedDate;
      } else {
        // Week range: -1 day to +6 days
        const start = new Date(selectedDate);
        const end = new Date(selectedDate);
        end.setDate(end.getDate() + 6);
        params.startDate = start.toISOString().split('T')[0];
        params.endDate = end.toISOString().split('T')[0];
      }

      const [aptRes, excRes] = await Promise.all([
        appointmentService.getAppointments(params),
        schedulingService.getExceptions(),
      ]);

      if (aptRes.success) setAppointments(aptRes.data);
      if (excRes.success) setExceptions(excRes.data);
    } catch (err) {
      console.error('Error fetching doctor schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduleData();
  }, [selectedDate, viewRange]);

  // Live Socket.IO synchronization
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchScheduleData();
    socket.on('appointment:created', handleUpdate);
    socket.on('appointment:updated', handleUpdate);
    socket.on('appointment:cancelled', handleUpdate);

    return () => {
      socket.off('appointment:created', handleUpdate);
      socket.off('appointment:updated', handleUpdate);
      socket.off('appointment:cancelled', handleUpdate);
    };
  }, [socket, selectedDate, viewRange]);

  // 1-Click Launch Consultation Flow
  const handleStartConsultation = async (apt) => {
    try {
      const res = await apiClient.post('/consultations', {
        patientId: apt.patientId?._id || apt.patientId,
        queueEntryId: apt.queueEntryId?._id || apt.queueEntryId,
        appointmentId: apt._id,
      });

      if (res.success && res.data?._id) {
        navigate(`/app/doctor/consultation/${res.data._id}`);
      }
    } catch (err) {
      alert(err.message || 'Could not start consultation');
    }
  };

  // Block Time Off Submission
  const handleBlockTimeOff = async () => {
    if (!timeOffStart || !timeOffEnd || !timeOffReason) {
      alert('Please specify dates and a reason for time off');
      return;
    }

    try {
      setSubmittingTimeOff(true);
      const res = await schedulingService.createException({
        startDate: timeOffStart,
        endDate: timeOffEnd,
        type: 'leave',
        reason: timeOffReason,
      });

      if (res.success) {
        setNotification('Time off successfully scheduled. Slots on these dates are now blocked.');
        setIsTimeOffModalOpen(false);
        setTimeOffReason('');
        fetchScheduleData();
        setTimeout(() => setNotification(''), 5000);
      }
    } catch (err) {
      alert(err.message || 'Failed to block time off');
    } finally {
      setSubmittingTimeOff(false);
    }
  };

  return (
    <div className="doctor-page" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.375rem', color: '#FFFFFF' }}>My Clinical Schedule</h3>
          <p className="text-muted" style={{ margin: '4px 0 0', fontSize: '0.875rem' }}>
            View patient appointments, block out leaves/conferences, and jump directly into consultations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button variant="outline" icon={RefreshCw} onClick={fetchScheduleData}>
            Refresh
          </Button>
          <Button
            variant="outline"
            icon={Ban}
            onClick={() => setIsTimeOffModalOpen(true)}
            style={{ color: '#F87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
          >
            Block Time Off / Leave
          </Button>
        </div>
      </div>

      {notification && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            color: '#10B981',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <CheckCircle2 size={20} />
          <span>{notification}</span>
        </div>
      )}

      {/* Control Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Date controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                backgroundColor: '#171B29',
                border: '1px solid #1E2538',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '0.875rem',
              }}
            />
          </div>

          {/* Today vs Week toggle */}
          <div style={{ display: 'flex', gap: '0.375rem', backgroundColor: '#171B29', padding: '3px', borderRadius: '8px' }}>
            <button
              type="button"
              onClick={() => setViewRange('today')}
              style={{
                padding: '0.375rem 0.75rem',
                borderRadius: '6px',
                background: viewRange === 'today' ? '#2563EB' : 'transparent',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Today ({selectedDate})
            </button>
            <button
              type="button"
              onClick={() => setViewRange('week')}
              style={{
                padding: '0.375rem 0.75rem',
                borderRadius: '6px',
                background: viewRange === 'week' ? '#2563EB' : 'transparent',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              7-Day View
            </button>
          </div>
        </div>
      </div>

      {/* Active Leave / Exception Notices */}
      {exceptions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {exceptions.map((exc) => (
            <div
              key={exc._id}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: '10px',
                color: '#FBBF24',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '0.8125rem',
              }}
            >
              <ShieldAlert size={18} />
              <span>
                <strong>Scheduled {exc.type === 'holiday' ? 'Clinic Holiday' : 'Personal Leave'}:</strong>{' '}
                {new Date(exc.startDate).toLocaleDateString()} to {new Date(exc.endDate).toLocaleDateString()} — {exc.reason}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Appointment Timeline List */}
      <div className="card">
        <h4 style={{ margin: '0 0 1.25rem', color: '#FFFFFF' }}>
          Scheduled Appointments ({appointments.length})
        </h4>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="cf-skeleton" style={{ height: '70px', borderRadius: '10px' }} />
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
            <Calendar size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
            <p style={{ margin: 0, fontWeight: 600, color: '#FFFFFF' }}>No Appointments Scheduled</p>
            <p style={{ margin: '4px 0 0', fontSize: '0.8125rem' }}>
              Your schedule is open for this date or no bookings have been made.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {appointments.map((apt) => {
              const isCheckedIn = apt.status === 'checked_in';
              const isInConsultation = apt.status === 'in_consultation';

              return (
                <div
                  key={apt._id}
                  style={{
                    padding: '1rem 1.25rem',
                    backgroundColor: '#171B29',
                    border: `1px solid ${isCheckedIn ? '#10B981' : '#1E2538'}`,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div
                      style={{
                        padding: '0.5rem 0.875rem',
                        backgroundColor: '#121520',
                        borderRadius: '8px',
                        border: '1px solid #1E2538',
                        textAlign: 'center',
                        minWidth: '70px',
                      }}
                    >
                      <strong style={{ fontSize: '1rem', color: '#60A5FA', display: 'block' }}>
                        {apt.slotTime}
                      </strong>
                      <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                        {new Date(apt.appointmentDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <div>
                      <strong style={{ fontSize: '0.9375rem', color: '#FFFFFF', display: 'block' }}>
                        {apt.patientId?.fullName}
                      </strong>
                      <span style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
                        ID: {apt.patientId?.patientIdentifier} • Age: {apt.patientId?.age || '-'} • Gender: {apt.patientId?.gender || '-'}
                      </span>
                      {apt.reasonForVisit && (
                        <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                          Chief Complaint: {apt.reasonForVisit}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Badge status={apt.status} />

                    {/* One-Click Begin Consultation button for checked-in patient */}
                    {isCheckedIn && (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={Play}
                        onClick={() => handleStartConsultation(apt)}
                        style={{ backgroundColor: '#10B981', borderColor: '#10B981' }}
                      >
                        Begin Consultation
                      </Button>
                    )}

                    {isInConsultation && (
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Stethoscope}
                        onClick={() => handleStartConsultation(apt)}
                      >
                        Resume Notes
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Block Time Off */}
      <Modal
        isOpen={isTimeOffModalOpen}
        onClose={() => setIsTimeOffModalOpen(false)}
        title="Schedule Personal Leave / Block Time Off"
        subtitle="Slots during this timeframe will automatically be disabled from the booking engine"
        maxWidth="500px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <Button variant="outline" onClick={() => setIsTimeOffModalOpen(false)} disabled={submittingTimeOff}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleBlockTimeOff}
              disabled={submittingTimeOff}
              style={{ backgroundColor: '#EF4444', borderColor: '#EF4444' }}
            >
              {submittingTimeOff ? 'Blocking...' : 'Block Time Off'}
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '0.25rem' }}>
                START DATE
              </label>
              <input
                type="date"
                value={timeOffStart}
                onChange={(e) => setTimeOffStart(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.75rem', backgroundColor: '#171B29', border: '1px solid #1E2538', borderRadius: '8px', color: '#fff' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '0.25rem' }}>
                END DATE
              </label>
              <input
                type="date"
                value={timeOffEnd}
                onChange={(e) => setTimeOffEnd(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.75rem', backgroundColor: '#171B29', border: '1px solid #1E2538', borderRadius: '8px', color: '#fff' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '0.25rem' }}>
              REASON FOR LEAVE
            </label>
            <input
              type="text"
              placeholder="e.g., Annual vacation, Cardiology symposium speaker"
              value={timeOffReason}
              onChange={(e) => setTimeOffReason(e.target.value)}
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem',
                backgroundColor: '#171B29',
                border: '1px solid #1E2538',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '0.875rem',
              }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
