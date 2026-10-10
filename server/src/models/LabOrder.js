const mongoose = require('mongoose');

const labOrderSchema = new mongoose.Schema(
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
    consultationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Consultation',
      default: null,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    testType: {
      type: String,
      required: true,
      enum: [
        'Complete Blood Count (CBC)',
        'Comprehensive Metabolic Panel (CMP)',
        'Lipid Profile Panel',
        'Thyroid Stimulating Hormone (TSH)',
        'Hemoglobin A1c (HbA1c)',
        'Vitamin D (25-Hydroxy)',
        'Urinalysis Routine',
        'Liver Function Tests (LFT)',
        'Renal Function Panel (RFP)',
        'Electrolytes Panel',
        'C-Reactive Protein (CRP)',
        'Electrocardiogram (ECG)',
        'Chest X-Ray Digital',
        'Other Diagnostic Test',
      ],
    },
    category: {
      type: String,
      enum: ['Hematology', 'Biochemistry', 'Endocrinology', 'Immunology', 'Microbiology', 'Radiology', 'Pathology', 'General'],
      default: 'General',
    },
    urgency: {
      type: String,
      enum: ['routine', 'urgent', 'stat'],
      default: 'routine',
    },
    status: {
      type: String,
      enum: ['ordered', 'sample_collected', 'processing', 'awaiting_review', 'published', 'cancelled'],
      default: 'ordered',
      index: true,
    },
    sampleType: {
      type: String,
      default: 'Whole Blood / Serum',
    },
    sampleCollectedAt: Date,
    assignedTechnicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    clinicalNotes: String,
    labReportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LabReport',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('LabOrder', labOrderSchema);
