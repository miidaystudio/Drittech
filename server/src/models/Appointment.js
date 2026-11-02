const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
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
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true,
    },
    appointmentDate: {
      type: Date,
      required: true,
      index: true,
    },
    slotTime: {
      type: String,
      required: true,
    },
    startTime: {
      type: Date,
      index: true,
    },
    endTime: {
      type: Date,
    },
    typeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AppointmentType',
      default: null,
    },
    type: {
      type: String,
      default: 'consultation',
    },
    status: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'scheduled',
        'checked_in',
        'in_consultation',
        'in_progress',
        'completed',
        'cancelled',
        'no_show',
        'rescheduled',
      ],
      default: 'confirmed',
      index: true,
    },
    reasonForVisit: {
      type: String,
      default: '',
    },
    source: {
      type: String,
      enum: ['portal', 'reception', 'walk-in', 'walk_in'],
      default: 'portal',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    cancelReason: {
      type: String,
      default: '',
    },
    rescheduledFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null,
    },
    queueEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QueueEntry',
      default: null,
    },
    idempotencyKey: {
      type: String,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for reason alias
appointmentSchema.virtual('reason').get(function () {
  return this.reasonForVisit;
});

// Compound partial unique index to prevent double-booking the same doctor slot concurrently
appointmentSchema.index(
  { doctorId: 1, startTime: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['pending', 'confirmed', 'scheduled', 'checked_in', 'in_consultation', 'in_progress'] },
      startTime: { $exists: true, $ne: null },
    },
  }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
