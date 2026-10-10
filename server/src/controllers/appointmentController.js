const Appointment = require('../models/Appointment');
const { addToQueue } = require('../services/queueService');
const { logAudit } = require('../services/auditService');

const getAppointments = async (req, res, next) => {
  try {
    const clinicId = req.user.role === 'super_admin' ? (req.query.clinicId || req.user.clinicId) : req.user.clinicId;
    const { status, date, doctorId, page = 1, limit = 20 } = req.query;

    const query = clinicId ? { clinicId } : {};
    if (status) query.status = status;
    if (doctorId) query.doctorId = doctorId;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .sort({ appointmentDate: 1, slotTime: 1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .populate('patientId', 'fullName patientIdentifier phone email gender age')
        .populate({
          path: 'doctorId',
          populate: { path: 'userId', select: 'name' },
        })
        .populate('departmentId', 'name code'),
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

const createAppointment = async (req, res, next) => {
  try {
    const clinicId = req.user.clinicId || req.body.clinicId;
    const { patientId, doctorId, departmentId, appointmentDate, slotTime, type = 'consultation', reasonForVisit } = req.body;

    const appointment = await Appointment.create({
      clinicId,
      patientId,
      doctorId,
      departmentId,
      appointmentDate: new Date(appointmentDate),
      slotTime,
      type,
      reasonForVisit,
      status: 'scheduled',
    });

    const populated = await Appointment.findById(appointment._id)
      .populate('patientId', 'fullName patientIdentifier phone email')
      .populate('departmentId', 'name code')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } });

    res.status(201).json({ success: true, message: 'Appointment booked successfully', data: populated });
  } catch (error) {
    next(error);
  }
};

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

module.exports = {
  getAppointments,
  createAppointment,
  checkInAppointment,
};
