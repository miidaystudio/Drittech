const Consultation = require('../models/Consultation');
const QueueEntry = require('../models/QueueEntry');
const LabOrder = require('../models/LabOrder');
const Doctor = require('../models/Doctor');
const { updateQueueStatus } = require('./queueService');
const { logAudit } = require('./auditService');

/**
 * Start or retrieve active consultation for patient / queue entry
 */
const getOrCreateConsultation = async ({
  clinicId,
  doctorId,
  patientId,
  queueEntryId = null,
  appointmentId = null,
  req = null,
}) => {
  // Check if draft already exists
  let consultation = null;
  if (queueEntryId) {
    consultation = await Consultation.findOne({
      clinicId,
      queueEntryId,
      status: 'draft',
    });
  }

  if (!consultation) {
    consultation = await Consultation.create({
      clinicId,
      doctorId,
      patientId,
      queueEntryId,
      appointmentId,
      startedAt: new Date(),
      status: 'draft',
    });

    // Update queue entry status to in_consultation
    if (queueEntryId) {
      await updateQueueStatus({
        entryId: queueEntryId,
        status: 'in_consultation',
        doctorId,
        req,
      });
    }

    logAudit({
      clinicId,
      userId: req?.user?.id,
      userRole: 'doctor',
      action: 'CONSULTATION_STARTED',
      resourceType: 'Consultation',
      resourceId: consultation._id.toString(),
      details: { patientId, doctorId },
      req,
    });
  }

  return consultation;
};

/**
 * Save draft notes with autosave support
 */
const saveConsultationDraft = async (consultationId, data, req = null) => {
  const consultation = await Consultation.findById(consultationId);
  if (!consultation) {
    throw new Error('Consultation not found');
  }

  if (consultation.status === 'completed') {
    throw new Error('Cannot edit a completed consultation');
  }

  const allowedFields = [
    'chiefComplaint',
    'symptoms',
    'vitals',
    'clinicalExamination',
    'assessment',
    'diagnosis',
    'icd10Codes',
    'treatmentPlan',
    'prescriptions',
    'recommendedLabTests',
    'followUpDate',
    'followUpNotes',
  ];

  allowedFields.forEach((field) => {
    if (data[field] !== undefined) {
      consultation[field] = data[field];
    }
  });

  await consultation.save();
  return consultation;
};

/**
 * Finalize and complete consultation
 */
const completeConsultation = async (consultationId, data, req = null) => {
  const consultation = await Consultation.findById(consultationId);
  if (!consultation) {
    throw new Error('Consultation not found');
  }

  // Update fields
  if (data) {
    await saveConsultationDraft(consultationId, data, req);
  }

  const completedAt = new Date();
  const durationMs = completedAt - new Date(consultation.startedAt);
  const durationMinutes = Math.max(1, Math.round(durationMs / 60000));

  consultation.status = 'completed';
  consultation.completedAt = completedAt;
  consultation.durationMinutes = durationMinutes;
  await consultation.save();

  // If there are recommended lab tests, automatically create Lab Orders
  if (consultation.recommendedLabTests && consultation.recommendedLabTests.length > 0) {
    for (const test of consultation.recommendedLabTests) {
      const count = await LabOrder.countDocuments({ clinicId: consultation.clinicId });
      const orderNumber = `ORD-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

      await LabOrder.create({
        clinicId: consultation.clinicId,
        patientId: consultation.patientId,
        doctorId: consultation.doctorId,
        consultationId: consultation._id,
        orderNumber,
        testType: test.testName || 'Other Diagnostic Test',
        urgency: test.urgency || 'routine',
        clinicalNotes: test.instructions || 'Ordered from consultation',
        status: 'ordered',
      });
    }
  }

  // Complete Queue Entry
  if (consultation.queueEntryId) {
    await updateQueueStatus({
      entryId: consultation.queueEntryId,
      status: 'completed',
      doctorId: consultation.doctorId,
      req,
    });
  }

  // Update Doctor average consultation duration
  const doctor = await Doctor.findById(consultation.doctorId);
  if (doctor) {
    doctor.currentPatientId = null;
    doctor.currentQueueEntryId = null;
    await doctor.save();
  }

  logAudit({
    clinicId: consultation.clinicId,
    userId: req?.user?.id,
    userRole: 'doctor',
    action: 'CONSULTATION_COMPLETED',
    resourceType: 'Consultation',
    resourceId: consultation._id.toString(),
    details: { durationMinutes, patientId: consultation.patientId },
    req,
  });

  return consultation;
};

module.exports = {
  getOrCreateConsultation,
  saveConsultationDraft,
  completeConsultation,
};
