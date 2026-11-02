const mongoose = require('mongoose');

const appointmentTypeSchema = new mongoose.Schema(
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
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      default: 15,
      min: 5,
      max: 180,
    },
    color: {
      type: String,
      default: '#2563EB',
    },
    description: {
      type: String,
      default: '',
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

appointmentTypeSchema.index({ clinicId: 1, active: 1 });

module.exports = mongoose.model('AppointmentType', appointmentTypeSchema);
