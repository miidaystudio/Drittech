const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema(
  {
    start: { type: String, required: true }, // e.g., '09:00'
    end: { type: String, required: true },   // e.g., '17:00'
  },
  { _id: false }
);

const breakSchema = new mongoose.Schema(
  {
    start: { type: String, required: true }, // e.g., '13:00'
    end: { type: String, required: true },   // e.g., '14:00'
    label: { type: String, default: 'Break' },
  },
  { _id: false }
);

const dayScheduleSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true,
    },
    isActive: { type: Boolean, default: true },
    shifts: { type: [shiftSchema], default: [] },
    breaks: { type: [breakSchema], default: [] },
  },
  { _id: false }
);

const doctorScheduleSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
      required: true,
      index: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      unique: true,
      index: true,
    },
    weeklyHours: {
      type: [dayScheduleSchema],
      default: [],
    },
    slotDuration: {
      type: Number,
      default: 15, // minutes
      min: 5,
      max: 120,
    },
    bufferMinutes: {
      type: Number,
      default: 5, // minutes between appointments
      min: 0,
      max: 60,
    },
    maxPerDay: {
      type: Number,
      default: 30,
    },
    timezone: {
      type: String,
      default: 'America/New_York',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('DoctorSchedule', doctorScheduleSchema);
