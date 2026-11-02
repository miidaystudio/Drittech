import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import env from '../src/config/env.js';
import { computeDoctorSlotsForDate } from '../src/services/schedulingService.js';
import { describe, it, beforeAll, afterAll, expect } from 'vitest';

describe('Dynamic Scheduling & Concurrency Tests', () => {
  let Doctor;
  let Clinic;
  let Department;
  let Patient;
  let Appointment;
  let ScheduleException;

  let clinic;
  let department;
  let doctor;
  let patient;
  let doctorToken;
  let patientToken;
  let receptionToken;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
    }

    Doctor = mongoose.model('Doctor');
    Clinic = mongoose.model('Clinic');
    Department = mongoose.model('Department');
    Patient = mongoose.model('Patient');
    Appointment = mongoose.model('Appointment');
    ScheduleException = mongoose.model('ScheduleException');

    // Login users to get session cookies / tokens
    const docLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'doctor.sarah@drittech.com',
      password: 'doctor123',
    });
    doctorToken = docLogin.headers['set-cookie'];

    const patLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'patient@drittech.com',
      password: 'patient123',
    });
    patientToken = patLogin.headers['set-cookie'];

    const recLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'reception@drittech.com',
      password: 'reception123',
    });
    receptionToken = recLogin.headers['set-cookie'];

    clinic = await Clinic.findOne();
    department = await Department.findOne({ clinicId: clinic._id });
    doctor = await Doctor.findOne({ clinicId: clinic._id });
    patient = await Patient.findOne({ clinicId: clinic._id, email: 'patient@drittech.com' });
  });

  afterAll(async () => {
    // Keep connection open or close if needed
  });

  it('computes available slots excluding breaks and booked slots', async () => {
    // Pick a date next Tuesday
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 7);
    const dateStr = testDate.toISOString().split('T')[0];

    const result = await computeDoctorSlotsForDate({
      clinicId: clinic._id,
      doctorId: doctor._id,
      dateStr,
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result.availableSlots)).toBe(true);

    // Verify lunch break (13:00 to 14:00) is NEVER included
    const hasLunchSlot = result.availableSlots.some((s) => s.slotTime >= '13:00' && s.slotTime < '14:00');
    expect(hasLunchSlot).toBe(false);
  });

  it('GET /api/v1/scheduling/availability returns computed slots', async () => {
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 5);
    const dateStr = testDate.toISOString().split('T')[0];

    const res = await request(app)
      .get(`/api/v1/scheduling/availability?doctorId=${doctor._id}&date=${dateStr}`)
      .set('Cookie', patientToken);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.dates).toBeDefined();
    expect(res.body.data.dates.length).toBeGreaterThan(0);
  });

  it('blocks booking when doctor has a registered leave or clinic holiday exception', async () => {
    const leaveDate = new Date();
    leaveDate.setDate(leaveDate.getDate() + 20);
    const dateStr = leaveDate.toISOString().split('T')[0];

    // Create an exception on that day
    const exc = await ScheduleException.create({
      clinicId: clinic._id,
      doctorId: doctor._id,
      startDate: new Date(`${dateStr}T00:00:00.000Z`),
      endDate: new Date(`${dateStr}T23:59:59.999Z`),
      type: 'leave',
      reason: 'Medical Conference Speaker',
    });

    const result = await computeDoctorSlotsForDate({
      clinicId: clinic._id,
      doctorId: doctor._id,
      dateStr,
    });

    expect(result.availableSlots.length).toBe(0);
    expect(result.isException).toBe(true);

    await ScheduleException.findByIdAndDelete(exc._id);
  });

  it('prevents double-booking race condition for the same doctor slot', async () => {
    // Pick next Wednesday (+9 days)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 9);
    const dateStr = futureDate.toISOString().split('T')[0];
    const slotTime = '10:00';

    // First booking
    const booking1 = await request(app)
      .post('/api/v1/appointments')
      .set('Cookie', patientToken)
      .send({
        doctorId: doctor._id.toString(),
        appointmentDate: dateStr,
        slotTime,
        reasonForVisit: 'First booking test',
      });

    expect(booking1.statusCode).toBe(201);
    expect(booking1.body.success).toBe(true);

    // Second booking attempt by receptionist for another patient on the exact same slot
    const secondPatient = await Patient.findOne({ _id: { $ne: patient._id } });
    const booking2 = await request(app)
      .post('/api/v1/appointments')
      .set('Cookie', receptionToken)
      .send({
        patientId: secondPatient._id.toString(),
        doctorId: doctor._id.toString(),
        appointmentDate: dateStr,
        slotTime,
        reasonForVisit: 'Conflicting second booking attempt',
      });

    expect(booking2.statusCode).toBe(409);
    expect(booking2.body.success).toBe(false);

    // Clean up test appointment
    await Appointment.findByIdAndDelete(booking1.body.data._id);
  });

  it('enforces patient ownership: patient can only see their own appointments', async () => {
    const res = await request(app)
      .get('/api/v1/appointments')
      .set('Cookie', patientToken);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    // All returned appointments must belong to James Wilson
    res.body.data.forEach((apt) => {
      expect(apt.patientId._id.toString()).toBe(patient._id.toString());
    });
  });

  it('supports appointment check-in transitioning status and dispatching queue token', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 8);
    const dateStr = futureDate.toISOString().split('T')[0];

    const aptRes = await request(app)
      .post('/api/v1/appointments')
      .set('Cookie', receptionToken)
      .send({
        patientId: patient._id.toString(),
        doctorId: doctor._id.toString(),
        appointmentDate: dateStr,
        slotTime: '15:15',
        reasonForVisit: 'Pre-checkin testing',
      });

    if (!aptRes.body.success) {
      console.log('Check-in test booking error:', aptRes.statusCode, aptRes.body);
    }
    expect(aptRes.statusCode).toBe(201);
    const aptId = aptRes.body.data._id;

    // Receptionist checks in
    const checkInRes = await request(app)
      .post(`/api/v1/appointments/${aptId}/check-in`)
      .set('Cookie', receptionToken);

    expect(checkInRes.statusCode).toBe(200);
    expect(checkInRes.body.success).toBe(true);
    expect(checkInRes.body.data.appointment.status).toBe('checked_in');
    expect(checkInRes.body.data.queueEntry).toBeDefined();
    expect(checkInRes.body.data.queueEntry.tokenNumber).toBeDefined();

    // Clean up
    await Appointment.findByIdAndDelete(aptId);
  });
});
