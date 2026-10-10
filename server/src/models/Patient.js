const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    patientIdentifier: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    age: {
      type: Number,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'unspecified'],
      default: 'unspecified',
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
      default: 'Unknown',
    },
    allergies: [
      {
        type: String,
      },
    ],
    chronicConditions: [
      {
        type: String,
      },
    ],
    emergencyContact: {
      name: String,
      relation: String,
      phone: String,
    },
  },
  {
    timestamps: true,
  }
);

patientSchema.index({ clinicId: 1, patientIdentifier: 1 }, { unique: true });
patientSchema.index({ clinicId: 1, phone: 1 });

module.exports = mongoose.model('Patient', patientSchema);
