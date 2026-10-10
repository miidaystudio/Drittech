const mongoose = require('mongoose');

const labReportSchema = new mongoose.Schema(
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
    },
    labOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LabOrder',
      required: true,
      unique: true,
      index: true,
    },
    reportNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
    },
    testDate: {
      type: Date,
      default: Date.now,
    },
    filePath: {
      type: String,
      required: true,
    },
    originalFileName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      default: 'application/pdf',
    },
    fileSizeBytes: {
      type: Number,
      default: 0,
    },
    storageProvider: {
      type: String,
      enum: ['local', 's3', 'r2'],
      default: 'local',
    },
    results: [
      {
        parameter: String,
        value: String,
        unit: String,
        referenceRange: String,
        flag: {
          type: String,
          enum: ['NORMAL', 'LOW', 'HIGH', 'CRITICAL', 'ABNORMAL'],
          default: 'NORMAL',
        },
      },
    ],
    technicianNotes: String,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    aiSummary: {
      status: {
        type: String,
        enum: ['not_generated', 'processing', 'available', 'failed'],
        default: 'not_generated',
      },
      bullets: [String],
      disclaimer: {
        type: String,
        default: 'This plain-language summary is an automated overview for patient convenience. Please consult your physician to interpret your clinical results.',
      },
      generatedAt: Date,
      provider: String,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    publishedAt: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('LabReport', labReportSchema);
