const mongoose = require('mongoose');

const scheduleExceptionSchema = new mongoose.Schema(
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
      default: null, // null means whole clinic holiday/closure
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      enum: ['leave', 'holiday', 'custom_hours'],
      default: 'leave',
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    customShifts: [
      {
        start: String,
        end: String,
        _id: false,
      },
    ],
  },
  {
    timestamps: true,
  }
);

scheduleExceptionSchema.index({ clinicId: 1, startDate: 1, endDate: 1 });
scheduleExceptionSchema.index({ doctorId: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('ScheduleException', scheduleExceptionSchema);
