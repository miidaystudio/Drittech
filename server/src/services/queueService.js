const QueueEntry = require('../models/QueueEntry');
const Department = require('../models/Department');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { getIO } = require('../config/socket');
const { estimateWaitTime } = require('./waitTimeEstimator');
const { sendNotification } = require('./notificationService');
const { logAudit } = require('./auditService');

/**
 * Helper to get today's date formatted as YYYY-MM-DD
 */
const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Generate next date-scoped token for department
 */
const generateTokenNumber = async (clinicId, departmentId, queueDate) => {
  const department = await Department.findById(departmentId);
  const prefix = department ? department.code.charAt(0).toUpperCase() : 'A';

  const count = await QueueEntry.countDocuments({
    clinicId,
    departmentId,
    queueDate,
  });

  const nextSequence = count + 1;
  const tokenNumber = `${prefix}-${String(nextSequence).padStart(3, '0')}`;
  return { tokenNumber, sequenceNumber: nextSequence };
};

/**
 * Recalculate queue wait estimates and broadcast updates to connected clients
 */
const recalculateQueue = async (clinicId, departmentId, queueDate) => {
  const activeEntries = await QueueEntry.find({
    clinicId,
    departmentId,
    queueDate,
    status: 'waiting',
  })
    .sort({ sequenceNumber: 1 })
    .populate('patientId', 'fullName phone email')
    .populate('doctorId', 'userId specialty roomNumber');

  for (let index = 0; index < activeEntries.length; index++) {
    const entry = activeEntries[index];
    const patientsAhead = index;

    const waitEstimate = await estimateWaitTime({
      clinicId,
      departmentId,
      doctorId: entry.doctorId?._id,
      patientsAhead,
      priority: entry.priority,
    });

    entry.patientsAhead = patientsAhead;
    entry.estimatedWaitMinutes = waitEstimate.estimatedMinutes;
    await entry.save();

    // Check if turn is approaching (~15 minutes or less)
    if (waitEstimate.estimatedMinutes <= 15 && waitEstimate.estimatedMinutes > 0) {
      const idempotencyKey = `turn_approaching_${entry._id}_${queueDate}`;
      sendNotification({
        clinicId,
        patientId: entry.patientId?._id,
        type: 'turn_approaching',
        title: 'Your Turn is Approaching',
        message: `Token ${entry.tokenNumber}: Estimated wait is now ~${waitEstimate.estimatedMinutes} minutes. Please stay near the consultation area.`,
        metadata: {
          queueEntryId: entry._id,
          tokenNumber: entry.tokenNumber,
          estimatedWaitMinutes: waitEstimate.estimatedMinutes,
          trackingToken: entry.trackingToken,
        },
        idempotencyKey,
        recipientEmail: entry.patientId?.email,
        recipientPhone: entry.patientId?.phone,
      }).catch((e) => console.error('[Notification Trigger Error]', e.message));
    }
  }

  // Real-time broadcast
  try {
    const io = getIO();
    io.to(`clinic:${clinicId}`).emit('queue:updated', { departmentId, queueDate });
    io.to(`department:${clinicId}:${departmentId}`).emit('queue:updated', { departmentId, queueDate });
  } catch (wsErr) {
    // ws server active check
  }
};

/**
 * Register patient to queue
 */
