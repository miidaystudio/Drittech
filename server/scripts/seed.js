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
    ]);

    console.log('[Seed] Creating Main Clinic...');
    const clinic = await Clinic.create({
      name: 'CareFlow Health Polyclinic & Diagnostic Center',
      code: 'CFH-MAIN',
      address: {
        street: '742 Evergreen Medical Blvd',
        city: 'Metropolis',
        state: 'NY',
        zipCode: '10001',
        country: 'US',
      },
      phone: '+1 (555) 234-5678',
      email: 'contact@careflow.drittech.com',
      website: 'https://careflow.drittech.com',
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
