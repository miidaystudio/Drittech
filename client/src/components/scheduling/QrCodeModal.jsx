import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Calendar, Clock, User, QrCode, Download, CheckCircle2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { appointmentService } from '../../services/appointmentService';

export const QrCodeModal = ({ isOpen, onClose, appointment }) => {
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    if (appointment && isOpen) {
      const payload = JSON.stringify({
        appointmentId: appointment._id,
        patientIdentifier: appointment.patientId?.patientIdentifier,
        clinicId: appointment.clinicId,
        date: appointment.appointmentDate,
        slotTime: appointment.slotTime,
      });

      QRCode.toDataURL(payload, {
        width: 240,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR code generation error:', err));
    }
  }, [appointment, isOpen]);

  if (!appointment) return null;

  const doctorName = appointment.doctorId?.userId?.name
    ? `Dr. ${appointment.doctorId.userId.name}`
    : 'Physician';
  const departmentName = appointment.departmentId?.name || 'Department';
  const dateFormatted = new Date(appointment.appointmentDate).toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Appointment Check-in Pass"
      subtitle="Present this QR code at the reception desk for instant queue token dispatch"
      maxWidth="480px"
      footer={
        <div style={{ display: 'flex', gap: '0.75rem', width: '100%', justifyContent: 'space-between' }}>
          <Button
            variant="outline"
            icon={Download}
            onClick={() => appointmentService.downloadIcsFile(appointment)}
          >
            Add to Calendar (.ics)
          </Button>
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', textAlign: 'center' }}>
        {qrDataUrl ? (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            }}
          >
            <img src={qrDataUrl} alt="Appointment Check-in QR Code" width="220" height="220" />
          </div>
        ) : (
          <div className="cf-skeleton" style={{ width: '220px', height: '220px', borderRadius: '16px' }} />
        )}

        <div style={{ width: '100%', backgroundColor: '#171B29', padding: '1rem', borderRadius: '12px', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Appointment ID</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#60A5FA', fontSize: '0.8125rem' }}>
              {appointment._id}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Patient</span>
            <strong style={{ fontSize: '0.875rem' }}>{appointment.patientId?.fullName}</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Doctor & Department</span>
            <span style={{ fontSize: '0.8125rem' }}>{doctorName} ({departmentName})</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Scheduled Date & Time</span>
            <strong style={{ color: '#10B981', fontSize: '0.8125rem' }}>
              {dateFormatted} at {appointment.slotTime}
            </strong>
          </div>
        </div>
      </div>
    </Modal>
  );
};
