const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
      required: true,
      index: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true,
    },
    queueEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QueueEntry',
      default: null,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null,
    },
    chiefComplaint: {
      type: String,
      default: '',
    },
    symptoms: [String],
    vitals: {
      bloodPressure: String,
      heartRate: String,
      temperature: String,
      respiratoryRate: String,
      oxygenSaturation: String,
      weightKg: Number,
      heightCm: Number,
    },
    clinicalExamination: {
      type: String,
      default: '',
    },
    assessment: {
      type: String,
      default: '',
    },
    diagnosis: {
      type: String,
      default: '',
    },
    icd10Codes: [String],
    treatmentPlan: {
      type: String,
      default: '',
    },
    prescriptions: [
      {
        medicationName: String,
        dosage: String,
        frequency: String,
        duration: String,
        instructions: String,
      },
    ],
    recommendedLabTests: [
      {
        testName: String,
        instructions: String,
        urgency: {
          type: String,
          enum: ['routine', 'urgent', 'stat'],
          default: 'routine',
        },
      },
    ],
    followUpDate: Date,
    followUpNotes: String,
    status: {
      type: String,
      enum: ['draft', 'completed', 'cancelled'],
      default: 'draft',
      index: true,
    },
    durationMinutes: {
      type: Number,
      default: 0,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Consultation', consultationSchema);
