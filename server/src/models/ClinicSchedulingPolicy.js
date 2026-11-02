const mongoose = require('mongoose');

const clinicSchedulingPolicySchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
      required: true,
      unique: true,
      index: true,
    },
    advanceBookingDays: {
      type: Number,
      default: 30, // Max days into the future booking is open
      min: 1,
      max: 365,
    },
    minLeadTimeHours: {
      type: Number,
      default: 2, // Minimum notice needed before slot start
      min: 0,
      max: 72,
    },
    cancellationCutoffHours: {
      type: Number,
      default: 4, // Hours before appointment after which cancel/reschedule is locked
      min: 0,
      max: 72,
    },
    autoNoShowGraceMinutes: {
      type: Number,
      default: 30, // Minutes past start time to auto-mark no_show
      min: 5,
      max: 240,
    },
    overbookingLimit: {
      type: Number,
      default: 0,
    },
    timezone: {
      type: String,
      default: 'America/New_York',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ClinicSchedulingPolicy', clinicSchedulingPolicySchema);
