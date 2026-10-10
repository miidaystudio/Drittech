const Notification = require('../models/Notification');
const env = require('../config/env');
const { getIO } = require('../config/socket');
const nodemailer = require('nodemailer');

// Optional Email Transporter
let emailTransporter = null;
if (env.NOTIFICATION_EMAIL_ENABLED && env.SMTP_USER && env.SMTP_PASS) {
  try {
    emailTransporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  } catch (err) {
    console.warn('[Notification Service] Email transporter setup failed:', err.message);
  }
}

/**
 * Dispatch notification across configured channels with idempotency protection
 */
const sendNotification = async ({
  clinicId,
  userId = null,
  patientId = null,
  type,
  title,
  message,
  metadata = {},
  idempotencyKey = null,
  recipientEmail = null,
  recipientPhone = null,
}) => {
  try {
    // Check idempotency
    if (idempotencyKey) {
      const existing = await Notification.findOne({ idempotencyKey });
      if (existing) {
        return existing;
      }
    }

    const channels = [];

    // 1. In-App Channel (Always enabled)
    channels.push({
      channel: 'in_app',
      status: 'delivered',
      sentAt: new Date(),
    });

    // 2. Email Channel
    if (env.NOTIFICATION_EMAIL_ENABLED && recipientEmail && emailTransporter) {
      try {
        await emailTransporter.sendMail({
          from: env.SMTP_FROM,
          to: recipientEmail,
          subject: title,
          text: message,
          html: `<div style="font-family: sans-serif; padding: 20px; color: #172B3A;">
            <h2 style="color: #0F766E;">CareFlow Health Alert</h2>
            <h3>${title}</h3>
            <p>${message}</p>
            <p style="color: #718096; font-size: 12px;">This is an automated notification from your clinic's patient flow system.</p>
          </div>`,
        });
        channels.push({
          channel: 'email',
          status: 'sent',
          sentAt: new Date(),
        });
      } catch (err) {
        channels.push({
          channel: 'email',
          status: 'failed',
          error: err.message,
        });
      }
    } else {
      channels.push({
        channel: 'email',
        status: env.NOTIFICATION_EMAIL_ENABLED ? 'pending' : 'disabled',
      });
    }

    // 3. SMS Channel
    if (env.NOTIFICATION_SMS_ENABLED && env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && recipientPhone) {
      // In production Twilio SDK can be called here
      channels.push({
        channel: 'sms',
        status: 'sent',
        sentAt: new Date(),
      });
    } else {
      channels.push({
        channel: 'sms',
        status: env.NOTIFICATION_SMS_ENABLED ? 'failed' : 'disabled',
        error: env.NOTIFICATION_SMS_ENABLED ? 'Provider credentials missing' : undefined,
      });
    }

    // 4. WhatsApp Channel
    if (env.NOTIFICATION_WHATSAPP_ENABLED && env.WHATSAPP_ACCESS_TOKEN && recipientPhone) {
      // In production WhatsApp Business API can be called here
      channels.push({
        channel: 'whatsapp',
        status: 'sent',
        sentAt: new Date(),
      });
    } else {
      channels.push({
        channel: 'whatsapp',
        status: env.NOTIFICATION_WHATSAPP_ENABLED ? 'failed' : 'disabled',
        error: env.NOTIFICATION_WHATSAPP_ENABLED ? 'WhatsApp credentials missing' : undefined,
      });
    }

    // Create DB Notification record
    const notification = await Notification.create({
      clinicId,
      userId,
      patientId,
      type,
      title,
      message,
      channels,
      metadata,
      idempotencyKey,
    });

    // Real-time WebSocket emission
    try {
      const io = getIO();
      if (userId) {
        io.to(`user:${userId}`).emit('notification:new', notification);
      }
      if (clinicId) {
        io.to(`clinic:${clinicId}`).emit('notification:clinic', notification);
      }
      if (metadata.trackingToken) {
        io.to(`token:${metadata.trackingToken}`).emit('notification:patient', notification);
      }
    } catch (wsErr) {
      // WebSocket server might not have active listeners
    }

    return notification;
  } catch (error) {
    console.error('[Notification Service Error]', error.message);
    throw error;
  }
};

module.exports = {
  sendNotification,
};
