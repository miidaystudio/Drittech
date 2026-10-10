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
    type: {
      type: String,
      enum: ['consultation', 'follow_up', 'diagnostic_review', 'routine_checkup'],
      default: 'consultation',
    },
    status: {
      type: String,
      enum: ['scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show'],
      default: 'scheduled',
      index: true,
    },
    reasonForVisit: {
      type: String,
      default: '',
    },
    queueEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QueueEntry',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
