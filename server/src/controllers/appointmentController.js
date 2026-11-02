const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Department = require('../models/Department');
const Clinic = require('../models/Clinic');
const AppointmentType = require('../models/AppointmentType');
const ClinicSchedulingPolicy = require('../models/ClinicSchedulingPolicy');
const { addToQueue } = require('../services/queueService');
const { logAudit } = require('../services/auditService');
const { sendNotification } = require('../services/notificationService');
const { getIO } = require('../config/socket');
const { buildSlotDateTime, getClinicPolicy } = require('../services/schedulingService');

/**
 * GET /api/v1/appointments
 * List appointments with role-scoped ownership and multi-field filtering
 */
const getAppointments = async (req, res, next) => {
  try {
    const clinicId = req.user.role === 'super_admin' ? (req.query.clinicId || req.user.clinicId) : req.user.clinicId;
    const {
      status,
      date,
      startDate,
      endDate,
      doctorId,
      departmentId,
      patientId,
      type,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const query = clinicId ? { clinicId } : {};

    // 1. Patient role ownership check: Patient can ONLY see their own records
    if (req.user.role === 'patient') {
      const patientProfile = await Patient.findOne({
        $or: [{ userId: req.user.id }, { email: req.user.email }],
      });
      if (!patientProfile) {
        return res.json({ success: true, data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
      }
      query.patientId = patientProfile._id;
    } else if (patientId) {
      query.patientId = patientId;
    }

    // 2. Doctor role scoping: If doctor is querying personal view
    if (req.user.role === 'doctor' && !doctorId) {
      const doctorProfile = await Doctor.findOne({ userId: req.user.id });
      if (doctorProfile) {
        query.doctorId = doctorProfile._id;
      }
    } else if (doctorId) {
      query.doctorId = doctorId;
    }

    if (departmentId) query.departmentId = departmentId;
    if (type) query.type = type;

    // 3. Status filtering (handle comma-separated statuses like 'confirmed,scheduled')
    if (status) {
      if (status.includes(',')) {
        query.status = { $in: status.split(',') };
      } else {
        query.status = status;
      }
    }

    // 4. Date range or single date filtering
    if (date) {
      const [year, month, day] = date.split('-').map(Number);
      const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
      const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
      query.$or = [
        { appointmentDate: { $gte: startOfDay, $lte: endOfDay } },
        { startTime: { $gte: startOfDay, $lte: endOfDay } },
      ];
    } else if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
      query.appointmentDate = dateFilter;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .sort({ appointmentDate: 1, slotTime: 1, startTime: 1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .populate('patientId', 'fullName patientIdentifier phone email gender age dateOfBirth')
        .populate({
          path: 'doctorId',
          populate: { path: 'userId', select: 'name email phone' },
        })
        .populate('departmentId', 'name code')
        .populate('typeId', 'name code durationMinutes color')
        .populate('queueEntryId', 'tokenNumber sequenceNumber status estimatedWaitMinutes'),
      Appointment.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: appointments,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/appointments/:id
 */
const getAppointmentById = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId')
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name email phone' },
      })
      .populate('departmentId')
      .populate('typeId')
      .populate('queueEntryId');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Patient ownership verification
    if (req.user.role === 'patient') {
      const patientProfile = await Patient.findOne({
        $or: [{ userId: req.user.id }, { email: req.user.email }],
      });
      if (!patientProfile || appointment.patientId._id.toString() !== patientProfile._id.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied to this appointment' });
      }
    }

    res.json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/appointments
 * Atomic slot booking with race condition lock & policy validations
 */
const createAppointment = async (req, res, next) => {
  try {
    const clinicId = req.user.clinicId || req.body.clinicId;
    let {
      patientId,
      doctorId,
      departmentId,
      appointmentDate,
      slotTime,
      typeId,
      type = 'consultation',
      reasonForVisit,
      source = 'portal',
      idempotencyKey,
    } = req.body;

    if (!doctorId || !appointmentDate || !slotTime) {
      return res.status(400).json({
        success: false,
        message: 'doctorId, appointmentDate, and slotTime are required',
      });
    }

    // 1. Idempotency Check
    if (idempotencyKey) {
      const existing = await Appointment.findOne({ idempotencyKey })
        .populate('patientId', 'fullName patientIdentifier phone email')
        .populate('departmentId', 'name code')
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } });
      if (existing) {
        return res.status(200).json({
          success: true,
          message: 'Appointment already processed (idempotent)',
          data: existing,
        });
      }
    }

    // 2. Resolve Patient if patient is booking for themselves
    if (req.user.role === 'patient') {
      let patient = await Patient.findOne({
        $or: [{ userId: req.user.id }, { email: req.user.email }],
      });
      if (!patient) {
        // Create auto-patient profile if needed
        patient = await Patient.create({
          clinicId,
          userId: req.user.id,
          fullName: req.user.name,
          email: req.user.email,
          phone: req.body.phone || '+1 (555) 000-0000',
          patientIdentifier: `PAT-${Date.now().toString().slice(-6)}`,
        });
      }
      patientId = patient._id;
      source = 'portal';
    } else {
      if (!patientId) {
        return res.status(400).json({ success: false, message: 'patientId is required' });
      }
    }

    // 3. Resolve Department from Doctor if not passed
    const doctor = await Doctor.findById(doctorId).populate('userId', 'name');
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    if (!departmentId) {
      departmentId = doctor.departmentId;
    }

    // 4. Determine Slot Duration & Times
    let durationMinutes = 15;
    if (typeId) {
      const aptType = await AppointmentType.findById(typeId);
      if (aptType) {
        durationMinutes = aptType.durationMinutes;
        type = aptType.name;
      }
    } else {
      durationMinutes = doctor.avgConsultationMinutes || 15;
    }

    const dateStr = typeof appointmentDate === 'string' && appointmentDate.includes('T')
      ? appointmentDate.split('T')[0]
      : appointmentDate;

    const startTime = buildSlotDateTime(dateStr, slotTime);
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

    // 5. Booking Policy Checks
    const policy = await getClinicPolicy(clinicId);
    const now = new Date();

    // Check minimum lead time
    const minLeadCutoff = new Date(now.getTime() + policy.minLeadTimeHours * 60 * 60 * 1000);
    if (startTime < minLeadCutoff && req.user.role === 'patient') {
      return res.status(400).json({
        success: false,
        message: `Booking must be made at least ${policy.minLeadTimeHours} hour(s) in advance.`,
      });
    }

    // Check advance booking cutoff
    const maxAdvanceDate = new Date();
    maxAdvanceDate.setDate(maxAdvanceDate.getDate() + policy.advanceBookingDays);
    if (startTime > maxAdvanceDate) {
      return res.status(400).json({
        success: false,
        message: `Appointments can only be booked up to ${policy.advanceBookingDays} days in advance.`,
      });
    }

    // 6. Check Patient Conflicting Overlapping Appointments
    const conflictingPatientApt = await Appointment.findOne({
      patientId,
      status: { $in: ['pending', 'confirmed', 'scheduled', 'checked_in', 'in_consultation', 'in_progress'] },
      $or: [
        { startTime: { $lt: endTime, $gte: startTime } },
        { endTime: { $gt: startTime, $lte: endTime } },
        { startTime: { $lte: startTime }, endTime: { $gte: endTime } },
      ],
    });
    if (conflictingPatientApt) {
      return res.status(400).json({
        success: false,
        message: 'You already have another active appointment scheduled during this time slot.',
      });
    }

    // 7. Atomic Concurrency Lock: Check if doctor slot is occupied
    const activeDoctorBooking = await Appointment.findOne({
      doctorId,
      status: { $in: ['pending', 'confirmed', 'scheduled', 'checked_in', 'in_consultation', 'in_progress'] },
      $or: [
        { startTime: { $lt: endTime, $gte: startTime } },
        { endTime: { $gt: startTime, $lte: endTime } },
        { startTime: { $lte: startTime }, endTime: { $gte: endTime } },
      ],
    });

    if (activeDoctorBooking) {
      return res.status(409).json({
        success: false,
        message: 'This time slot was just booked by another patient. Please select an alternate slot.',
      });
    }

    // 8. Create Appointment
    let appointment;
    try {
      appointment = await Appointment.create({
        clinicId,
        patientId,
        doctorId,
        departmentId,
        appointmentDate: new Date(dateStr),
        slotTime,
        startTime,
        endTime,
        typeId: typeId || null,
        type,
        reasonForVisit: reasonForVisit || '',
        source,
        createdBy: req.user.id,
        status: 'confirmed',
        idempotencyKey: idempotencyKey || null,
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'Concurrent conflict: This slot has just been reserved. Please choose another time.',
        });
      }
      throw err;
    }

    const populated = await Appointment.findById(appointment._id)
      .populate('patientId', 'fullName patientIdentifier phone email gender age dateOfBirth')
      .populate('departmentId', 'name code')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email phone' } })
      .populate('typeId', 'name durationMinutes color');

    // 9. Real-time Socket.IO Broadcast
    try {
      const io = getIO();
      // Lock slot in live calendars & wizards
      io.to(`clinic:${clinicId}`).emit('slot:locked', {
        doctorId,
        date: dateStr,
        slotTime,
        startTime: startTime.toISOString(),
      });
      io.to(`clinic:${clinicId}`).emit('appointment:created', populated);
      if (doctor.userId) {
        io.to(`user:${doctor.userId._id || doctor.userId}`).emit('appointment:created', populated);
      }
    } catch (wsErr) {}

    // 10. Audit Logging
    logAudit({
      clinicId,
      userId: req.user.id,
      userRole: req.user.role,
      action: 'BOOK_APPOINTMENT',
      resourceType: 'Appointment',
      resourceId: appointment._id.toString(),
      details: {
        doctorId,
        patientId,
        slotTime,
        date: dateStr,
        source,
      },
      req,
    });

    // 11. Dispatch Confirmation Notification
    const patientDoc = await Patient.findById(patientId);
    if (patientDoc) {
      await sendNotification({
        clinicId,
        patientId: patientDoc._id,
        userId: patientDoc.userId || null,
        type: 'appointment_confirmed',
        title: 'Appointment Confirmed',
        message: `Your appointment with Dr. ${doctor.userId?.name || 'Physician'} is confirmed for ${dateStr} at ${slotTime}.`,
        idempotencyKey: `confirm_${appointment._id.toString()}`,
        recipientEmail: patientDoc.email || null,
        recipientPhone: patientDoc.phone || null,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/appointments/:id
 */
const updateAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const { reasonForVisit, type, typeId, status } = req.body;
    if (reasonForVisit !== undefined) appointment.reasonForVisit = reasonForVisit;
    if (type !== undefined) appointment.type = type;
    if (typeId !== undefined) appointment.typeId = typeId;
    if (status !== undefined) appointment.status = status;

    await appointment.save();

    const populated = await Appointment.findById(appointment._id)
      .populate('patientId')
      .populate('departmentId')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } });

    try {
      const io = getIO();
      io.to(`clinic:${appointment.clinicId}`).emit('appointment:updated', populated);
    } catch (e) {}

    res.json({ success: true, message: 'Appointment updated', data: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/appointments/:id/cancel
 * Cancel appointment with policy cutoff check and socket release
 */
const cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (['cancelled', 'completed', 'checked_in', 'in_consultation'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel appointment in '${appointment.status}' status`,
      });
    }

    // Role ownership & cancellation policy cutoff check
    const policy = await getClinicPolicy(appointment.clinicId);
    const now = new Date();
    const aptTime = appointment.startTime || appointment.appointmentDate;

    if (req.user.role === 'patient') {
      const cutoffTime = new Date(aptTime.getTime() - policy.cancellationCutoffHours * 60 * 60 * 1000);
      if (now > cutoffTime) {
        return res.status(400).json({
          success: false,
          message: `Appointments cannot be cancelled within ${policy.cancellationCutoffHours} hours of the scheduled time. Please call the clinic directly.`,
        });
      }
    }

    appointment.status = 'cancelled';
    appointment.cancelReason = req.body.reason || 'Cancelled by user';
    await appointment.save();

    // Release slot across connected live calendars
    try {
      const io = getIO();
      const dateStr = appointment.appointmentDate ? appointment.appointmentDate.toISOString().split('T')[0] : '';
      io.to(`clinic:${appointment.clinicId}`).emit('slot:released', {
        doctorId: appointment.doctorId?._id,
        date: dateStr,
        slotTime: appointment.slotTime,
      });
      io.to(`clinic:${appointment.clinicId}`).emit('appointment:cancelled', { id: appointment._id });
    } catch (wsErr) {}

    logAudit({
      clinicId: appointment.clinicId,
      userId: req.user.id,
      userRole: req.user.role,
      action: 'CANCEL_APPOINTMENT',
      resourceType: 'Appointment',
      resourceId: appointment._id.toString(),
      details: { reason: appointment.cancelReason },
      req,
    });

    if (appointment.patientId) {
      await sendNotification({
        clinicId: appointment.clinicId,
        patientId: appointment.patientId._id,
        userId: appointment.patientId.userId || null,
        type: 'appointment_cancelled',
        title: 'Appointment Cancelled',
        message: `Your appointment on ${appointment.slotTime} has been cancelled.`,
        idempotencyKey: `cancel_${appointment._id.toString()}`,
        recipientEmail: appointment.patientId.email || null,
        recipientPhone: appointment.patientId.phone || null,
      });
    }

    res.json({ success: true, message: 'Appointment cancelled successfully', data: appointment });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/appointments/:id/reschedule
 * Atomically reschedule an appointment to a new date/slot
 */
const rescheduleAppointment = async (req, res, next) => {
  try {
    const oldAppointment = await Appointment.findById(req.params.id);
    if (!oldAppointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (['cancelled', 'completed', 'checked_in', 'in_consultation'].includes(oldAppointment.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reschedule appointment with status '${oldAppointment.status}'`,
      });
    }

    const { newDoctorId, newAppointmentDate, newSlotTime, reason } = req.body;
    if (!newAppointmentDate || !newSlotTime) {
      return res.status(400).json({ success: false, message: 'newAppointmentDate and newSlotTime are required' });
    }

    const doctorId = newDoctorId || oldAppointment.doctorId;
    const dateStr = typeof newAppointmentDate === 'string' && newAppointmentDate.includes('T')
      ? newAppointmentDate.split('T')[0]
      : newAppointmentDate;

    const doctor = await Doctor.findById(doctorId);
    const durationMinutes = doctor?.avgConsultationMinutes || 15;
    const newStartTime = buildSlotDateTime(dateStr, newSlotTime);
    const newEndTime = new Date(newStartTime.getTime() + durationMinutes * 60 * 1000);

    // Concurrency check on new slot
    const slotConflict = await Appointment.findOne({
      doctorId,
      status: { $in: ['pending', 'confirmed', 'scheduled', 'checked_in', 'in_consultation', 'in_progress'] },
      $or: [
        { startTime: { $lt: newEndTime, $gte: newStartTime } },
        { endTime: { $gt: newStartTime, $lte: newEndTime } },
        { startTime: { $lte: newStartTime }, endTime: { $gte: newEndTime } },
      ],
    });

    if (slotConflict) {
      return res.status(409).json({
        success: false,
        message: 'The selected rescheduled slot is already occupied. Please pick another slot.',
      });
    }

    // Mark old as rescheduled
    oldAppointment.status = 'rescheduled';
    oldAppointment.cancelReason = reason || 'Rescheduled to new slot';
    await oldAppointment.save();

    // Create new appointment
    const newAppointment = await Appointment.create({
      clinicId: oldAppointment.clinicId,
      patientId: oldAppointment.patientId,
      doctorId,
      departmentId: doctor ? doctor.departmentId : oldAppointment.departmentId,
      appointmentDate: new Date(dateStr),
      slotTime: newSlotTime,
      startTime: newStartTime,
      endTime: newEndTime,
      typeId: oldAppointment.typeId,
      type: oldAppointment.type,
      reasonForVisit: oldAppointment.reasonForVisit,
      source: oldAppointment.source,
      createdBy: req.user.id,
      rescheduledFrom: oldAppointment._id,
      status: 'confirmed',
    });

    const populatedNew = await Appointment.findById(newAppointment._id)
      .populate('patientId')
      .populate('departmentId')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } });

    // Sockets emission
    try {
      const io = getIO();
      // Release old slot
      const oldDateStr = oldAppointment.appointmentDate ? oldAppointment.appointmentDate.toISOString().split('T')[0] : '';
      io.to(`clinic:${oldAppointment.clinicId}`).emit('slot:released', {
        doctorId: oldAppointment.doctorId,
        date: oldDateStr,
        slotTime: oldAppointment.slotTime,
      });
      // Lock new slot
      io.to(`clinic:${oldAppointment.clinicId}`).emit('slot:locked', {
        doctorId,
        date: dateStr,
        slotTime: newSlotTime,
      });
      io.to(`clinic:${oldAppointment.clinicId}`).emit('appointment:created', populatedNew);
      io.to(`clinic:${oldAppointment.clinicId}`).emit('appointment:updated', oldAppointment);
    } catch (wsErr) {}

    logAudit({
      clinicId: oldAppointment.clinicId,
      userId: req.user.id,
      userRole: req.user.role,
      action: 'RESCHEDULE_APPOINTMENT',
      resourceType: 'Appointment',
      resourceId: newAppointment._id.toString(),
      details: {
        fromAppointmentId: oldAppointment._id.toString(),
        newDate: dateStr,
        newSlotTime,
      },
      req,
    });

    res.json({
      success: true,
      message: 'Appointment successfully rescheduled',
      data: {
        oldAppointment,
        newAppointment: populatedNew,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/appointments/:id/check-in
 * Check-in appointment, transition status to checked_in, and assign Queue token
 */
const checkInAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId')
      .populate('departmentId')
      .populate('doctorId');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (appointment.status === 'checked_in') {
      return res.status(400).json({ success: false, message: 'Appointment is already checked in' });
    }

    // Add to Queue
    const queueEntry = await addToQueue({
      clinicId: appointment.clinicId,
      departmentId: appointment.departmentId._id,
      doctorId: appointment.doctorId?._id || null,
      patientId: appointment.patientId._id,
      appointmentId: appointment._id,
      entryType: 'appointment',
      priority: 'normal',
      notes: appointment.reasonForVisit || 'Scheduled Appointment Check-in',
      req,
    });

    appointment.status = 'checked_in';
    appointment.queueEntryId = queueEntry._id;
    await appointment.save();

    logAudit({
      clinicId: appointment.clinicId,
      userId: req.user.id,
      userRole: req.user.role,
      action: 'APPOINTMENT_CHECK_IN',
      resourceType: 'Appointment',
      resourceId: appointment._id.toString(),
      details: { tokenNumber: queueEntry.tokenNumber, patientId: appointment.patientId._id },
      req,
    });

    try {
      const io = getIO();
      io.to(`clinic:${appointment.clinicId}`).emit('appointment:updated', appointment);
    } catch (e) {}

    res.json({
      success: true,
      message: 'Patient checked in and queue token assigned',
      data: {
        appointment,
        queueEntry,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/appointments/:id/no-show
 */
const markNoShow = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    appointment.status = 'no_show';
    await appointment.save();

    logAudit({
      clinicId: appointment.clinicId,
      userId: req.user.id,
      userRole: req.user.role,
      action: 'MARK_NO_SHOW',
      resourceType: 'Appointment',
      resourceId: appointment._id.toString(),
      details: { reason: req.body.reason || 'Did not arrive' },
      req,
    });

    try {
      const io = getIO();
      io.to(`clinic:${appointment.clinicId}`).emit('appointment:updated', appointment);
    } catch (e) {}

    res.json({ success: true, message: 'Appointment marked as no-show', data: appointment });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  rescheduleAppointment,
  checkInAppointment,
  markNoShow,
};
