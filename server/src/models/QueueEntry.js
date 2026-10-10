const mongoose = require('mongoose');
const crypto = require('crypto');

const queueEntrySchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
      required: true,
      index: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      default: null,
      index: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null,
    },
    tokenNumber: {
      type: String,
      required: true,
      trim: true,
    },
    sequenceNumber: {
      type: Number,
      required: true,
    },
    queueDate: {
      type: String, // YYYY-MM-DD for date-scoping
      required: true,
      index: true,
    },
    trackingToken: {
      type: String,
      unique: true,
      index: true,
      default: () => crypto.randomBytes(16).toString('hex'),
    },
    status: {
      type: String,
      enum: ['waiting', 'called', 'in_consultation', 'completed', 'skipped', 'cancelled'],
      default: 'waiting',
      index: true,
    },
    priority: {
      type: String,
      enum: ['normal', 'urgent', 'senior_child', 'emergency'],
      default: 'normal',
    },
    entryType: {
      type: String,
      enum: ['walk_in', 'appointment'],
      default: 'walk_in',
    },
    checkInTime: {
      type: Date,
      default: Date.now,
    },
    calledTime: {
      type: Date,
    },
    consultationStartTime: {
      type: Date,
    },
    completedTime: {
      type: Date,
    },
    estimatedWaitMinutes: {
      type: Number,
      default: 15,
    },
    patientsAhead: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

queueEntrySchema.index({ clinicId: 1, queueDate: 1, departmentId: 1, sequenceNumber: 1 });
queueEntrySchema.index({ clinicId: 1, queueDate: 1, status: 1 });

module.exports = mongoose.model('QueueEntry', queueEntrySchema);
