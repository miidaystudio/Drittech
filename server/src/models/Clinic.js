const mongoose = require('mongoose');

const clinicSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: 'US' },
    },
    phone: String,
    email: String,
    website: String,
    logoUrl: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    settings: {
      operatingHours: {
        open: { type: String, default: '08:00' },
        close: { type: String, default: '20:00' },
      },
      averageConsultationTimeMinutes: {
        type: Number,
        default: 15,
      },
      enableSmsAlerts: {
        type: Boolean,
        default: true,
      },
      enableWhatsAppAlerts: {
        type: Boolean,
        default: true,
      },
      turnApproachingMinutes: {
        type: Number,
        default: 15,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Clinic', clinicSchema);
