import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AppointmentCalendar } from './AppointmentCalendar';
import { SlotPicker } from './SlotPicker';
import { schedulingService } from '../../services/schedulingService';
import { appointmentService } from '../../services/appointmentService';

export const RescheduleModal = ({ isOpen, onClose, appointment, onRescheduled }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const doctorId = appointment?.doctorId?._id || appointment?.doctorId;

  // Set initial date when modal opens
  useEffect(() => {
    if (appointment && isOpen) {
      const initialDate = appointment.appointmentDate
        ? new Date(appointment.appointmentDate).toISOString().split('T')[0]
        : '';
      setSelectedDate(initialDate);
      setSelectedSlot(null);
      setError('');
      setReason('');
    }
  }, [appointment, isOpen]);

  // Fetch slots whenever selectedDate changes
  useEffect(() => {
    let isMounted = true;
    if (!selectedDate || !doctorId || !isOpen) return;

    const fetchSlots = async () => {
      try {
        setLoadingSlots(true);
        setError('');
        const res = await schedulingService.getAvailability({
          doctorId,
          date: selectedDate,
        });

        if (isMounted && res.success && res.data?.dates?.length > 0) {
          const docData = res.data.dates[0].doctors.find(
            (d) => String(d.doctorId) === String(doctorId)
          );
          setSlots(docData?.slots || []);
        } else {
          setSlots([]);
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load available slots');
      } finally {
        if (isMounted) setLoadingSlots(false);
      }
    };

    fetchSlots();
    return () => {
      isMounted = false;
    };
  }, [selectedDate, doctorId, isOpen]);

  const handleConfirmReschedule = async () => {
    if (!selectedDate || !selectedSlot) {
      setError('Please choose a date and an available slot');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await appointmentService.rescheduleAppointment(appointment._id, {
        newDoctorId: doctorId,
        newAppointmentDate: selectedDate,
        newSlotTime: selectedSlot.slotTime,
        reason,
      });

      if (res.success) {
        onRescheduled(res.data.newAppointment);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to reschedule appointment');
    } finally {
      setSubmitting(false);
    }
  };

  if (!appointment) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reschedule Appointment"
      subtitle={`Choose a new date and time with ${appointment.doctorId?.userId?.name ? `Dr. ${appointment.doctorId.userId.name}` : 'your doctor'}`}
      maxWidth="720px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirmReschedule}
            disabled={!selectedDate || !selectedSlot || submitting}
          >
            {submitting ? 'Confirming...' : 'Confirm New Slot'}
          </Button>
        </div>
      }
    >
      {error && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            color: '#F87171',
            fontSize: '0.8125rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 320px) 1fr', gap: '1.5rem', alignItems: 'start' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', marginBottom: '0.5rem' }}>
            SELECT NEW DATE
          </label>
          <AppointmentCalendar
            selectedDate={selectedDate}
            onSelectDate={(date) => {
              setSelectedDate(date);
              setSelectedSlot(null);
            }}
            doctorId={doctorId}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', marginBottom: '0.5rem' }}>
            AVAILABLE SLOTS ({selectedDate || 'Select a date'})
          </label>
          <SlotPicker
            slots={slots}
            selectedSlot={selectedSlot}
            onSelectSlot={setSelectedSlot}
            loading={loadingSlots}
            date={selectedDate}
            doctorId={doctorId}
          />

          <div style={{ marginTop: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', marginBottom: '0.375rem' }}>
              REASON FOR RESCHEDULING (OPTIONAL)
            </label>
            <input
              type="text"
              className="cf-input"
              placeholder="e.g., Work conflict, doctor requested alternative time"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                backgroundColor: '#121520',
                border: '1px solid #1E2538',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '0.875rem',
              }}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};
