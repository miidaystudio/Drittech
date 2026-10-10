const Doctor = require('../models/Doctor');
const Consultation = require('../models/Consultation');
const Clinic = require('../models/Clinic');

/**
 * Calculates dynamic estimated wait time for a patient in queue
 */
const estimateWaitTime = async ({
  clinicId,
  departmentId,
  doctorId,
  patientsAhead = 0,
  priority = 'normal',
}) => {
  let avgDuration = 15; // default fallback minutes

  try {
    // 1. Check if assigned doctor has specific historical stats
    if (doctorId) {
      const doctor = await Doctor.findById(doctorId);
      if (doctor && doctor.avgConsultationMinutes) {
        avgDuration = doctor.avgConsultationMinutes;
      }

      // Check recent completed consultations for dynamic rolling average (last 10 consultations)
      const recentConsultations = await Consultation.find({
        doctorId,
        status: 'completed',
        durationMinutes: { $gt: 2, $lt: 90 }, // Filter outliers
      })
        .sort({ completedAt: -1 })
        .limit(10)
        .select('durationMinutes');

      if (recentConsultations.length >= 3) {
        const total = recentConsultations.reduce((acc, c) => acc + (c.durationMinutes || 15), 0);
        avgDuration = Math.round(total / recentConsultations.length);
      }
    } else {
      // 2. Fetch clinic default
      const clinic = await Clinic.findById(clinicId);
      if (clinic?.settings?.averageConsultationTimeMinutes) {
        avgDuration = clinic.settings.averageConsultationTimeMinutes;
      }
    }

    // 3. Apply priority modifier (urgent patients get expedited priority factor)
    let priorityFactor = 1.0;
    if (priority === 'urgent' || priority === 'emergency') {
      priorityFactor = 0.5;
    } else if (priority === 'senior_child') {
      priorityFactor = 0.85;
    }

    // Calculate total minutes
    const rawEstimatedMinutes = Math.max(
      0,
      Math.round(patientsAhead * avgDuration * priorityFactor)
    );

    return {
      estimatedMinutes: rawEstimatedMinutes,
      avgConsultationDuration: avgDuration,
      confidence: patientsAhead > 5 ? 'medium' : 'high',
      formula: `${patientsAhead} patients ahead × ~${avgDuration} min/consult`,
    };
  } catch (error) {
    console.error('[Wait Estimator Error]', error.message);
    return {
      estimatedMinutes: Math.max(0, patientsAhead * 15),
      avgConsultationDuration: 15,
      confidence: 'fallback',
      formula: 'Baseline fallback: 15 min per patient',
    };
  }
};

module.exports = {
  estimateWaitTime,
};
