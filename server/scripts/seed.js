const mongoose = require('mongoose');
const env = require('../src/config/env');
const User = require('../src/models/User');
const Clinic = require('../src/models/Clinic');
const Department = require('../src/models/Department');
const Doctor = require('../src/models/Doctor');
const Patient = require('../src/models/Patient');
const Appointment = require('../src/models/Appointment');
const QueueEntry = require('../src/models/QueueEntry');
const Consultation = require('../src/models/Consultation');
const LabOrder = require('../src/models/LabOrder');
const LabReport = require('../src/models/LabReport');
const Notification = require('../src/models/Notification');
const DoctorSchedule = require('../src/models/DoctorSchedule');
const ScheduleException = require('../src/models/ScheduleException');
const AppointmentType = require('../src/models/AppointmentType');
const ClinicSchedulingPolicy = require('../src/models/ClinicSchedulingPolicy');
const { getTodayDateString } = require('../src/services/queueService');

const seedData = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('[Seed] Connected. Clearing existing collections...');

    await Promise.all([
      User.deleteMany({}),
      Clinic.deleteMany({}),
      Department.deleteMany({}),
      Doctor.deleteMany({}),
      Patient.deleteMany({}),
      Appointment.deleteMany({}),
      QueueEntry.deleteMany({}),
      Consultation.deleteMany({}),
      LabOrder.deleteMany({}),
      LabReport.deleteMany({}),
      Notification.deleteMany({}),
      DoctorSchedule.deleteMany({}),
      ScheduleException.deleteMany({}),
      AppointmentType.deleteMany({}),
      ClinicSchedulingPolicy.deleteMany({}),
    ]);

    console.log('[Seed] Creating Main Clinic...');
    const clinic = await Clinic.create({
      name: 'Drittech Health Polyclinic & Diagnostic Center',
      code: 'DTH-MAIN',
      address: {
        street: '742 Evergreen Medical Blvd',
        city: 'Metropolis',
        state: 'NY',
        zipCode: '10001',
        country: 'US',
      },
      phone: '+1 (555) 234-5678',
      email: 'contact@drittech.com',
      website: 'https://drittech.com',
      settings: {
        operatingHours: { open: '08:00', close: '20:00' },
        averageConsultationTimeMinutes: 15,
        turnApproachingMinutes: 15,
      },
    });

    console.log('[Seed] Creating Departments...');
    const deptGeneral = await Department.create({
      clinicId: clinic._id,
      name: 'General Medicine',
      code: 'GEN',
      description: 'Primary health consultations, routine checkups, and triage',
      avgWaitTimeMinutes: 15,
    });

    const deptCardiology = await Department.create({
      clinicId: clinic._id,
      name: 'Cardiology',
      code: 'CARD',
      description: 'Heart health, ECG diagnostics, and cardiovascular care',
      avgWaitTimeMinutes: 20,
    });

    const deptPediatrics = await Department.create({
      clinicId: clinic._id,
      name: 'Pediatrics',
      code: 'PED',
      description: 'Child wellness, developmental screenings, and vaccines',
      avgWaitTimeMinutes: 15,
    });

    const deptDiagnostics = await Department.create({
      clinicId: clinic._id,
      name: 'Diagnostic Laboratory',
      code: 'LAB',
      description: 'Pathology, hematology, and biochemical testing',
      avgWaitTimeMinutes: 10,
    });

    console.log('[Seed] Creating Users for all roles...');

    // 1. Super Admin
    await User.create({
      name: 'Alexander Cross',
      email: 'admin@drittech.com',
      password: 'admin123',
      role: 'super_admin',
      phone: '+1 (555) 000-0001',
    });

    // 2. Clinic Admin
    await User.create({
      name: 'Elena Rostova',
      email: 'clinicadmin@drittech.com',
      password: 'admin123',
      role: 'clinic_admin',
      clinicId: clinic._id,
      phone: '+1 (555) 000-0002',
    });

    // 3. Receptionist
    await User.create({
      name: 'Maya Lin',
      email: 'reception@drittech.com',
      password: 'reception123',
      role: 'receptionist',
      clinicId: clinic._id,
      phone: '+1 (555) 000-0003',
    });

    // 4. Doctor 1 (General Medicine)
    const doctorUser1 = await User.create({
      name: 'Dr. Sarah Jenkins',
      email: 'doctor.sarah@drittech.com',
      password: 'doctor123',
      role: 'doctor',
      clinicId: clinic._id,
      departmentId: deptGeneral._id,
      phone: '+1 (555) 000-0004',
    });

    const doctorProfile1 = await Doctor.create({
      userId: doctorUser1._id,
      clinicId: clinic._id,
      departmentId: deptGeneral._id,
      specialty: 'Internal Medicine',
      qualifications: 'MD, FACP',
      roomNumber: 'Room 102',
      avgConsultationMinutes: 15,
      isAvailable: true,
    });

    // Doctor 2 (Cardiology)
    const doctorUser2 = await User.create({
      name: 'Dr. Marcus Vance',
      email: 'doctor.marcus@drittech.com',
      password: 'doctor123',
      role: 'doctor',
      clinicId: clinic._id,
      departmentId: deptCardiology._id,
      phone: '+1 (555) 000-0005',
    });

    const doctorProfile2 = await Doctor.create({
      userId: doctorUser2._id,
      clinicId: clinic._id,
      departmentId: deptCardiology._id,
      specialty: 'Cardiovascular Specialist',
      qualifications: 'MD, FACC',
      roomNumber: 'Room 205',
      avgConsultationMinutes: 20,
      isAvailable: true,
    });

    // 5. Lab Technician
    await User.create({
      name: 'David Kim',
      email: 'lab@drittech.com',
      password: 'lab123',
      role: 'lab_technician',
      clinicId: clinic._id,
      departmentId: deptDiagnostics._id,
      phone: '+1 (555) 000-0006',
    });

    // 6. Patient Account
    const patientUser = await User.create({
      name: 'James Wilson',
      email: 'patient@drittech.com',
      password: 'patient123',
      role: 'patient',
      clinicId: clinic._id,
      phone: '+1 (555) 987-6543',
    });

    console.log('[Seed] Creating Patients Records...');
    const patient1 = await Patient.create({
      clinicId: clinic._id,
      userId: patientUser._id,
      patientIdentifier: 'PAT-2026-0001',
      fullName: 'James Wilson',
      email: 'patient@drittech.com',
      phone: '+1 (555) 987-6543',
      gender: 'male',
      age: 38,
      dateOfBirth: new Date('1988-04-12'),
      bloodGroup: 'O+',
      allergies: ['Penicillin', 'Peanuts'],
      chronicConditions: ['Mild Hypertension'],
    });

    const patient2 = await Patient.create({
      clinicId: clinic._id,
      patientIdentifier: 'PAT-2026-0002',
      fullName: 'Sophia Martinez',
      email: 'sophia.m@example.com',
      phone: '+1 (555) 321-4567',
      gender: 'female',
      age: 29,
      dateOfBirth: new Date('1997-09-21'),
      bloodGroup: 'A+',
      allergies: [],
      chronicConditions: [],
    });

    const patient3 = await Patient.create({
      clinicId: clinic._id,
      patientIdentifier: 'PAT-2026-0003',
      fullName: 'Robert Henderson',
      email: 'robert.h@example.com',
      phone: '+1 (555) 654-7890',
      gender: 'male',
      age: 64,
      dateOfBirth: new Date('1962-01-15'),
      bloodGroup: 'B+',
      allergies: ['Sulfa drugs'],
      chronicConditions: ['Type 2 Diabetes', 'Hyperlipidemia'],
    });

    const patient4 = await Patient.create({
      clinicId: clinic._id,
      patientIdentifier: 'PAT-2026-0004',
      fullName: 'Emma Watson-Lee',
      email: 'emma.wl@example.com',
      phone: '+1 (555) 432-8765',
      gender: 'female',
      age: 7,
      dateOfBirth: new Date('2019-06-10'),
      bloodGroup: 'AB+',
      allergies: ['Dust mites'],
    });

    console.log("[Seed] Creating Today's Active Queue Entries...");
    const today = getTodayDateString();

    // Entry 1 - In Consultation with Dr. Sarah
    const q1 = await QueueEntry.create({
      clinicId: clinic._id,
      departmentId: deptGeneral._id,
      doctorId: doctorProfile1._id,
      patientId: patient2._id,
      tokenNumber: 'GEN-001',
      sequenceNumber: 1,
      queueDate: today,
      status: 'in_consultation',
      entryType: 'walk_in',
      checkInTime: new Date(Date.now() - 25 * 60 * 1000),
      calledTime: new Date(Date.now() - 10 * 60 * 1000),
      consultationStartTime: new Date(Date.now() - 8 * 60 * 1000),
      estimatedWaitMinutes: 0,
      patientsAhead: 0,
      notes: 'Persistent seasonal cough and sore throat',
    });

    // Update doctor's active patient
    doctorProfile1.currentPatientId = patient2._id;
    doctorProfile1.currentQueueEntryId = q1._id;
    await doctorProfile1.save();

    // Consultation draft for Dr. Sarah
    await Consultation.create({
      clinicId: clinic._id,
      patientId: patient2._id,
      doctorId: doctorProfile1._id,
      queueEntryId: q1._id,
      chiefComplaint: 'Upper respiratory congestion and dry cough for 4 days',
      symptoms: ['Sore throat', 'Mild fever', 'Nasal congestion'],
      vitals: {
        bloodPressure: '118/76',
        heartRate: '74 bpm',
        temperature: '99.1 °F',
        oxygenSaturation: '99%',
        weightKg: 62,
        heightCm: 168,
      },
      clinicalExamination: 'Pharynx mildly erythematous. Lungs clear to auscultation bilaterally.',
      assessment: 'Viral Upper Respiratory Infection',
      diagnosis: 'Acute Nasopharyngitis (J00)',
      treatmentPlan: 'Hydration, rest, saline nasal rinse, OTC throat lozenges.',
      prescriptions: [
        { medicationName: 'Benzonatate', dosage: '100mg', frequency: 'TID', duration: '5 days', instructions: 'Take with full glass of water' },
      ],
      status: 'draft',
    });

    // Entry 2 - Waiting for Dr. Sarah (James Wilson)
    const q2 = await QueueEntry.create({
      clinicId: clinic._id,
      departmentId: deptGeneral._id,
      doctorId: doctorProfile1._id,
      patientId: patient1._id,
      tokenNumber: 'GEN-002',
      sequenceNumber: 2,
      queueDate: today,
      trackingToken: 'track_james_wilson_demo_token_123',
      status: 'waiting',
      entryType: 'walk_in',
      checkInTime: new Date(Date.now() - 15 * 60 * 1000),
      estimatedWaitMinutes: 8,
      patientsAhead: 0,
      notes: 'Routine blood pressure review & lab results discussion',
    });

    // Entry 3 - Waiting (Robert Henderson)
    const q3 = await QueueEntry.create({
      clinicId: clinic._id,
      departmentId: deptGeneral._id,
      doctorId: doctorProfile1._id,
      patientId: patient3._id,
      tokenNumber: 'GEN-003',
      sequenceNumber: 3,
      queueDate: today,
      status: 'waiting',
      priority: 'senior_child',
      entryType: 'appointment',
      checkInTime: new Date(Date.now() - 5 * 60 * 1000),
      estimatedWaitMinutes: 22,
      patientsAhead: 1,
      notes: 'Quarterly diabetes management consultation',
    });

    console.log('[Seed] Creating Diagnostic Orders & Published Reports...');
    // Lab Order 1 (Published for James Wilson)
    const labOrder1 = await LabOrder.create({
      clinicId: clinic._id,
      patientId: patient1._id,
      doctorId: doctorProfile1._id,
      orderNumber: 'ORD-2026-0001',
      testType: 'Comprehensive Metabolic Panel (CMP)',
      category: 'Biochemistry',
      urgency: 'routine',
      status: 'published',
      sampleCollectedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      clinicalNotes: 'Annual metabolic baseline checkup',
    });

    const report1 = await LabReport.create({
      clinicId: clinic._id,
      patientId: patient1._id,
      doctorId: doctorProfile1._id,
      labOrderId: labOrder1._id,
      reportNumber: 'REP-2026-0001',
      title: 'Comprehensive Metabolic Panel (CMP) Report',
      testDate: new Date(Date.now() - 20 * 60 * 60 * 1000),
      filePath: 'uploads/sample_cmp_report.pdf',
      originalFileName: 'CMP_Report_James_Wilson.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 245760,
      results: [
        { parameter: 'Fasting Blood Glucose', value: '92', unit: 'mg/dL', referenceRange: '70 - 99', flag: 'NORMAL' },
        { parameter: 'Blood Urea Nitrogen (BUN)', value: '14', unit: 'mg/dL', referenceRange: '7 - 20', flag: 'NORMAL' },
        { parameter: 'Serum Creatinine', value: '0.9', unit: 'mg/dL', referenceRange: '0.6 - 1.2', flag: 'NORMAL' },
        { parameter: 'Total Cholesterol', value: '215', unit: 'mg/dL', referenceRange: '< 200', flag: 'HIGH' },
        { parameter: 'Vitamin D (25-OH)', value: '22', unit: 'ng/mL', referenceRange: '30 - 100', flag: 'LOW' },
      ],
      technicianNotes: 'All controls within standard calibration limits.',
      aiSummary: {
        status: 'available',
        bullets: [
          'Total Cholesterol (215 mg/dL) is above the laboratory reference range (< 200 mg/dL).',
          'Vitamin D (22 ng/mL) is below the recommended reference threshold (30 - 100 ng/mL).',
          'Fasting Blood Glucose, BUN, and Creatinine parameters are within healthy normal ranges.',
        ],
        disclaimer: 'This plain-language summary is an automated overview for patient convenience. Please consult your physician to interpret your clinical results.',
        generatedAt: new Date(),
        provider: 'mock',
      },
      status: 'published',
      publishedAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
    });

    labOrder1.labReportId = report1._id;
    await labOrder1.save();

    // Lab Order 2 (Processing for Robert Henderson)
    await LabOrder.create({
      clinicId: clinic._id,
      patientId: patient3._id,
      doctorId: doctorProfile1._id,
      orderNumber: 'ORD-2026-0002',
      testType: 'Hemoglobin A1c (HbA1c)',
      category: 'Biochemistry',
      urgency: 'routine',
      status: 'processing',
      sampleCollectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      clinicalNotes: 'Glycemic control evaluation',
    });

    console.log('[Seed] Configuring Clinic Scheduling Policy, Types, and Doctor Schedules...');
    await ClinicSchedulingPolicy.create({
      clinicId: clinic._id,
      advanceBookingDays: 30,
      minLeadTimeHours: 2,
      cancellationCutoffHours: 4,
      autoNoShowGraceMinutes: 30,
      overbookingLimit: 0,
      timezone: 'America/New_York',
    });

    const typeConsult = await AppointmentType.create({
      clinicId: clinic._id,
      departmentId: deptGeneral._id,
      name: 'General Consultation',
      code: 'CONSULT',
      durationMinutes: 15,
      color: '#2563EB',
      description: 'Routine outpatient medical consultation and diagnosis',
      active: true,
    });

    const typeComprehensive = await AppointmentType.create({
      clinicId: clinic._id,
      departmentId: deptGeneral._id,
      name: 'Comprehensive Health Check',
      code: 'COMP_CHECK',
      durationMinutes: 30,
      color: '#10B981',
      description: 'In-depth clinical evaluation, chronic disease checkup, and lab review',
      active: true,
    });

    const typeFollowUp = await AppointmentType.create({
      clinicId: clinic._id,
      departmentId: deptGeneral._id,
      name: 'Follow-up Visit',
      code: 'FOLLOWUP',
      durationMinutes: 15,
      color: '#0EA5E9',
      description: 'Treatment response check and prescription renewal',
      active: true,
    });

    const typeCardio = await AppointmentType.create({
      clinicId: clinic._id,
      departmentId: deptCardiology._id,
      name: 'Cardiology Assessment',
      code: 'CARDIO_EVAL',
      durationMinutes: 30,
      color: '#8B5CF6',
      description: 'Cardiovascular risk evaluation and ECG diagnostic review',
      active: true,
    });

    // Weekly schedules for Dr. Sarah Jenkins
    await DoctorSchedule.create({
      clinicId: clinic._id,
      doctorId: doctorProfile1._id,
      weeklyHours: [
        {
          day: 'Monday',
          isActive: true,
          shifts: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '17:30' }],
          breaks: [{ start: '13:00', end: '14:00', label: 'Lunch & Hospital Rounds' }],
        },
        {
          day: 'Tuesday',
          isActive: true,
          shifts: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '17:30' }],
          breaks: [{ start: '13:00', end: '14:00', label: 'Lunch' }],
        },
        {
          day: 'Wednesday',
          isActive: true,
          shifts: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '17:30' }],
          breaks: [{ start: '13:00', end: '14:00', label: 'Lunch' }],
        },
        {
          day: 'Thursday',
          isActive: true,
          shifts: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '17:30' }],
          breaks: [{ start: '13:00', end: '14:00', label: 'Lunch' }],
        },
        {
          day: 'Friday',
          isActive: true,
          shifts: [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '16:30' }],
          breaks: [{ start: '13:00', end: '14:00', label: 'Lunch' }],
        },
        {
          day: 'Saturday',
          isActive: true,
          shifts: [{ start: '09:30', end: '13:00' }],
          breaks: [],
        },
        {
          day: 'Sunday',
          isActive: false,
          shifts: [],
          breaks: [],
        },
      ],
      slotDuration: 15,
      bufferMinutes: 5,
      maxPerDay: 28,
      timezone: 'America/New_York',
      isActive: true,
    });

    // Weekly schedules for Dr. Marcus Vance
    await DoctorSchedule.create({
      clinicId: clinic._id,
      doctorId: doctorProfile2._id,
      weeklyHours: [
        {
          day: 'Monday',
          isActive: true,
          shifts: [{ start: '08:30', end: '12:30' }, { start: '13:30', end: '17:00' }],
          breaks: [{ start: '12:30', end: '13:30', label: 'Lunch & Catheter Lab' }],
        },
        {
          day: 'Tuesday',
          isActive: true,
          shifts: [{ start: '08:30', end: '12:30' }, { start: '13:30', end: '17:00' }],
          breaks: [{ start: '12:30', end: '13:30', label: 'Lunch' }],
        },
        {
          day: 'Wednesday',
          isActive: true,
          shifts: [{ start: '08:30', end: '12:30' }, { start: '13:30', end: '17:00' }],
          breaks: [{ start: '12:30', end: '13:30', label: 'Lunch' }],
        },
        {
          day: 'Thursday',
          isActive: true,
          shifts: [{ start: '08:30', end: '12:30' }, { start: '13:30', end: '17:00' }],
          breaks: [{ start: '12:30', end: '13:30', label: 'Lunch' }],
        },
        {
          day: 'Friday',
          isActive: true,
          shifts: [{ start: '08:30', end: '13:00' }],
          breaks: [],
        },
        {
          day: 'Saturday',
          isActive: false,
          shifts: [],
          breaks: [],
        },
        {
          day: 'Sunday',
          isActive: false,
          shifts: [],
          breaks: [],
        },
      ],
      slotDuration: 30,
      bufferMinutes: 5,
      maxPerDay: 16,
      timezone: 'America/New_York',
      isActive: true,
    });

    // Schedule Exceptions
    const clinicHolidayStart = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    const clinicHolidayEnd = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    clinicHolidayStart.setHours(0, 0, 0, 0);
    clinicHolidayEnd.setHours(23, 59, 59, 999);

    await ScheduleException.create({
      clinicId: clinic._id,
      doctorId: null, // clinic-wide
      startDate: clinicHolidayStart,
      endDate: clinicHolidayEnd,
      type: 'holiday',
      reason: 'Regional Healthcare Technology Conference & Staff Training',
    });

    const doctorLeaveStart = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const doctorLeaveEnd = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
    await ScheduleException.create({
      clinicId: clinic._id,
      doctorId: doctorProfile2._id,
      startDate: doctorLeaveStart,
      endDate: doctorLeaveEnd,
      type: 'leave',
      reason: 'Annual Cardiology Association Symposium',
    });

    console.log('[Seed] Creating ~30 Realistic Appointments across statuses...');
    const helperSlotTime = (baseDate, hours, minutes) => {
      const d = new Date(baseDate);
      d.setUTCHours(hours, minutes, 0, 0);
      return d;
    };

    const aptSeedData = [];
    const patients = [patient1, patient2, patient3, patient4];

    // Generate appointments for Days [-5 to +7]
    for (let offset = -5; offset <= 7; offset++) {
      const dayRef = new Date();
      dayRef.setDate(dayRef.getDate() + offset);
      const dateStr = dayRef.toISOString().split('T')[0];

      if (offset < 0) {
        // Past appointments: mostly completed, some cancelled or no_show
        aptSeedData.push({
          clinicId: clinic._id,
          patientId: patients[(Math.abs(offset)) % patients.length]._id,
          doctorId: doctorProfile1._id,
          departmentId: deptGeneral._id,
          appointmentDate: new Date(dateStr),
          slotTime: '10:00',
          startTime: helperSlotTime(dayRef, 10, 0),
          endTime: helperSlotTime(dayRef, 10, 15),
          typeId: typeConsult._id,
          type: typeConsult.name,
          reasonForVisit: 'Periodic wellness review',
          status: offset === -2 ? 'no_show' : offset === -4 ? 'cancelled' : 'completed',
          cancelReason: offset === -4 ? 'Patient personal emergency' : '',
          source: 'portal',
        });

        aptSeedData.push({
          clinicId: clinic._id,
          patientId: patients[(Math.abs(offset) + 1) % patients.length]._id,
          doctorId: doctorProfile2._id,
          departmentId: deptCardiology._id,
          appointmentDate: new Date(dateStr),
          slotTime: '14:30',
          startTime: helperSlotTime(dayRef, 14, 30),
          endTime: helperSlotTime(dayRef, 15, 0),
          typeId: typeCardio._id,
          type: typeCardio.name,
          reasonForVisit: 'Echocardiogram follow-up consultation',
          status: 'completed',
          source: 'reception',
        });
      } else if (offset === 0) {
        // TODAY's Appointments:
        // 1) Checked-in appointment linked to q3 (Robert Henderson)
        aptSeedData.push({
          clinicId: clinic._id,
          patientId: patient3._id,
          doctorId: doctorProfile1._id,
          departmentId: deptGeneral._id,
          appointmentDate: new Date(dateStr),
          slotTime: '09:30',
          startTime: helperSlotTime(dayRef, 9, 30),
          endTime: helperSlotTime(dayRef, 9, 45),
          typeId: typeFollowUp._id,
          type: typeFollowUp.name,
          reasonForVisit: 'Quarterly diabetes management consultation',
          status: 'checked_in',
          queueEntryId: q3._id,
          source: 'portal',
        });

        // 2) James Wilson demo patient appointment today (confirmed)
        aptSeedData.push({
          clinicId: clinic._id,
          patientId: patient1._id,
          doctorId: doctorProfile1._id,
          departmentId: deptGeneral._id,
          appointmentDate: new Date(dateStr),
          slotTime: '11:15',
          startTime: helperSlotTime(dayRef, 11, 15),
          endTime: helperSlotTime(dayRef, 11, 30),
          typeId: typeConsult._id,
          type: typeConsult.name,
          reasonForVisit: 'Blood pressure follow-up and prescription review',
          status: 'confirmed',
          source: 'portal',
        });

        // 3) Sophia Martinez today with Dr. Marcus (confirmed)
        aptSeedData.push({
          clinicId: clinic._id,
          patientId: patient2._id,
          doctorId: doctorProfile2._id,
          departmentId: deptCardiology._id,
          appointmentDate: new Date(dateStr),
          slotTime: '14:00',
          startTime: helperSlotTime(dayRef, 14, 0),
          endTime: helperSlotTime(dayRef, 14, 30),
          typeId: typeCardio._id,
          type: typeCardio.name,
          reasonForVisit: 'Arrhythmia investigation',
          status: 'confirmed',
          source: 'reception',
        });

        // 4) Emma Watson-Lee completed earlier today
        aptSeedData.push({
          clinicId: clinic._id,
          patientId: patient4._id,
          doctorId: doctorProfile1._id,
          departmentId: deptGeneral._id,
          appointmentDate: new Date(dateStr),
          slotTime: '09:00',
          startTime: helperSlotTime(dayRef, 9, 0),
          endTime: helperSlotTime(dayRef, 9, 15),
          typeId: typeConsult._id,
          type: typeConsult.name,
          reasonForVisit: 'Mild allergic rash inspection',
          status: 'completed',
          source: 'portal',
        });
      } else {
        // FUTURE Appointments (offset 1 to 7)
        aptSeedData.push({
          clinicId: clinic._id,
          patientId: patients[offset % patients.length]._id,
          doctorId: doctorProfile1._id,
          departmentId: deptGeneral._id,
          appointmentDate: new Date(dateStr),
          slotTime: offset % 2 === 0 ? '10:15' : '11:45',
          startTime: helperSlotTime(dayRef, offset % 2 === 0 ? 10 : 11, offset % 2 === 0 ? 15 : 45),
          endTime: helperSlotTime(dayRef, offset % 2 === 0 ? 10 : 12, offset % 2 === 0 ? 30 : 0),
          typeId: typeConsult._id,
          type: typeConsult.name,
          reasonForVisit: 'Routine physical checkup & lab order',
          status: 'confirmed',
          source: 'portal',
        });

        aptSeedData.push({
          clinicId: clinic._id,
          patientId: patients[(offset + 2) % patients.length]._id,
          doctorId: doctorProfile2._id,
          departmentId: deptCardiology._id,
          appointmentDate: new Date(dateStr),
          slotTime: '15:00',
          startTime: helperSlotTime(dayRef, 15, 0),
          endTime: helperSlotTime(dayRef, 15, 30),
          typeId: typeCardio._id,
          type: typeCardio.name,
          reasonForVisit: 'Cardiovascular exercise tolerance test review',
          status: offset === 3 ? 'rescheduled' : 'confirmed',
          cancelReason: offset === 3 ? 'Doctor rescheduled to alternate day' : '',
          source: 'portal',
        });
      }
    }

    // Insert all appointments
    for (const apt of aptSeedData) {
      await Appointment.create(apt);
    }

    console.log('[Seed] Creating Sample Notifications...');
    await Notification.create({
      clinicId: clinic._id,
      patientId: patient1._id,
      userId: patientUser._id,
      type: 'report_published',
      title: 'Diagnostic Report Ready',
      message: 'Your Comprehensive Metabolic Panel report is now available in your patient portal.',
      channels: [{ channel: 'in_app', status: 'delivered', sentAt: new Date() }],
      metadata: { labReportId: report1._id, reportNumber: report1.reportNumber },
    });

    console.log('====================================================');
    console.log('✅ Demo Seed Data Created Successfully!');
    console.log('----------------------------------------------------');
    console.log('Role Credentials for Testing:');
    console.log('1. Super Admin:      admin@drittech.com / admin123');
    console.log('2. Clinic Admin:     clinicadmin@drittech.com / admin123');
    console.log('3. Receptionist:     reception@drittech.com / reception123');
    console.log('4. Doctor:           doctor.sarah@drittech.com / doctor123');
    console.log('5. Lab Technician:   lab@drittech.com / lab123');
    console.log('6. Patient:          patient@drittech.com / patient123');
    console.log('Demo Guest Tracker Token: track_james_wilson_demo_token_123');
    console.log('====================================================');

    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]', err);
    process.exit(1);
  }
};

seedData();
