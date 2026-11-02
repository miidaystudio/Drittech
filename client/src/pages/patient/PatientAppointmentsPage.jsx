import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  Plus,
  QrCode,
  Download,
  RotateCcw,
  XCircle,
  AlertCircle,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { appointmentService } from '../../services/appointmentService';
import { QrCodeModal } from '../../components/scheduling/QrCodeModal';
import { RescheduleModal } from '../../components/scheduling/RescheduleModal';
import { useSocket } from '../../context/SocketContext';

export const PatientAppointmentsPage = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'past'
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Modals state
  const [selectedAppointmentForQr, setSelectedAppointmentForQr] = useState(null);
  const [selectedAppointmentForReschedule, setSelectedAppointmentForReschedule] = useState(null);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await appointmentService.getAppointments();
      if (res.success) {
        setAppointments(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Real-time synchronization
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchAppointments();
    socket.on('appointment:created', handleUpdate);
    socket.on('appointment:updated', handleUpdate);
    socket.on('appointment:cancelled', handleUpdate);

    return () => {
      socket.off('appointment:created', handleUpdate);
      socket.off('appointment:updated', handleUpdate);
      socket.off('appointment:cancelled', handleUpdate);
    };
  }, [socket]);

  const now = new Date();

  // Split appointments into Upcoming and Past
  const upcomingAppointments = appointments.filter((apt) => {
    const aptTime = apt.startTime ? new Date(apt.startTime) : new Date(apt.appointmentDate);
    const isFutureOrToday = aptTime >= new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const isPendingOrConfirmed = ['pending', 'confirmed', 'scheduled', 'checked_in', 'in_consultation'].includes(
      apt.status
    );
    return isFutureOrToday && isPendingOrConfirmed;
  });

  const pastAppointments = appointments.filter((apt) => {
    return !upcomingAppointments.some((u) => u._id === apt._id);
  });

  const displayList = activeTab === 'upcoming' ? upcomingAppointments : pastAppointments;

  // Handle Cancel
  const handleConfirmCancel = async () => {
    if (!appointmentToCancel) return;
    try {
      setCancelling(true);
      setError('');
      const res = await appointmentService.cancelAppointment(appointmentToCancel._id, {
        reason: cancelReason || 'Cancelled by patient',
      });
      if (res.success) {
        setActionSuccess('Appointment successfully cancelled');
        setAppointmentToCancel(null);
        setCancelReason('');
        fetchAppointments();
        setTimeout(() => setActionSuccess(''), 4000);
      }
    } catch (err) {
      setError(err.message || 'Failed to cancel appointment');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1080px', margin: '0 auto' }}>
      {/* Top Banner & Action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.375rem', color: '#FFFFFF' }}>My Scheduled Appointments</h3>
          <p className="text-muted" style={{ margin: '4px 0 0', fontSize: '0.875rem' }}>
            Manage upcoming consultations, download digital passes, or reschedule your appointment.
          </p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => navigate('/patient/appointments/book')}
        >
          Book New Appointment
        </Button>
      </div>

      {actionSuccess && (
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
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            color: '#F87171',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1E2538', gap: '1.5rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab('upcoming')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'upcoming' ? '2px solid #2563EB' : '2px solid transparent',
            color: activeTab === 'upcoming' ? '#FFFFFF' : '#94A3B8',
            fontWeight: activeTab === 'upcoming' ? 700 : 500,
            fontSize: '0.9375rem',
            padding: '0.75rem 0.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          Upcoming Visits ({upcomingAppointments.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('past')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'past' ? '2px solid #2563EB' : '2px solid transparent',
            color: activeTab === 'past' ? '#FFFFFF' : '#94A3B8',
            fontWeight: activeTab === 'past' ? 700 : 500,
            fontSize: '0.9375rem',
            padding: '0.75rem 0.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          Past & History ({pastAppointments.length})
        </button>
      </div>

      {/* Appointment Cards List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="cf-skeleton" style={{ height: '110px', borderRadius: '16px' }} />
          ))}
        </div>
      ) : displayList.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
          <Calendar size={36} style={{ color: '#64748B', margin: '0 auto 1rem' }} />
          <h4 style={{ margin: '0 0 0.5rem', color: '#FFFFFF' }}>
            No {activeTab === 'upcoming' ? 'Upcoming' : 'Past'} Appointments
          </h4>
          <p className="text-muted" style={{ margin: '0 auto 1.5rem', maxWidth: '420px', fontSize: '0.875rem' }}>
            {activeTab === 'upcoming'
              ? 'You have no appointments scheduled. Choose your doctor and book a live slot anytime.'
              : 'You have no past or archived consultation records.'}
          </p>
          {activeTab === 'upcoming' && (
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => navigate('/patient/appointments/book')}
            >
              Book Consultation Now
            </Button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {displayList.map((apt) => {
            const docName = apt.doctorId?.userId?.name ? `Dr. ${apt.doctorId.userId.name}` : 'Physician';
            const deptName = apt.departmentId?.name || 'Department';
            const formattedDate = new Date(apt.appointmentDate).toLocaleDateString(undefined, {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });

            return (
              <div
                key={apt._id}
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1.25rem 1.5rem',
                  gap: '1.5rem',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', minWidth: '240px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(37, 99, 235, 0.12)',
                      color: '#60A5FA',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Calendar size={22} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '1rem', color: '#FFFFFF', display: 'block' }}>
                      {formattedDate} at {apt.slotTime}
                    </strong>
                    <span style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
                      {docName} • {deptName}
                    </span>
                    {apt.reasonForVisit && (
                      <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                        Note: {apt.reasonForVisit}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <Badge status={apt.status} />

                  {activeTab === 'upcoming' && (
                    <>
                      {/* Check-in QR pass */}
                      <Button
                        variant="outline"
                        size="sm"
                        icon={QrCode}
                        onClick={() => setSelectedAppointmentForQr(apt)}
                      >
                        Check-in QR
                      </Button>

                      {/* Add to Calendar (.ics) */}
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Download}
                        onClick={() => appointmentService.downloadIcsFile(apt)}
                        title="Download .ics Calendar Event"
                      >
                        Calendar
                      </Button>

                      {/* Reschedule */}
                      <Button
                        variant="outline"
                        size="sm"
                        icon={RotateCcw}
                        onClick={() => setSelectedAppointmentForReschedule(apt)}
                      >
                        Reschedule
                      </Button>

                      {/* Cancel */}
                      <Button
                        variant="outline"
                        size="sm"
                        icon={XCircle}
                        onClick={() => setAppointmentToCancel(apt)}
                        style={{ color: '#F87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Code Modal */}
      <QrCodeModal
        isOpen={!!selectedAppointmentForQr}
        onClose={() => setSelectedAppointmentForQr(null)}
        appointment={selectedAppointmentForQr}
      />

      {/* Reschedule Modal */}
      <RescheduleModal
        isOpen={!!selectedAppointmentForReschedule}
        onClose={() => setSelectedAppointmentForReschedule(null)}
        appointment={selectedAppointmentForReschedule}
        onRescheduled={() => {
          setActionSuccess('Appointment rescheduled successfully');
          fetchAppointments();
          setTimeout(() => setActionSuccess(''), 4000);
        }}
      />

      {/* Cancel Confirmation Modal */}
      {appointmentToCancel && (
        <div
          className="cf-modal-overlay"
          onClick={() => setAppointmentToCancel(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
          }}
        >
          <div
            className="cf-modal"
            style={{ maxWidth: '440px', padding: '1.5rem', backgroundColor: '#121520', borderRadius: '16px', border: '1px solid #1E2538' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 style={{ margin: '0 0 0.5rem', color: '#FFFFFF' }}>Cancel Appointment?</h4>
            <p className="text-muted" style={{ fontSize: '0.875rem', margin: '0 0 1rem' }}>
              Are you sure you want to cancel your consultation for {appointmentToCancel.slotTime}? This will release the slot for other patients.
            </p>

            <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '0.375rem' }}>
              CANCELLATION REASON (OPTIONAL)
            </label>
            <input
              type="text"
              placeholder="e.g., Schedule conflict, feeling better"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem',
                backgroundColor: '#171B29',
                border: '1px solid #1E2538',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '0.875rem',
                marginBottom: '1.25rem',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <Button variant="outline" onClick={() => setAppointmentToCancel(null)} disabled={cancelling}>
                Keep Appointment
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmCancel}
                disabled={cancelling}
                style={{ backgroundColor: '#EF4444', borderColor: '#EF4444' }}
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
