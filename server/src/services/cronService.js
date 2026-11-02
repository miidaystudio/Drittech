const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const ClinicSchedulingPolicy = require('../models/ClinicSchedulingPolicy');
const { sendNotification } = require('./notificationService');
const { logAudit } = require('./auditService');
const { getIO } = require('../config/socket');

/**
 * Auto-mark overdue appointments as no-show
 */
const markOverdueAppointmentsAsNoShow = async () => {
  try {
    const now = new Date();
    // Default 30 min grace period cutoff
    const defaultCutoff = new Date(now.getTime() - 30 * 60 * 1000);

    const overdueAppointments = await Appointment.find({
      status: { $in: ['confirmed', 'scheduled', 'pending'] },
      $or: [
        { startTime: { $lte: defaultCutoff } },
        {
          startTime: { $exists: false },
          appointmentDate: { $lte: defaultCutoff },
        },
      ],
    })
      .populate('patientId')
      .populate('clinicId');

    for (const apt of overdueAppointments) {
      // Check clinic policy grace minutes if available
      let graceMinutes = 30;
      if (apt.clinicId) {
        const policy = await ClinicSchedulingPolicy.findOne({ clinicId: apt.clinicId._id || apt.clinicId });
        if (policy?.autoNoShowGraceMinutes) {
          graceMinutes = policy.autoNoShowGraceMinutes;
        }
      }

      const aptTime = apt.startTime || apt.appointmentDate;
      const aptGraceCutoff = new Date(aptTime.getTime() + graceMinutes * 60 * 1000);

      if (now > aptGraceCutoff) {
        apt.status = 'no_show';
        await apt.save();

        logAudit({
          clinicId: apt.clinicId?._id || apt.clinicId,
          userId: null,
          userRole: 'system',
          action: 'AUTO_MARK_NO_SHOW',
          resourceType: 'Appointment',
          resourceId: apt._id.toString(),
          details: { reason: `Grace period (${graceMinutes} mins) expired without patient arrival` },
        });

        // Notify patient & clinic
        try {
          const io = getIO();
          const cId = apt.clinicId?._id?.toString() || apt.clinicId?.toString();
          if (cId) {
            io.to(`clinic:${cId}`).emit('appointment:updated', apt);
          }
        } catch (e) {}
      }
    }
  } catch (err) {
    console.error('[Cron Error] Auto no-show task error:', err.message);
  }
};

/**
 * Dispatch 24-hour advance appointment reminders
 */
const sendUpcomingAppointmentReminders = async () => {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const upcomingAppointments = await Appointment.find({
      status: { $in: ['confirmed', 'scheduled'] },
      startTime: { $gte: windowStart, $lte: windowEnd },
    })
      .populate('patientId')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
      .populate('departmentId', 'name');

    for (const apt of upcomingAppointments) {
      if (!apt.patientId) continue;
      const doctorName = apt.doctorId?.userId?.name ? `Dr. ${apt.doctorId.userId.name}` : 'your physician';
      const timeStr = apt.slotTime || (apt.startTime ? apt.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');

      await sendNotification({
        clinicId: apt.clinicId,
        patientId: apt.patientId._id,
        userId: apt.patientId.userId || null,
        type: 'appointment_reminder',
        title: 'Appointment Reminder: Tomorrow',
        message: `Reminder: You have an appointment with ${doctorName} tomorrow at ${timeStr} (${apt.departmentId?.name || 'Clinic'}).`,
        idempotencyKey: `reminder_24h_${apt._id.toString()}`,
        recipientEmail: apt.patientId.email || null,
        recipientPhone: apt.patientId.phone || null,
      });
    }
  } catch (err) {
    console.error('[Cron Error] Reminder task error:', err.message);
  }
};

/**
 * Initialize background cron scheduler
 */
const initCronJobs = () => {
  // Run auto-no-show check every 10 minutes
  cron.schedule('*/10 * * * *', () => {
    markOverdueAppointmentsAsNoShow();
  });

  // Run reminder check every hour
  cron.schedule('0 * * * *', () => {
    sendUpcomingAppointmentReminders();
  });

  console.log('⏰ Scheduling background cron jobs initialized (No-show watcher & 24h reminders)');
};

module.exports = {
  initCronJobs,
  markOverdueAppointmentsAsNoShow,
  sendUpcomingAppointmentReminders,
};
