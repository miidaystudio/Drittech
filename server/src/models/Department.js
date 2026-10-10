const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    description: String,
    icon: {
      type: String,
      default: 'Activity',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    avgWaitTimeMinutes: {
      type: Number,
      default: 15,
    },
  },
  {
    timestamps: true,
  }
);

departmentSchema.index({ clinicId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Department', departmentSchema);