const addToQueue = async ({
  clinicId,
  departmentId,
  doctorId = null,
  patientId,
  appointmentId = null,
  priority = 'normal',
  entryType = 'walk_in',
  notes = '',
  req = null,
}) => {
  const queueDate = getTodayDateString();

  // Generate date-scoped token
  const { tokenNumber, sequenceNumber } = await generateTokenNumber(
    clinicId,
    departmentId,
    queueDate
  );

  // Initial wait time calculation
  const waitingCount = await QueueEntry.countDocuments({
    clinicId,
    departmentId,
    queueDate,
    status: 'waiting',
  });

  const waitEst = await estimateWaitTime({
    clinicId,
    departmentId,
    doctorId,
    patientsAhead: waitingCount,
    priority,
  });

  const entry = await QueueEntry.create({
    clinicId,
    departmentId,
    doctorId,
    patientId,
    appointmentId,
    tokenNumber,
    sequenceNumber,
    queueDate,
    priority,
    entryType,
    patientsAhead: waitingCount,
    estimatedWaitMinutes: waitEst.estimatedMinutes,
    notes,
  });

  const populated = await QueueEntry.findById(entry._id)
    .populate('patientId', 'fullName patientIdentifier phone email gender age')
    .populate('departmentId', 'name code')
    .populate('doctorId');

  // Trigger registration notification
  const patient = populated.patientId;
  sendNotification({
    clinicId,
    patientId: patient._id,
    type: 'queue_joined',
    title: `Queue Token Generated: ${tokenNumber}`,
    message: `You are in queue for ${populated.departmentId?.name || 'Consultation'}. Token: ${tokenNumber}. Estimated wait: ~${waitEst.estimatedMinutes} mins.`,
    metadata: {
      queueEntryId: entry._id,
      tokenNumber,
      estimatedWaitMinutes: waitEst.estimatedMinutes,
      trackingToken: entry.trackingToken,
    },
    idempotencyKey: `queue_joined_${entry._id}`,
    recipientEmail: patient?.email,
    recipientPhone: patient?.phone,
  }).catch((e) => console.error(e.message));

  // Audit log
  logAudit({
    clinicId,
    userId: req?.user?.id,
    userRole: req?.user?.role || 'receptionist',
    action: 'QUEUE_REGISTER_PATIENT',
    resourceType: 'QueueEntry',
    resourceId: entry._id.toString(),
    details: { tokenNumber, patientId, departmentId },
    req,
  });

  // Broadcast WebSocket event
  try {
    const io = getIO();
    io.to(`clinic:${clinicId}`).emit('queue:entry-created', populated);
    io.to(`department:${clinicId}:${departmentId}`).emit('queue:entry-created', populated);
  } catch (err) {}

  return populated;
};

/**
 * Doctor calls the next eligible patient atomically
 */
const callNextPatient = async ({ clinicId, departmentId, doctorId, req = null }) => {
  const queueDate = getTodayDateString();

  // Concurrency check: atomically find and update the first waiting patient
  const filter = {
    clinicId,
    queueDate,
    status: 'waiting',
  };

  if (departmentId) {
    filter.departmentId = departmentId;
  }
  if (doctorId) {
    // Look for entries specifically assigned to doctor or unassigned in department
    filter.$or = [{ doctorId }, { doctorId: null }];
  }

  const nextEntry = await QueueEntry.findOneAndUpdate(
    filter,
    {
      $set: {
        status: 'called',
        doctorId,
        calledTime: new Date(),
      },
    },
    { sort: { priority: -1, sequenceNumber: 1 }, new: true }
  )
    .populate('patientId', 'fullName patientIdentifier phone email gender age bloodGroup allergies')
    .populate('departmentId', 'name code')
    .populate({
      path: 'doctorId',
      populate: { path: 'userId', select: 'name' },
    });

  if (!nextEntry) {
    return null;
  }

  // Update doctor's current active status
  if (doctorId) {
    await Doctor.findByIdAndUpdate(doctorId, {
      currentPatientId: nextEntry.patientId?._id,
      currentQueueEntryId: nextEntry._id,
    });
  }

  // Notify patient they are called
  const patient = nextEntry.patientId;
  sendNotification({
    clinicId,
    patientId: patient?._id,
    type: 'patient_called',
    title: 'Your Turn! Please Proceed to Consultation',
    message: `Token ${nextEntry.tokenNumber} has been called by Dr. ${nextEntry.doctorId?.userId?.name || 'Physician'}. Please enter room ${nextEntry.doctorId?.roomNumber || 'Consultation Room'}.`,
    metadata: {
      queueEntryId: nextEntry._id,
      tokenNumber: nextEntry.tokenNumber,
      trackingToken: nextEntry.trackingToken,
    },
    recipientEmail: patient?.email,
    recipientPhone: patient?.phone,
  }).catch((e) => console.error(e.message));

  // Real-time broadcast for waiting room TV display and receptionist
  try {
    const io = getIO();
    const payload = {
      entry: nextEntry,
      tokenNumber: nextEntry.tokenNumber,
      departmentId: nextEntry.departmentId?._id,
      departmentName: nextEntry.departmentId?.name,
      doctorName: nextEntry.doctorId?.userId?.name || 'Attending Doctor',
      roomNumber: nextEntry.doctorId?.roomNumber || 'Room 101',
      calledTime: nextEntry.calledTime,
    };
    io.to(`clinic:${clinicId}`).emit('queue:patient-called', payload);
    io.to(`department:${clinicId}:${nextEntry.departmentId?._id}`).emit('queue:patient-called', payload);
    io.to(`token:${nextEntry.trackingToken}`).emit('queue:patient-called', payload);
  } catch (err) {}

  // Recalculate remaining wait times
  recalculateQueue(clinicId, nextEntry.departmentId?._id, queueDate);

  // Audit log
  logAudit({
    clinicId,
    userId: req?.user?.id,
    userRole: req?.user?.role || 'doctor',
    action: 'QUEUE_CALL_PATIENT',
    resourceType: 'QueueEntry',
    resourceId: nextEntry._id.toString(),
    details: { tokenNumber: nextEntry.tokenNumber, doctorId },
    req,
  });

  return nextEntry;
};

