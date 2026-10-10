const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
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
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'queue_joined',
        'turn_approaching',
        'patient_called',
        'appointment_reminder',
        'report_published',
        'consultation_completed',
        'appointment_cancelled',
        'system_alert',
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    channels: [
      {
        channel: {
          type: String,
          enum: ['in_app', 'email', 'sms', 'whatsapp'],
        },
        status: {
          type: String,
          enum: ['pending', 'sent', 'delivered', 'failed', 'disabled'],
          default: 'pending',
        },
        providerMessageId: String,
        sentAt: Date,
        error: String,
      },
    ],
    metadata: {
      queueEntryId: mongoose.Schema.Types.ObjectId,
      appointmentId: mongoose.Schema.Types.ObjectId,
      labReportId: mongoose.Schema.Types.ObjectId,
      tokenNumber: String,
      estimatedWaitMinutes: Number,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
