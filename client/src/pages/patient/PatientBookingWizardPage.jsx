import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import QRCode from 'qrcode';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  FolderKanban,
  FileText,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Download,
  AlertCircle,
  Sparkles,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { AppointmentCalendar } from '../../components/scheduling/AppointmentCalendar';
import { SlotPicker } from '../../components/scheduling/SlotPicker';
import { appointmentService } from '../../services/appointmentService';
import { schedulingService } from '../../services/schedulingService';
import apiClient from '../../services/apiClient';
import './PatientBookingWizardPage.scss';

const STEPS = [
  { id: 1, title: 'Department' },
  { id: 2, title: 'Physician' },
  { id: 3, title: 'Date' },
  { id: 4, title: 'Time Slot' },
  { id: 5, title: 'Details' },
];

export const PatientBookingWizardPage = () => {
  const navigate = useNavigate();

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointmentTypes, setAppointmentTypes] = useState([]);

  // Selected booking choices
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null); // null = "Any available"
  const [isAnyDoctor, setIsAnyDoctor] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [reasonForVisit, setReasonForVisit] = useState('');

  // Booking result / confirmation
  const [submitting, setSubmitting] = useState(false);
  const [bookedAppointment, setBookedAppointment] = useState(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Initial Load: Fetch departments and appointment types
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [deptRes, typesRes] = await Promise.all([
          apiClient.get('/admin/departments'),
          schedulingService.getAppointmentTypes(),
        ]);
        if (deptRes.success) setDepartments(deptRes.data);
        if (typesRes.success) {
          setAppointmentTypes(typesRes.data);
          if (typesRes.data.length > 0) {
            setSelectedType(typesRes.data[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load booking metadata:', err);
      }
    };
    fetchMetadata();
  }, []);

  // 2. Fetch doctors when department is selected
  useEffect(() => {
    if (!selectedDepartment) return;
    const fetchDoctors = async () => {
      try {
        const res = await apiClient.get('/admin/staff');
        if (res.success) {
          // Filter doctors by selected department
          const docs = res.data.filter(
            (s) => s.role === 'doctor' && (s.departmentId === selectedDepartment._id || s.departmentId?._id === selectedDepartment._id)
          );
          setDoctors(docs);
        }
      } catch (err) {
        console.error('Failed to load doctors:', err);
      }
    };
    fetchDoctors();
  }, [selectedDepartment]);

  // 3. Fetch availability when date and doctor/department are picked
  useEffect(() => {
    if (!selectedDate || currentStep < 4) return;

    let isMounted = true;
    const fetchAvailability = async () => {
      try {
        setLoadingSlots(true);
        setErrorMessage('');

        const params = {
          date: selectedDate,
          appointmentTypeId: selectedType?._id,
        };

        if (selectedDoctor && !isAnyDoctor) {
          params.doctorId = selectedDoctor._id;
        } else if (selectedDepartment) {
          params.departmentId = selectedDepartment._id;
        }

        const res = await schedulingService.getAvailability(params);
        if (isMounted && res.success && res.data?.dates?.length > 0) {
          const dateData = res.data.dates[0];

          if (selectedDoctor && !isAnyDoctor) {
            const docObj = dateData.doctors.find(
              (d) => String(d.doctorId) === String(selectedDoctor._id)
            );
            setSlots(docObj?.slots || []);
          } else {
            // Aggregate slots across all doctors in the department
            const allDepartmentSlots = [];
            dateData.doctors.forEach((d) => {
              if (d.slots) {
                d.slots.forEach((s) => {
                  allDepartmentSlots.push({
                    ...s,
                    doctorId: d.doctorId,
                    doctorName: d.doctorName,
                  });
                });
              }
            });
            // Sort by slot time
            allDepartmentSlots.sort((a, b) => a.slotTime.localeCompare(b.slotTime));
            setSlots(allDepartmentSlots);
          }
        } else {
          setSlots([]);
        }
      } catch (err) {
        if (isMounted) setErrorMessage(err.message || 'Could not load availability');
      } finally {
        if (isMounted) setLoadingSlots(false);
      }
    };

    fetchAvailability();
    return () => {
      isMounted = false;
    };
  }, [selectedDate, selectedDoctor, isAnyDoctor, selectedDepartment, selectedType, currentStep]);

  // Generate QR code upon successful booking
  useEffect(() => {
    if (bookedAppointment) {
      const payload = JSON.stringify({
        appointmentId: bookedAppointment._id,
        patientIdentifier: bookedAppointment.patientId?.patientIdentifier,
        date: bookedAppointment.appointmentDate,
        slotTime: bookedAppointment.slotTime,
      });

      QRCode.toDataURL(payload, { width: 220, margin: 2 })
        .then((url) => setQrCodeDataUrl(url))
        .catch((e) => console.error(e));
    }
  }, [bookedAppointment]);

  // Handlers for step progression
  const handleSelectDepartment = (dept) => {
    setSelectedDepartment(dept);
    setSelectedDoctor(null);
    setIsAnyDoctor(false);
    setSelectedSlot(null);
    setCurrentStep(2);
  };

  const handleSelectDoctor = (doc, any = false) => {
    setSelectedDoctor(doc);
    setIsAnyDoctor(any);
    setSelectedSlot(null);
    setCurrentStep(3);
  };

  const handleSelectDate = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setCurrentStep(4);
  };

  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot);
  };

  const handleFinalBooking = async () => {
    try {
      setSubmitting(true);
      setErrorMessage('');

      // Doctor ID: either specific doctor or the doctor associated with the picked slot
      const chosenDoctorId = selectedDoctor?._id || selectedSlot?.doctorId;

      const payload = {
        departmentId: selectedDepartment._id,
        doctorId: chosenDoctorId,
        appointmentDate: selectedDate,
        slotTime: selectedSlot.slotTime,
        typeId: selectedType?._id,
        type: selectedType?.name || 'consultation',
        reasonForVisit,
        source: 'portal',
        idempotencyKey: `book_${chosenDoctorId}_${selectedDate}_${selectedSlot.slotTime}_${Date.now()}`,
      };

      const res = await appointmentService.createAppointment(payload);
      if (res.success) {
        setBookedAppointment(res.data);
        setCurrentStep(6); // Step 6 = Confirmation
      }
    } catch (err) {
      setErrorMessage(err.message || 'Booking failed. This slot may have just been reserved.');
    } finally {
      setSubmitting(false);
    }
  };

  // STEP 6: Confirmation Screen
  if (currentStep === 6 && bookedAppointment) {
    const docName = bookedAppointment.doctorId?.userId?.name
      ? `Dr. ${bookedAppointment.doctorId.userId.name}`
      : 'Physician';
    const deptName = bookedAppointment.departmentId?.name || 'Clinic';
    const formattedDate = new Date(bookedAppointment.appointmentDate).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return (
      <div className="booking-wizard">
        <div className="booking-wizard__content" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: '#10B981',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem',
            }}
          >
            <CheckCircle2 size={36} />
          </div>

          <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', color: '#FFFFFF' }}>
            Appointment Confirmed!
          </h3>
          <p style={{ margin: '0 auto 2rem', color: '#94A3B8', maxWidth: '500px', fontSize: '0.9375rem' }}>
            Your consultation is booked. Please save your check-in pass or add the event to your digital calendar.
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.5rem',
              maxWidth: '480px',
              margin: '0 auto 2.5rem',
            }}
          >
            {qrCodeDataUrl && (
              <div
                style={{
                  padding: '16px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                }}
              >
                <img src={qrCodeDataUrl} alt="Check-in QR Code" width="200" height="200" />
                <span style={{ display: 'block', color: '#090B10', fontSize: '0.75rem', fontWeight: 600, marginTop: '6px' }}>
                  Scan at Clinic Kiosk / Reception
                </span>
              </div>
            )}

            <div className="booking-wizard__summary-box" style={{ width: '100%', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span className="text-muted" style={{ fontSize: '0.8125rem' }}>Appointment Ref</span>
                <span style={{ fontFamily: 'monospace', color: '#60A5FA', fontWeight: 700 }}>
                  {bookedAppointment._id}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span className="text-muted" style={{ fontSize: '0.8125rem' }}>Physician & Dept</span>
                <strong>{docName} ({deptName})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span className="text-muted" style={{ fontSize: '0.8125rem' }}>Scheduled Slot</span>
                <span style={{ color: '#10B981', fontWeight: 700 }}>
                  {formattedDate} at {bookedAppointment.slotTime}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted" style={{ fontSize: '0.8125rem' }}>Visit Reason</span>
                <span>{bookedAppointment.reasonForVisit || bookedAppointment.type}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Button
              variant="outline"
              icon={Download}
              onClick={() => appointmentService.downloadIcsFile(bookedAppointment)}
            >
              Add to Calendar (.ics)
            </Button>
            <Button variant="primary" onClick={() => navigate('/patient/appointments')}>
              View My Appointments
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-wizard">
      {/* Wizard Progress Header */}
      <div className="booking-wizard__progress">
        {STEPS.map((s, idx) => {
          const isActive = currentStep === s.id;
          const isCompleted = currentStep > s.id;
          return (
            <React.Fragment key={s.id}>
              <div
                className={`booking-wizard__progress-step ${
                  isActive ? 'booking-wizard__progress-step--active' : ''
                } ${isCompleted ? 'booking-wizard__progress-step--completed' : ''}`}
              >
                <span className="booking-wizard__progress-step-num">
                  {isCompleted ? '✓' : s.id}
                </span>
                <span>{s.title}</span>
              </div>
              {idx < STEPS.length - 1 && <div className="booking-wizard__progress-divider" />}
            </React.Fragment>
          );
        })}
      </div>

      {errorMessage && (
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
            fontSize: '0.875rem',
          }}
        >
          <AlertCircle size={20} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Wizard Step Content */}
      <div className="booking-wizard__content">
        {/* STEP 1: Department Selection */}
        {currentStep === 1 && (
          <div>
            <h3 className="booking-wizard__step-title">Select Clinical Department</h3>
            <p className="booking-wizard__step-subtitle">
              Choose the specialty relevant to your symptoms or healthcare needs.
            </p>
            <div className="booking-wizard__cards-grid">
              {departments.map((dept) => {
                const isSelected = selectedDepartment?._id === dept._id;
                return (
                  <button
                    key={dept._id}
                    type="button"
                    className={`booking-wizard__card-select ${
                      isSelected ? 'booking-wizard__card-select--active' : ''
                    }`}
                    onClick={() => handleSelectDepartment(dept)}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <FolderKanban size={20} color="#2563EB" />
                        <strong style={{ fontSize: '1rem', color: '#FFFFFF' }}>{dept.name}</strong>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.8125rem', color: '#94A3B8' }}>
                        {dept.description || 'Specialized outpatient medical evaluations'}
                      </p>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>
                      Code: {dept.code}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: Doctor Selection */}
        {currentStep === 2 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <button
                type="button"
                className="cf-btn-text"
                onClick={() => setCurrentStep(1)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}
              >
                ← Back
              </button>
            </div>
            <h3 className="booking-wizard__step-title">Select Physician</h3>
            <p className="booking-wizard__step-subtitle">
              Choose a specific doctor or select &quot;Any Available Doctor&quot; for the earliest slot.
            </p>

            <div className="booking-wizard__cards-grid">
              {/* Option: Any Available */}
              <button
                type="button"
                className={`booking-wizard__card-select ${
                  isAnyDoctor ? 'booking-wizard__card-select--active' : ''
                }`}
                onClick={() => handleSelectDoctor(null, true)}
                style={{ borderStyle: 'dashed' }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Sparkles size={20} color="#10B981" />
                    <strong style={{ fontSize: '1rem', color: '#FFFFFF' }}>Any Available Doctor</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: '#94A3B8' }}>
                    Find the fastest opening across all practicing doctors in {selectedDepartment?.name}.
                  </p>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>
                  Recommended for earliest booking
                </span>
              </button>

              {/* Specific Doctors */}
              {doctors.map((doc) => {
                const isSelected = selectedDoctor?._id === doc._id && !isAnyDoctor;
                return (
                  <button
                    key={doc._id}
                    type="button"
                    className={`booking-wizard__card-select ${
                      isSelected ? 'booking-wizard__card-select--active' : ''
                    }`}
                    onClick={() => handleSelectDoctor(doc, false)}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <Stethoscope size={20} color="#2563EB" />
                        <strong style={{ fontSize: '1rem', color: '#FFFFFF' }}>{doc.name}</strong>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.8125rem', color: '#94A3B8' }}>
                        {doc.specialty || 'General Practitioner'}
                      </p>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#60A5FA' }}>
                      {doc.roomNumber || 'Consultation Room'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: Date Selection */}
        {currentStep === 3 && (
          <div>
            <div style={{ marginBottom: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}
              >
                ← Back
              </button>
            </div>
            <h3 className="booking-wizard__step-title">Choose Appointment Date</h3>
            <p className="booking-wizard__step-subtitle">
              Days with no available slots or registered doctor leave are automatically disabled.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
              <AppointmentCalendar
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
                doctorId={isAnyDoctor ? null : selectedDoctor?._id}
                departmentId={selectedDepartment?._id}
              />
            </div>
          </div>
        )}

        {/* STEP 4: Slot Selection */}
        {currentStep === 4 && (
          <div>
            <div style={{ marginBottom: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}
              >
                ← Back to Date Selection
              </button>
            </div>
            <h3 className="booking-wizard__step-title">Select Time Slot</h3>
            <p className="booking-wizard__step-subtitle">
              Slots for <strong>{selectedDate}</strong> with{' '}
              {isAnyDoctor ? 'Any Available Doctor' : selectedDoctor?.name}. Live slot availability is updated in real time.
            </p>

            <SlotPicker
              slots={slots}
              selectedSlot={selectedSlot}
              onSelectSlot={handleSelectSlot}
              loading={loadingSlots}
              date={selectedDate}
              doctorId={isAnyDoctor ? null : selectedDoctor?._id}
            />

            <div className="booking-wizard__footer">
              <Button variant="outline" onClick={() => setCurrentStep(3)}>
                Change Date
              </Button>
              <Button
                variant="primary"
                disabled={!selectedSlot}
                onClick={() => setCurrentStep(5)}
                icon={ChevronRight}
              >
                Continue to Details
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: Reason & Confirm Details */}
        {currentStep === 5 && (
          <div>
            <div style={{ marginBottom: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}
              >
                ← Back to Slot Picker
              </button>
            </div>
            <h3 className="booking-wizard__step-title">Appointment Details & Confirmation</h3>
            <p className="booking-wizard__step-subtitle">
              Review your consultation summary and enter any symptoms or notes for the doctor.
            </p>

            {/* Summary Box */}
            <div className="booking-wizard__summary-box">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <span className="text-muted" style={{ fontSize: '0.75rem', display: 'block' }}>DEPARTMENT</span>
                  <strong>{selectedDepartment?.name}</strong>
                </div>
                <div>
                  <span className="text-muted" style={{ fontSize: '0.75rem', display: 'block' }}>PHYSICIAN</span>
                  <strong>{isAnyDoctor ? 'Any Available Doctor' : selectedDoctor?.name}</strong>
                </div>
                <div>
                  <span className="text-muted" style={{ fontSize: '0.75rem', display: 'block' }}>DATE & TIME</span>
                  <strong style={{ color: '#10B981' }}>{selectedDate} at {selectedSlot?.slotTime}</strong>
                </div>
              </div>
            </div>

            {/* Appointment Type Picker */}
            {appointmentTypes.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#94A3B8', marginBottom: '0.5rem' }}>
                  APPOINTMENT TYPE
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  {appointmentTypes.map((t) => {
                    const isSelected = selectedType?._id === t._id;
                    return (
                      <button
                        key={t._id}
                        type="button"
                        onClick={() => setSelectedType(t)}
                        style={{
                          padding: '0.75rem 1rem',
                          borderRadius: '10px',
                          backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.15)' : '#121520',
                          border: `1px solid ${isSelected ? '#2563EB' : '#1E2538'}`,
                          color: '#FFFFFF',
                          textAlign: 'left',
                          cursor: 'pointer',
                        }}
                      >
                        <strong style={{ display: 'block', fontSize: '0.875rem' }}>{t.name}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{t.durationMinutes} mins</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Chief Complaint / Notes */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#94A3B8', marginBottom: '0.5rem' }}>
                REASON FOR VISIT / CHIEF COMPLAINT (OPTIONAL)
              </label>
              <textarea
                className="cf-input"
                rows={3}
                placeholder="Describe your symptoms or reason for scheduling this visit..."
                value={reasonForVisit}
                onChange={(e) => setReasonForVisit(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#121520',
                  border: '1px solid #1E2538',
                  borderRadius: '10px',
                  color: '#FFFFFF',
                  fontSize: '0.875rem',
                  resize: 'vertical',
                }}
              />
            </div>

            <div className="booking-wizard__footer">
              <Button variant="outline" onClick={() => setCurrentStep(4)}>
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handleFinalBooking}
                disabled={submitting}
                icon={CheckCircle2}
              >
                {submitting ? 'Confirming Booking...' : 'Confirm Appointment'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