/**
 * Update Queue Entry Status (e.g., in_consultation, completed, skipped, cancelled)
 */
const updateQueueStatus = async ({ entryId, status, doctorId = null, req = null }) => {
  const entry = await QueueEntry.findById(entryId);
  if (!entry) {
    throw new Error('Queue entry not found');
  }

  // Enforce state transition rules
  if (['completed', 'cancelled'].includes(entry.status) && ['waiting', 'called'].includes(status)) {
    throw new Error(`Cannot transition queue entry from ${entry.status} back to ${status}`);
  }

  entry.status = status;
  if (status === 'in_consultation') {
    entry.consultationStartTime = new Date();
  } else if (status === 'completed') {
    entry.completedTime = new Date();
  }

  if (doctorId && !entry.doctorId) {
    entry.doctorId = doctorId;
  }

  await entry.save();

  // If completed or skipped, clear doctor's current patient if matched
  if (['completed', 'skipped', 'cancelled'].includes(status) && entry.doctorId) {
    await Doctor.findByIdAndUpdate(entry.doctorId, {
      currentPatientId: null,
      currentQueueEntryId: null,
    });
  }

  const populated = await QueueEntry.findById(entry._id)
    .populate('patientId', 'fullName patientIdentifier phone email gender age')
    .populate('departmentId', 'name code')
    .populate({
      path: 'doctorId',
      populate: { path: 'userId', select: 'name' },
    });

  // Broadcast update
  try {
    const io = getIO();
    io.to(`clinic:${entry.clinicId}`).emit('queue:updated', populated);
    io.to(`department:${entry.clinicId}:${entry.departmentId}`).emit('queue:updated', populated);
    io.to(`token:${entry.trackingToken}`).emit('queue:updated', populated);
  } catch (err) {}

  // Recalculate remaining wait times
  recalculateQueue(entry.clinicId, entry.departmentId, entry.queueDate);

  // Audit log
  logAudit({
    clinicId: entry.clinicId,
    userId: req?.user?.id,
    userRole: req?.user?.role || 'staff',
    action: `QUEUE_STATUS_${status.toUpperCase()}`,
    resourceType: 'QueueEntry',
    resourceId: entry._id.toString(),
    details: { status, tokenNumber: entry.tokenNumber },
    req,
  });

  return populated;
};

module.exports = {
  getTodayDateString,
  generateTokenNumber,
  recalculateQueue,
  addToQueue,
  callNextPatient,
  updateQueueStatus,
};
