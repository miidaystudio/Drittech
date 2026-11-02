import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Settings,
  Shield,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  Building,
  Save,
  Tag,
  Ban,
  Sliders,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { schedulingService } from '../../services/schedulingService';
import apiClient from '../../services/apiClient';
import './Admin.scss';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const AdminSchedulingPage = () => {
  const [activeTab, setActiveTab] = useState('shifts'); // 'shifts' | 'policy' | 'types' | 'exceptions'
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });

  // Doctor Schedule state
  const [schedule, setSchedule] = useState({
    slotDuration: 15,
    bufferMinutes: 5,
    maxPerDay: 25,
    weeklyHours: [],
  });

  // Policy state
  const [policy, setPolicy] = useState({
    advanceBookingDays: 30,
    minLeadTimeHours: 2,
    cancellationCutoffHours: 4,
    autoNoShowGraceMinutes: 30,
    overbookingLimit: 0,
    timezone: 'America/New_York',
  });

  // Appointment Types state
  const [types, setTypes] = useState([]);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [typeForm, setTypeForm] = useState({ name: '', durationMinutes: 15, color: '#2563EB', description: '' });

  // Exceptions state
  const [exceptions, setExceptions] = useState([]);
  const [isExceptionModalOpen, setIsExceptionModalOpen] = useState(false);
  const [exceptionForm, setExceptionForm] = useState({
    doctorId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    type: 'holiday',
    reason: '',
  });

  // 1. Initial Load: Doctors, Policy, Types, Exceptions
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        setLoading(true);
        const [staffRes, policyRes, typesRes, excRes] = await Promise.all([
          apiClient.get('/admin/staff'),
          schedulingService.getPolicy(),
          schedulingService.getAppointmentTypes({ all: true }),
          schedulingService.getExceptions(),
        ]);

        if (staffRes.success) {
          const docList = staffRes.data.filter((s) => s.role === 'doctor');
          setDoctors(docList);
          if (docList.length > 0) setSelectedDoctorId(docList[0]._id);
        }
        if (policyRes.success) setPolicy(policyRes.data);
        if (typesRes.success) setTypes(typesRes.data);
        if (excRes.success) setExceptions(excRes.data);
      } catch (err) {
        console.error('Failed to load scheduling settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
  }, []);

  // 2. Fetch doctor schedule when selectedDoctorId changes
  useEffect(() => {
    if (!selectedDoctorId) return;
    const fetchDocSchedule = async () => {
      try {
        const res = await schedulingService.getDoctorSchedule(selectedDoctorId);
        if (res.success && res.data) {
          setSchedule(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch doctor schedule:', err);
      }
    };
    fetchDocSchedule();
  }, [selectedDoctorId]);

  const showFeedback = (type, text) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg({ type: '', text: '' }), 4000);
  };

  // Save Doctor Schedule
  const handleSaveSchedule = async () => {
    try {
      setSaving(true);
      const res = await schedulingService.saveDoctorSchedule({
        doctorId: selectedDoctorId,
        weeklyHours: schedule.weeklyHours,
        slotDuration: schedule.slotDuration,
        bufferMinutes: schedule.bufferMinutes,
        maxPerDay: schedule.maxPerDay,
      });
      if (res.success) {
        showFeedback('success', 'Doctor weekly shifts and slot rules updated successfully.');
      }
    } catch (err) {
      showFeedback('error', err.message || 'Failed to save doctor schedule');
    } finally {
      setSaving(false);
    }
  };

  // Save Booking Policy
  const handleSavePolicy = async () => {
    try {
      setSaving(true);
      const res = await schedulingService.updatePolicy(policy);
      if (res.success) {
        showFeedback('success', 'Clinic booking policies updated successfully.');
      }
    } catch (err) {
      showFeedback('error', err.message || 'Failed to update policy');
    } finally {
      setSaving(false);
    }
  };

  // Add Appointment Type
  const handleCreateType = async () => {
    if (!typeForm.name) return;
    try {
      const res = await schedulingService.createAppointmentType(typeForm);
      if (res.success) {
        setTypes([...types, res.data]);
        setIsTypeModalOpen(false);
        setTypeForm({ name: '', durationMinutes: 15, color: '#2563EB', description: '' });
        showFeedback('success', 'New appointment type created');
      }
    } catch (err) {
      showFeedback('error', err.message || 'Failed to create type');
    }
  };

  // Add Exception
  const handleCreateException = async () => {
    if (!exceptionForm.reason) return;
    try {
      const res = await schedulingService.createException({
        ...exceptionForm,
        doctorId: exceptionForm.doctorId || null,
      });
      if (res.success) {
        setExceptions([...exceptions, res.data]);
        setIsExceptionModalOpen(false);
        setExceptionForm({ doctorId: '', startDate: '', endDate: '', type: 'holiday', reason: '' });
        showFeedback('success', 'Holiday/Exception added and slots blocked');
      }
    } catch (err) {
      showFeedback('error', err.message || 'Failed to add exception');
    }
  };

  // Delete Exception
  const handleDeleteException = async (id) => {
    try {
      const res = await schedulingService.deleteException(id);
      if (res.success) {
        setExceptions(exceptions.filter((e) => e._id !== id));
        showFeedback('success', 'Exception removed');
      }
    } catch (err) {
      showFeedback('error', err.message || 'Failed to delete exception');
    }
  };

  // Helpers for editing day shifts & breaks
  const toggleDayActive = (dayName) => {
    const updatedWeekly = [...schedule.weeklyHours];
    let dayObj = updatedWeekly.find((d) => d.day === dayName);
    if (!dayObj) {
      dayObj = { day: dayName, isActive: true, shifts: [{ start: '09:00', end: '17:00' }], breaks: [] };
      updatedWeekly.push(dayObj);
    } else {
      dayObj.isActive = !dayObj.isActive;
    }
    setSchedule({ ...schedule, weeklyHours: updatedWeekly });
  };

  const updateShift = (dayName, shiftIndex, field, value) => {
    const updatedWeekly = schedule.weeklyHours.map((d) => {
      if (d.day === dayName) {
        const shifts = [...(d.shifts || [])];
        if (shifts[shiftIndex]) {
          shifts[shiftIndex][field] = value;
        }
        return { ...d, shifts };
      }
      return d;
    });
    setSchedule({ ...schedule, weeklyHours: updatedWeekly });
  };

  const addShift = (dayName) => {
    const updatedWeekly = schedule.weeklyHours.map((d) => {
      if (d.day === dayName) {
        return {
          ...d,
          shifts: [...(d.shifts || []), { start: '14:00', end: '17:00' }],
        };
      }
      return d;
    });
    setSchedule({ ...schedule, weeklyHours: updatedWeekly });
  };

  const removeShift = (dayName, shiftIndex) => {
    const updatedWeekly = schedule.weeklyHours.map((d) => {
      if (d.day === dayName) {
        return {
          ...d,
          shifts: d.shifts.filter((_, idx) => idx !== shiftIndex),
        };
      }
      return d;
    });
    setSchedule({ ...schedule, weeklyHours: updatedWeekly });
  };

  const addBreak = (dayName) => {
    const updatedWeekly = schedule.weeklyHours.map((d) => {
      if (d.day === dayName) {
        return {
          ...d,
          breaks: [...(d.breaks || []), { start: '13:00', end: '14:00', label: 'Lunch' }],
        };
      }
      return d;
    });
    setSchedule({ ...schedule, weeklyHours: updatedWeekly });
  };

  const updateBreak = (dayName, breakIndex, field, value) => {
    const updatedWeekly = schedule.weeklyHours.map((d) => {
      if (d.day === dayName) {
        const breaks = [...(d.breaks || [])];
        if (breaks[breakIndex]) {
          breaks[breakIndex][field] = value;
        }
        return { ...d, breaks };
      }
      return d;
    });
    setSchedule({ ...schedule, weeklyHours: updatedWeekly });
  };

  const removeBreak = (dayName, breakIndex) => {
    const updatedWeekly = schedule.weeklyHours.map((d) => {
      if (d.day === dayName) {
        return {
          ...d,
          breaks: d.breaks.filter((_, idx) => idx !== breakIndex),
        };
      }
      return d;
    });
    setSchedule({ ...schedule, weeklyHours: updatedWeekly });
  };

  return (
    <div className="admin-page" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.375rem', color: '#FFFFFF' }}>Clinical Scheduling Administration</h3>
          <p className="text-muted" style={{ margin: '4px 0 0', fontSize: '0.875rem' }}>
            Configure doctor working hours, multiple shifts & breaks, clinic holidays, booking policies, and visit types.
          </p>
        </div>
      </div>

      {feedbackMsg.text && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: feedbackMsg.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${feedbackMsg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            borderRadius: '12px',
            color: feedbackMsg.type === 'success' ? '#10B981' : '#F87171',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          {feedbackMsg.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Tabs Bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1E2538', gap: '1.5rem', overflowX: 'auto' }}>
        {[
          { id: 'shifts', label: 'Doctor Working Hours & Shifts', icon: Stethoscope },
          { id: 'exceptions', label: 'Holidays & Leave Exceptions', icon: Ban },
          { id: 'policy', label: 'Booking Policies & Cutoffs', icon: Sliders },
          { id: 'types', label: 'Appointment Types & Durations', icon: Tag },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2px solid #2563EB' : '2px solid transparent',
                color: isActive ? '#FFFFFF' : '#94A3B8',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.9375rem',
                padding: '0.75rem 0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                whiteSpace: 'nowrap',
              }}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Doctor Working Hours & Shifts */}
      {activeTab === 'shifts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Doctor Selector + Slot rules */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', alignItems: 'center' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '0.375rem' }}>
                  SELECT PHYSICIAN
                </label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  style={{ width: '100%', padding: '0.625rem', backgroundColor: '#171B29', border: '1px solid #1E2538', borderRadius: '8px', color: '#fff' }}
                >
                  {doctors.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.specialty || 'General'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '0.375rem' }}>
                  SLOT DURATION (MINUTES)
                </label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={schedule.slotDuration || 15}
                  onChange={(e) => setSchedule({ ...schedule, slotDuration: parseInt(e.target.value, 10) || 15 })}
                  style={{ width: '100%', padding: '0.625rem', backgroundColor: '#171B29', border: '1px solid #1E2538', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '0.375rem' }}>
                  BUFFER TIME BETWEEN SLOTS (MINS)
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={schedule.bufferMinutes || 5}
                  onChange={(e) => setSchedule({ ...schedule, bufferMinutes: parseInt(e.target.value, 10) || 0 })}
                  style={{ width: '100%', padding: '0.625rem', backgroundColor: '#171B29', border: '1px solid #1E2538', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '0.375rem' }}>
                  MAX DAILY APPOINTMENTS
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={schedule.maxPerDay || 25}
                  onChange={(e) => setSchedule({ ...schedule, maxPerDay: parseInt(e.target.value, 10) || 25 })}
                  style={{ width: '100%', padding: '0.625rem', backgroundColor: '#171B29', border: '1px solid #1E2538', borderRadius: '8px', color: '#fff' }}
                />
              </div>
            </div>
          </div>

          {/* Days of week schedule cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {DAYS.map((dayName) => {
              const dayConfig = schedule.weeklyHours.find((w) => w.day === dayName) || {
                day: dayName,
                isActive: false,
                shifts: [],
                breaks: [],
              };

              return (
                <div
                  key={dayName}
                  className="card"
                  style={{
                    padding: '1.25rem',
                    backgroundColor: dayConfig.isActive ? '#121520' : 'rgba(18, 21, 32, 0.45)',
                    border: `1px solid ${dayConfig.isActive ? '#1E2538' : '#141824'}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <input
                        type="checkbox"
                        checked={dayConfig.isActive}
                        onChange={() => toggleDayActive(dayName)}
                        id={`check-${dayName}`}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <label
                        htmlFor={`check-${dayName}`}
                        style={{ fontSize: '1.0625rem', fontWeight: 700, color: dayConfig.isActive ? '#FFFFFF' : '#64748B', cursor: 'pointer' }}
                      >
                        {dayName}
                      </label>
                      <span style={{ fontSize: '0.75rem', color: dayConfig.isActive ? '#10B981' : '#64748B' }}>
                        {dayConfig.isActive ? 'Active Working Day' : 'Day Off'}
                      </span>
                    </div>

                    {dayConfig.isActive && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button variant="outline" size="sm" icon={Plus} onClick={() => addShift(dayName)}>
                          Add Shift
                        </Button>
                        <Button variant="outline" size="sm" icon={Plus} onClick={() => addBreak(dayName)}>
                          Add Break
                        </Button>
                      </div>
                    )}
                  </div>

                  {dayConfig.isActive && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {/* Shifts */}
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, display: 'block', marginBottom: '0.375rem' }}>
                          WORKING SHIFTS
                        </span>
                        {dayConfig.shifts?.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                            {dayConfig.shifts.map((shift, idx) => (
                              <div
                                key={idx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.375rem',
                                  padding: '0.375rem 0.625rem',
                                  backgroundColor: '#171B29',
                                  border: '1px solid #1E2538',
                                  borderRadius: '8px',
                                }}
                              >
                                <input
                                  type="time"
                                  value={shift.start}
                                  onChange={(e) => updateShift(dayName, idx, 'start', e.target.value)}
                                  style={{ backgroundColor: 'transparent', border: 'none', color: '#fff', fontSize: '0.8125rem' }}
                                />
                                <span style={{ color: '#64748B' }}>to</span>
                                <input
                                  type="time"
                                  value={shift.end}
                                  onChange={(e) => updateShift(dayName, idx, 'end', e.target.value)}
                                  style={{ backgroundColor: 'transparent', border: 'none', color: '#fff', fontSize: '0.8125rem' }}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeShift(dayName, idx)}
                                  style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', padding: '2px' }}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>No shifts added yet</span>
                        )}
                      </div>

                      {/* Breaks */}
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, display: 'block', marginBottom: '0.375rem' }}>
                          BREAKS & MEAL INTERVALS (BLOCKED FROM BOOKING)
                        </span>
                        {dayConfig.breaks?.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                            {dayConfig.breaks.map((b, idx) => (
                              <div
                                key={idx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.375rem',
                                  padding: '0.375rem 0.625rem',
                                  backgroundColor: 'rgba(245, 158, 11, 0.08)',
                                  border: '1px solid rgba(245, 158, 11, 0.25)',
                                  borderRadius: '8px',
                                }}
                              >
                                <input
                                  type="text"
                                  value={b.label}
                                  placeholder="Break name"
                                  onChange={(e) => updateBreak(dayName, idx, 'label', e.target.value)}
                                  style={{ width: '70px', backgroundColor: 'transparent', border: 'none', color: '#FBBF24', fontSize: '0.75rem', fontWeight: 600 }}
                                />
                                <input
                                  type="time"
                                  value={b.start}
                                  onChange={(e) => updateBreak(dayName, idx, 'start', e.target.value)}
                                  style={{ backgroundColor: 'transparent', border: 'none', color: '#fff', fontSize: '0.8125rem' }}
                                />
                                <span style={{ color: '#64748B' }}>to</span>
                                <input
                                  type="time"
                                  value={b.end}
                                  onChange={(e) => updateBreak(dayName, idx, 'end', e.target.value)}
                                  style={{ backgroundColor: 'transparent', border: 'none', color: '#fff', fontSize: '0.8125rem' }}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeBreak(dayName, idx)}
                                  style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', padding: '2px' }}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>No breaks defined</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sticky Save Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <Button variant="primary" icon={Save} onClick={handleSaveSchedule} disabled={saving}>
              {saving ? 'Saving Schedule...' : 'Save Shifts & Working Hours'}
            </Button>
          </div>
        </div>
      )}

      {/* TAB 2: Holidays & Exceptions */}
      {activeTab === 'exceptions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: 0, color: '#FFFFFF' }}>Clinic Holidays & Doctor Leaves</h4>
              <p className="text-muted" style={{ margin: '4px 0 0', fontSize: '0.8125rem' }}>
                Dates entered here automatically block booking slots in the dynamic availability engine.
              </p>
            </div>
            <Button variant="primary" icon={Plus} onClick={() => setIsExceptionModalOpen(true)}>
              Add Holiday / Leave
            </Button>
          </div>

          <div className="card">
            <div className="table-responsive">
              <table className="cf-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Scope</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Reason</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {exceptions.length > 0 ? (
                    exceptions.map((exc) => (
                      <tr key={exc._id}>
                        <td>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: exc.type === 'holiday' ? 'rgba(37, 99, 235, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              color: exc.type === 'holiday' ? '#60A5FA' : '#FBBF24',
                            }}
                          >
                            {exc.type}
                          </span>
                        </td>
                        <td>
                          {exc.doctorId?.userId?.name ? `Dr. ${exc.doctorId.userId.name}` : 'Entire Clinic'}
                        </td>
                        <td><strong>{new Date(exc.startDate).toLocaleDateString()}</strong></td>
                        <td><strong>{new Date(exc.endDate).toLocaleDateString()}</strong></td>
                        <td>{exc.reason}</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleDeleteException(exc._id)}
                            style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer' }}
                            title="Delete Exception"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-muted">
                        No upcoming clinic holidays or doctor leaves recorded
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Booking Policies */}
      {activeTab === 'policy' && (
        <div className="card" style={{ maxWidth: '680px', padding: '2rem' }}>
          <h4 style={{ margin: '0 0 1.5rem', color: '#FFFFFF' }}>Clinic-Wide Appointment Booking Policies</h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#94A3B8', marginBottom: '0.375rem' }}>
                ADVANCE BOOKING WINDOW (DAYS)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={policy.advanceBookingDays}
                onChange={(e) => setPolicy({ ...policy, advanceBookingDays: parseInt(e.target.value, 10) || 30 })}
                style={{ width: '100%', padding: '0.625rem', backgroundColor: '#171B29', border: '1px solid #1E2538', borderRadius: '8px', color: '#fff' }}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                How many days into the future patient booking is open (e.g. 30 days).
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#94A3B8', marginBottom: '0.375rem' }}>
                MINIMUM LEAD TIME BEFORE SLOT (HOURS)
              </label>
              <input
                type="number"
                min="0"
                max="72"
                value={policy.minLeadTimeHours}
                onChange={(e) => setPolicy({ ...policy, minLeadTimeHours: parseInt(e.target.value, 10) || 0 })}
                style={{ width: '100%', padding: '0.625rem', backgroundColor: '#171B29', border: '1px solid #1E2538', borderRadius: '8px', color: '#fff' }}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                Disallows last-minute bookings within this lead cutoff (e.g. at least 2 hours notice).
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#94A3B8', marginBottom: '0.375rem' }}>
                CANCELLATION & RESCHEDULE CUTOFF (HOURS)
              </label>
              <input
                type="number"
                min="0"
                max="72"
                value={policy.cancellationCutoffHours}
                onChange={(e) => setPolicy({ ...policy, cancellationCutoffHours: parseInt(e.target.value, 10) || 0 })}
                style={{ width: '100%', padding: '0.625rem', backgroundColor: '#171B29', border: '1px solid #1E2538', borderRadius: '8px', color: '#fff' }}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                Hours before appointment when patient portal self-service cancel is locked (e.g. 4 hours).
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#94A3B8', marginBottom: '0.375rem' }}>
                AUTO NO-SHOW GRACE PERIOD (MINUTES)
              </label>
              <input
                type="number"
                min="5"
                max="180"
                value={policy.autoNoShowGraceMinutes}
                onChange={(e) => setPolicy({ ...policy, autoNoShowGraceMinutes: parseInt(e.target.value, 10) || 30 })}
                style={{ width: '100%', padding: '0.625rem', backgroundColor: '#171B29', border: '1px solid #1E2538', borderRadius: '8px', color: '#fff' }}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                Background cron marks appointment as &quot;no_show&quot; after this many minutes past slot time without check-in.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#94A3B8', marginBottom: '0.375rem' }}>
                CLINIC OPERATIONAL TIMEZONE
              </label>
              <input
                type="text"
                value={policy.timezone}
                onChange={(e) => setPolicy({ ...policy, timezone: e.target.value })}
                style={{ width: '100%', padding: '0.625rem', backgroundColor: '#171B29', border: '1px solid #1E2538', borderRadius: '8px', color: '#fff' }}
              />
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="primary" icon={Save} onClick={handleSavePolicy} disabled={saving}>
                {saving ? 'Updating...' : 'Save Policy Settings'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Appointment Types */}
      {activeTab === 'types' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: 0, color: '#FFFFFF' }}>Appointment Types & Service Durations</h4>
              <p className="text-muted" style={{ margin: '4px 0 0', fontSize: '0.8125rem' }}>
                Define consultation types with custom durations that dynamically resize booked time slots.
              </p>
            </div>
            <Button variant="primary" icon={Plus} onClick={() => setIsTypeModalOpen(true)}>
              New Appointment Type
            </Button>
          </div>

          <div className="card">
            <div className="table-responsive">
              <table className="cf-table">
                <thead>
                  <tr>
                    <th>Type Name</th>
                    <th>Code</th>
                    <th>Duration</th>
                    <th>Theme Color</th>
                    <th>Description</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {types.map((t) => (
                    <tr key={t._id}>
                      <td><strong>{t.name}</strong></td>
                      <td><code>{t.code}</code></td>
                      <td>
                        <span style={{ color: '#60A5FA', fontWeight: 600 }}>{t.durationMinutes} mins</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: t.color || '#2563EB' }} />
                          <span style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{t.color}</span>
                        </div>
                      </td>
                      <td>{t.description || '-'}</td>
                      <td>
                        <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New Appointment Type */}
      <Modal
        isOpen={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        title="Create Appointment Type"
        subtitle="Custom durations automatically adapt slot sizing in the booking engine"
        maxWidth="480px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <Button variant="outline" onClick={() => setIsTypeModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateType}>
              Create Type
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '0.25rem' }}>
              TYPE NAME *
            </label>
            <input
              type="text"
              placeholder="e.g., Extended Cardiogram Review"
              value={typeForm.name}
              onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
              style={{ width: '100%', padding: '0.625rem', backgroundColor: '#171B29', border: '1px solid #1E2538', borderRadius: '8px', color: '#fff' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '0.25rem' }}>
                DURATION (MINS) *
              </label>
              <input
                type="number"
                min="5"
                max="180"
                value={typeForm.durationMinutes}
                onChange={(e) => setTypeForm({ ...typeForm, durationMinutes: parseInt(e.target.value, 10) || 15 })}
                style={{ width: '100%', padding: '0.625rem', backgroundColor: '#171B29', border: '1px solid #1E2538', borderRadius: '8px', color: '#fff' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '0.25rem' }}>
                COLOR BADGE
              </label>
              <input
                type="color"
                value={typeForm.color}
                onChange={(e) => setTypeForm({ ...typeForm, color: e.target.value })}
                style={{ width: '100%', height: '42px', padding: '0.25rem', backgroundColor: '#171B29', border: '1px solid #1E2538', borderRadius: '8px', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '0.25rem' }}>
              DESCRIPTION
            </label>
            <input
              type="text"
              placeholder="Brief description for patient booking wizard..."
              value={typeForm.description}
              onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
              style={{ width: '100%', padding: '0.625rem', backgroundColor: '#171B29', border: '1px solid #1E2538', borderRadius: '8px', color: '#fff' }}
            />
          </div>
        </div>
      </Modal>

      {/* Modal: New Exception / Leave */}
      <Modal
        isOpen={isExceptionModalOpen}
        onClose={() => setIsExceptionModalOpen(false)}
        title="Add Holiday or Doctor Leave"
        subtitle="Slots during this date range are automatically blocked from booking"
        maxWidth="500px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
            <Button variant="outline" onClick={() => setIsExceptionModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateException}>
              Add Exception
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '0.25rem' }}>
              APPLIES TO (SCOPE)
            </label>
            <select
              value={exceptionForm.doctorId}
              onChange={(e) => setExceptionForm({ ...exceptionForm, doctorId: e.target.value })}
              style={{ width: '100%', padding: '0.625rem', backgroundColor: '#171B29', border: '1px solid #1E2538', borderRadius: '8px', color: '#fff' }}
            >
              <option value="">Entire Clinic (Holiday / Maintenance)</option>
              {doctors.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} (Individual Leave)
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '0.25rem' }}>
                START DATE
              </label>
              <input
                type="date"
                value={exceptionForm.startDate}
                onChange={(e) => setExceptionForm({ ...exceptionForm, startDate: e.target.value })}
                style={{ width: '100%', padding: '0.625rem', backgroundColor: '#171B29', border: '1px solid #1E2538', borderRadius: '8px', color: '#fff' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '0.25rem' }}>
                END DATE
              </label>
              <input
                type="date"
                value={exceptionForm.endDate}
                onChange={(e) => setExceptionForm({ ...exceptionForm, endDate: e.target.value })}
                style={{ width: '100%', padding: '0.625rem', backgroundColor: '#171B29', border: '1px solid #1E2538', borderRadius: '8px', color: '#fff' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '0.25rem' }}>
              REASON *
            </label>
            <input
              type="text"
              placeholder="e.g., National Health Holiday, Doctor Attending CME Seminar"
              value={exceptionForm.reason}
              onChange={(e) => setExceptionForm({ ...exceptionForm, reason: e.target.value })}
              style={{ width: '100%', padding: '0.625rem', backgroundColor: '#171B29', border: '1px solid #1E2538', borderRadius: '8px', color: '#fff' }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
