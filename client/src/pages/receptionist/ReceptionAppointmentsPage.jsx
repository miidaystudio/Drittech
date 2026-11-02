import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Users,
  Search,
  Plus,
  UserPlus,
  UserCheck,
  RotateCcw,
  XCircle,
  AlertCircle,
  CheckCircle2,
  Filter,
  RefreshCw,
  Stethoscope,
  DoorOpen,
  Eye,
  QrCode,
  Download,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { AppointmentCalendar } from '../../components/scheduling/AppointmentCalendar';
import { SlotPicker } from '../../components/scheduling/SlotPicker';
import { RescheduleModal } from '../../components/scheduling/RescheduleModal';
import { QrCodeModal } from '../../components/scheduling/QrCodeModal';
import { appointmentService } from '../../services/appointmentService';
import { schedulingService } from '../../services/schedulingService';
import { patientService } from '../../services/patientService';
import apiClient from '../../services/apiClient';
import { useSocket } from '../../context/SocketContext';
import './Reception.scss';

export const ReceptionAppointmentsPage = () => {
  const { socket } = useSocket();

  // Filters & View state
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' | 'list'
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Data
  const [appointments, setAppointments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointmentTypes, setAppointmentTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Status & Notifications
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Modals
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [appointmentForReschedule, setAppointmentForReschedule] = useState(null);
  const [appointmentForQr, setAppointmentForQr] = useState(null);

  // Book on Behalf Form State
  const [patientSearch, setPatientSearch] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isRegisteringNew, setIsRegisteringNew] = useState(false);
  const [newPatient, setNewPatient] = useState({
    fullName: '',
    phone: '',
    email: '',
    gender: 'unspecified',
    age: '',
    bloodGroup: 'Unknown',
  });

  const [bookDoctorId, setBookDoctorId] = useState('');
  const [bookDate, setBookDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [bookSlot, setBookSlot] = useState(null);
  const [bookSlots, setBookSlots] = useState([]);
  const [loadingBookSlots, setLoadingBookSlots] = useState(false);
  const [bookTypeId, setBookTypeId] = useState('');
  const [bookReason, setBookReason] = useState('');
  const [submittingBooking, setSubmittingBooking] = useState(false);

  // 1. Initial metadata loading
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [deptRes, staffRes, typesRes] = await Promise.all([
          apiClient.get('/admin/departments'),
          apiClient.get('/admin/staff'),
          schedulingService.getAppointmentTypes(),
        ]);

        if (deptRes.success) setDepartments(deptRes.data);
        if (staffRes.success) {
          setDoctors(staffRes.data.filter((s) => s.role === 'doctor'));
        }
        if (typesRes.success) setAppointmentTypes(typesRes.data);
      } catch (err) {
        console.error('Metadata fetch error:', err);
      }
    };
    fetchMetadata();
  }, []);

  // 2. Fetch appointments for selected filters
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const params = {
        date: selectedDate,
      };
      if (selectedDepartmentId) params.departmentId = selectedDepartmentId;
      if (selectedDoctorId) params.doctorId = selectedDoctorId;
      if (selectedStatus) params.status = selectedStatus;

      const res = await appointmentService.getAppointments(params);
      if (res.success) {
        setAppointments(res.data);
      }
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate, selectedDepartmentId, selectedDoctorId, selectedStatus]);

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
  }, [socket, selectedDate, selectedDepartmentId, selectedDoctorId, selectedStatus]);

  // 3. Search patients as user types
  useEffect(() => {
    if (patientSearch.trim().length < 2) {
      setPatientSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await patientService.getPatients({ search: patientSearch.trim(), limit: 5 });
        if (res.success) {
          setPatientSearchResults(res.data);
        }
      } catch (e) {}
    }, 250);

    return () => clearTimeout(timer);
  }, [patientSearch]);

  // 4. Fetch available slots for Book on Behalf modal
  useEffect(() => {
    if (!isBookModalOpen || !bookDoctorId || !bookDate) return;

    let isMounted = true;
    const fetchSlots = async () => {
      try {
        setLoadingBookSlots(true);
        const res = await schedulingService.getAvailability({
          doctorId: bookDoctorId,
          date: bookDate,
          appointmentTypeId: bookTypeId || null,
        });
        if (isMounted && res.success && res.data?.dates?.length > 0) {
          const docData = res.data.dates[0].doctors.find(
            (d) => String(d.doctorId) === String(bookDoctorId)
          );
          setBookSlots(docData?.slots || []);
        } else {
          setBookSlots([]);
        }
      } catch (err) {
        if (isMounted) setBookSlots([]);
      } finally {
        if (isMounted) setLoadingBookSlots(false);
      }
    };

    fetchSlots();
    return () => {
      isMounted = false;
    };
  }, [isBookModalOpen, bookDoctorId, bookDate, bookTypeId]);

  // 1-Click Check-in Action
  const handleCheckIn = async (appointmentId) => {
    try {
      const res = await appointmentService.checkInAppointment(appointmentId);
      if (res.success) {
        const tokenNum = res.data.queueEntry?.tokenNumber || 'Token';
        setActionSuccess(`Patient checked in! Queue token ${tokenNum} dispatched.`);
        fetchAppointments();
        setTimeout(() => setActionSuccess(''), 5000);
      }
    } catch (err) {
      setActionError(err.message || 'Check-in failed');
      setTimeout(() => setActionError(''), 5000);
    }
  };

  // Mark No-Show Action
  const handleMarkNoShow = async (appointmentId) => {
    try {
      const res = await appointmentService.markNoShow(appointmentId, {
        reason: 'Patient did not arrive at reception desk',
      });
      if (res.success) {
        setActionSuccess('Appointment marked as No-Show');
        fetchAppointments();
        setTimeout(() => setActionSuccess(''), 4000);
      }
    } catch (err) {
      setActionError(err.message || 'Failed to mark no-show');
    }
  };

  // Handle Book on Behalf Submission
  const handleCreateBookingOnBehalf = async () => {
    if (!bookDoctorId || !bookDate || !bookSlot) {
      setActionError('Please select a doctor, date, and time slot');
      return;
    }

    let patientId = selectedPatient?._id;

    try {
      setSubmittingBooking(true);
      setActionError('');

      // If registering a new patient first
      if (isRegisteringNew) {
        if (!newPatient.fullName || !newPatient.phone) {
          setActionError('Patient full name and phone number are required');
          setSubmittingBooking(false);
          return;
        }

        const patientRes = await patientService.registerPatient({
          ...newPatient,
          age: newPatient.age ? parseInt(newPatient.age, 10) : undefined,
        });

        if (patientRes.success) {
          patientId = patientRes.data.patient._id;
        } else {
          throw new Error('Failed to register patient');
        }
      }

      if (!patientId) {
        setActionError('Please select an existing patient or register a new one');
        setSubmittingBooking(false);
        return;
      }

      const res = await appointmentService.createAppointment({
        patientId,
        doctorId: bookDoctorId,
        appointmentDate: bookDate,
        slotTime: bookSlot.slotTime,
        typeId: bookTypeId || null,
        reasonForVisit: bookReason,
        source: 'reception',
        idempotencyKey: `rec_book_${patientId}_${bookDoctorId}_${bookDate}_${bookSlot.slotTime}_${Date.now()}`,
      });

      if (res.success) {
        setActionSuccess(`Appointment booked successfully for ${res.data.patientId?.fullName}!`);
        setIsBookModalOpen(false);
        // Reset form
        setSelectedPatient(null);
        setIsRegisteringNew(false);
        setPatientSearch('');
        setBookSlot(null);
        setBookReason('');
        fetchAppointments();
        setTimeout(() => setActionSuccess(''), 5000);
      }
    } catch (err) {
      setActionError(err.message || 'Booking failed');
    } finally {
      setSubmittingBooking(false);
    }
  };

  // Group appointments by doctor for the Day / Calendar grouped view
  const appointmentsByDoctor = {};
  doctors.forEach((doc) => {
    appointmentsByDoctor[doc._id] = {
      doctor: doc,
      appointments: [],
    };
  });

  appointments.forEach((apt) => {
    const docId = apt.doctorId?._id;
    if (appointmentsByDoctor[docId]) {
      appointmentsByDoctor[docId].appointments.push(apt);
    } else {
      appointmentsByDoctor[docId] = {
        doctor: apt.doctorId || { name: 'Doctor' },
        appointments: [apt],
      };
    }
  });

  return (
    <div className="reception-page" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.375rem', color: '#FFFFFF' }}>Reception Appointment Desk</h3>
          <p className="text-muted" style={{ margin: '4px 0 0', fontSize: '0.875rem' }}>
            Day calendar grouped by doctor & room, patient intake, 1-click check-in, and rescheduling.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button variant="outline" icon={RefreshCw} onClick={fetchAppointments}>
            Refresh
          </Button>
          <Button
            variant="primary"
            icon={UserPlus}
            onClick={() => {
              setIsBookModalOpen(true);
              if (doctors.length > 0 && !bookDoctorId) {
                setBookDoctorId(doctors[0]._id);
              }
            }}
          >
            Book on Behalf
          </Button>
        </div>
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
          <strong>{actionSuccess}</strong>
        </div>
      )}

      {actionError && (
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
          <span>{actionError}</span>
        </div>
      )}

      {/* Control Bar: Date Selector, Department & Doctor Filters, View Toggle */}
      <div className="card" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Date Input */}
            <div>
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

            {/* Department */}
            <select
              value={selectedDepartmentId}
              onChange={(e) => setSelectedDepartmentId(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                backgroundColor: '#171B29',
                border: '1px solid #1E2538',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '0.875rem',
              }}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Doctor */}
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                backgroundColor: '#171B29',
                border: '1px solid #1E2538',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '0.875rem',
              }}
            >
              <option value="">All Doctors</option>
              {doctors.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                backgroundColor: '#171B29',
                border: '1px solid #1E2538',
                borderRadius: '8px',
                color: '#FFFFFF',
                fontSize: '0.875rem',
              }}
            >
              <option value="">All Statuses</option>
              <option value="confirmed">Confirmed / Scheduled</option>
              <option value="checked_in">Checked In</option>
              <option value="in_consultation">In Consultation</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No Show</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div style={{ display: 'flex', gap: '0.375rem', backgroundColor: '#171B29', padding: '3px', borderRadius: '8px' }}>
            <button
              type="button"
              onClick={() => setViewMode('grouped')}
              style={{
                padding: '0.375rem 0.75rem',
                borderRadius: '6px',
                background: viewMode === 'grouped' ? '#2563EB' : 'transparent',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Doctor Columns
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              style={{
                padding: '0.375rem 0.75rem',
                borderRadius: '6px',
                background: viewMode === 'list' ? '#2563EB' : 'transparent',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Table List ({appointments.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Appointments Display */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
          <div className="cf-skeleton" style={{ height: '350px', borderRadius: '16px' }} />
          <div className="cf-skeleton" style={{ height: '350px', borderRadius: '16px' }} />
        </div>
      ) : viewMode === 'grouped' ? (
        /* Doctor Columns Grouped View */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
          {Object.values(appointmentsByDoctor).map(({ doctor, appointments: docApts }) => (
            <div key={doctor._id || doctor.name} className="card" style={{ padding: '1.25rem' }}>
              {/* Doctor Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '0.875rem',
                  borderBottom: '1px solid #1E2538',
                  marginBottom: '1rem',
                }}
              >
                <div>
                  <strong style={{ fontSize: '1rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <Stethoscope size={18} color="#2563EB" />
                    {doctor.name}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                    {doctor.specialty || 'General'} • {doctor.roomNumber || 'Room 101'}
                  </span>
                </div>
                <span
                  style={{
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(37, 99, 235, 0.15)',
                    color: '#60A5FA',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  {docApts.length} Slots
                </span>
              </div>

              {/* Slot Cards List */}
              {docApts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748B', fontSize: '0.8125rem' }}>
                  No appointments booked for this physician on {selectedDate}.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {docApts.map((apt) => (
                    <div
                      key={apt._id}
                      style={{
                        padding: '0.875rem',
                        backgroundColor: '#171B29',
                        border: '1px solid #1E2538',
                        borderRadius: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ color: '#60A5FA', fontSize: '0.9375rem' }}>
                          {apt.slotTime}
                        </strong>
                        <Badge status={apt.status} />
                      </div>

                      <div>
                        <strong style={{ fontSize: '0.875rem', color: '#FFFFFF', display: 'block' }}>
                          {apt.patientId?.fullName}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                          ID: {apt.patientId?.patientIdentifier} • {apt.patientId?.phone}
                        </span>
                      </div>

                      {apt.reasonForVisit && (
                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>
                          {apt.reasonForVisit}
                        </p>
                      )}

                      {/* Action buttons */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginTop: '0.25rem',
                          paddingTop: '0.5rem',
                          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                          flexWrap: 'wrap',
                        }}
                      >
                        {['confirmed', 'scheduled'].includes(apt.status) && (
                          <Button
                            variant="primary"
                            size="sm"
                            icon={UserCheck}
                            onClick={() => handleCheckIn(apt._id)}
                          >
                            Check In
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          icon={QrCode}
                          onClick={() => setAppointmentForQr(apt)}
                          title="Show QR Check-in Pass"
                        />

                        {['confirmed', 'scheduled'].includes(apt.status) && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              icon={RotateCcw}
                              onClick={() => setAppointmentForReschedule(apt)}
                              title="Reschedule"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkNoShow(apt._id)}
                              style={{ color: '#F87171' }}
                              title="Mark No-Show"
                            >
                              No-Show
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Table List View */
        <div className="card">
          <div className="table-responsive">
            <table className="cf-table">
              <thead>
                <tr>
                  <th>Time Slot</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Department</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length > 0 ? (
                  appointments.map((apt) => (
                    <tr key={apt._id}>
                      <td>
                        <strong>{apt.slotTime}</strong>
                        <span className="text-muted" style={{ display: 'block', fontSize: '0.75rem' }}>
                          {new Date(apt.appointmentDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td>
                        <div className="patient-cell">
                          <strong>{apt.patientId?.fullName}</strong>
                          <span>{apt.patientId?.patientIdentifier} • {apt.patientId?.phone}</span>
                        </div>
                      </td>
                      <td>Dr. {apt.doctorId?.userId?.name || 'Physician'}</td>
                      <td>{apt.departmentId?.name || 'General'}</td>
                      <td>{apt.reasonForVisit || apt.type}</td>
                      <td>
                        <Badge status={apt.status} />
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                          {['confirmed', 'scheduled'].includes(apt.status) && (
                            <Button
                              variant="primary"
                              size="sm"
                              icon={UserCheck}
                              onClick={() => handleCheckIn(apt._id)}
                            >
                              Check In
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            icon={QrCode}
                            onClick={() => setAppointmentForQr(apt)}
                          />
                          {['confirmed', 'scheduled'].includes(apt.status) && (
                            <Button
                              variant="outline"
                              size="sm"
                              icon={RotateCcw}
                              onClick={() => setAppointmentForReschedule(apt)}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted">
                      No appointments matching filter criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Book on Behalf of Patient */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title="Book Appointment on Behalf of Patient"
        subtitle="Search existing clinic patient directory or register a new walk-in"
        maxWidth="760px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <Button variant="outline" onClick={() => setIsBookModalOpen(false)} disabled={submittingBooking}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateBookingOnBehalf}
              disabled={submittingBooking || !bookSlot}
            >
              {submittingBooking ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Patient Selection Tabs */}
          <div>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <Button
                variant={!isRegisteringNew ? 'primary' : 'outline'}
                size="sm"
                icon={Search}
                onClick={() => setIsRegisteringNew(false)}
              >
                Search Existing Patient
              </Button>
              <Button
                variant={isRegisteringNew ? 'primary' : 'outline'}
                size="sm"
                icon={UserPlus}
                onClick={() => {
                  setIsRegisteringNew(true);
                  setSelectedPatient(null);
                }}
              >
                Register New Patient
              </Button>
            </div>

            {!isRegisteringNew ? (
              /* Search Existing */
              <div>
                <input
                  type="text"
                  placeholder="Type patient name, phone number, or ID..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    backgroundColor: '#171B29',
                    border: '1px solid #1E2538',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontSize: '0.875rem',
                  }}
                />

                {patientSearchResults.length > 0 && (
                  <div
                    style={{
                      marginTop: '0.5rem',
                      border: '1px solid #1E2538',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      backgroundColor: '#121520',
                    }}
                  >
                    {patientSearchResults.map((p) => (
                      <div
                        key={p._id}
                        onClick={() => {
                          setSelectedPatient(p);
                          setPatientSearchResults([]);
                          setPatientSearch(p.fullName);
                        }}
                        style={{
                          padding: '0.625rem 0.875rem',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          borderBottom: '1px solid #1E2538',
                        }}
                      >
                        <strong>{p.fullName}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                          {p.patientIdentifier} • {p.phone}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {selectedPatient && (
                  <div
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.625rem 0.875rem',
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '8px',
                      color: '#10B981',
                      fontSize: '0.8125rem',
                    }}
                  >
                    Selected: <strong>{selectedPatient.fullName}</strong> ({selectedPatient.patientIdentifier})
                  </div>
                )}
              </div>
            ) : (
              /* Register New Form */
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={newPatient.fullName}
                  onChange={(e) => setNewPatient({ ...newPatient, fullName: e.target.value })}
                  style={{ padding: '0.5rem 0.75rem', backgroundColor: '#171B29', border: '1px solid #1E2538', borderRadius: '8px', color: '#fff' }}
                />
                <input
                  type="text"
                  placeholder="Phone Number *"
                  value={newPatient.phone}
                  onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                  style={{ padding: '0.5rem 0.75rem', backgroundColor: '#171B29', border: '1px solid #1E2538', borderRadius: '8px', color: '#fff' }}
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={newPatient.email}
                  onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                  style={{ padding: '0.5rem 0.75rem', backgroundColor: '#171B29', border: '1px solid #1E2538', borderRadius: '8px', color: '#fff' }}
                />
                <input
                  type="number"
                  placeholder="Age"
                  value={newPatient.age}
                  onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                  style={{ padding: '0.5rem 0.75rem', backgroundColor: '#171B29', border: '1px solid #1E2538', borderRadius: '8px', color: '#fff' }}
                />
              </div>
            )}
          </div>

          {/* Doctor & Date Selection */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '0.25rem' }}>
                PHYSICIAN
              </label>
              <select
                value={bookDoctorId}
                onChange={(e) => setBookDoctorId(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.75rem', backgroundColor: '#171B29', border: '1px solid #1E2538', borderRadius: '8px', color: '#fff' }}
              >
                {doctors.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.specialty || 'General'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '0.25rem' }}>
                APPOINTMENT DATE
              </label>
              <input
                type="date"
                value={bookDate}
                onChange={(e) => setBookDate(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.75rem', backgroundColor: '#171B29', border: '1px solid #1E2538', borderRadius: '8px', color: '#fff' }}
              />
            </div>
          </div>

          {/* Slots Grid */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '0.375rem' }}>
              AVAILABLE LIVE SLOTS ({bookDate})
            </label>
            <SlotPicker
              slots={bookSlots}
              selectedSlot={bookSlot}
              onSelectSlot={setBookSlot}
              loading={loadingBookSlots}
              date={bookDate}
              doctorId={bookDoctorId}
            />
          </div>

          {/* Reason / Notes */}
          <div>
            <input
              type="text"
              placeholder="Visit Reason / Symptoms..."
              value={bookReason}
              onChange={(e) => setBookReason(e.target.value)}
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

      {/* QR Code Modal */}
      <QrCodeModal
        isOpen={!!appointmentForQr}
        onClose={() => setAppointmentForQr(null)}
        appointment={appointmentForQr}
      />

      {/* Reschedule Modal */}
      <RescheduleModal
        isOpen={!!appointmentForReschedule}
        onClose={() => setAppointmentForReschedule(null)}
        appointment={appointmentForReschedule}
        onRescheduled={() => {
          setActionSuccess('Appointment rescheduled successfully');
          fetchAppointments();
          setTimeout(() => setActionSuccess(''), 4000);
        }}
      />
    </div>
  );
};
