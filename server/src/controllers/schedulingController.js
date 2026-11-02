const {
  getAvailability,
  getCalendarDaysSummary,
  getClinicPolicy,
  getDoctorSchedule,
} = require('../services/schedulingService');
const DoctorSchedule = require('../models/DoctorSchedule');
const ScheduleException = require('../models/ScheduleException');
const AppointmentType = require('../models/AppointmentType');
const ClinicSchedulingPolicy = require('../models/ClinicSchedulingPolicy');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const { logAudit } = require('../services/auditService');
const { getIO } = require('../config/socket');

/**
 * GET /api/v1/scheduling/availability
 */
const getAvailabilityHandler = async (req, res, next) => {
  try {
    const clinicId = req.user?.clinicId || req.query.clinicId;
    if (!clinicId) {
      return res.status(400).json({ success: false, message: 'clinicId is required' });
    }

    const { doctorId, departmentId, date, from, to, appointmentTypeId } = req.query;

    const data = await getAvailability({
      clinicId,
      doctorId,
      departmentId,
      date,
      from,
      to,
      appointmentTypeId,
    });

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/scheduling/calendar-summary
 */
const getCalendarSummaryHandler = async (req, res, next) => {
  try {
    const clinicId = req.user?.clinicId || req.query.clinicId;
    if (!clinicId) {
      return res.status(400).json({ success: false, message: 'clinicId is required' });
    }

    const { doctorId, departmentId, month, year } = req.query;
    const now = new Date();
    const currentMonth = month || now.getMonth() + 1;
    const currentYear = year || now.getFullYear();

    const summary = await getCalendarDaysSummary({
      clinicId,
      doctorId,
      departmentId,
      month: currentMonth,
      year: currentYear,
    });

    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/scheduling/types
 */
const getAppointmentTypes = async (req, res, next) => {
  try {
    const clinicId = req.user?.clinicId || req.query.clinicId;
    const { departmentId, all } = req.query;

    const query = clinicId ? { clinicId } : {};
    if (!all) query.active = true;
    if (departmentId) {
      query.$or = [{ departmentId }, { departmentId: null }];
    }

    const types = await AppointmentType.find(query).sort({ durationMinutes: 1, name: 1 });
    res.json({ success: true, data: types });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/scheduling/types
 */
const createAppointmentType = async (req, res, next) => {
  try {
    const clinicId = req.user.clinicId || req.body.clinicId;
    const { name, code, durationMinutes, color, description, departmentId } = req.body;

    const type = await AppointmentType.create({
      clinicId,
      departmentId: departmentId || null,
      name,
      code: (code || name.slice(0, 4)).toUpperCase(),
      durationMinutes: durationMinutes || 15,
      color: color || '#2563EB',
      description: description || '',
      active: true,
    });

    logAudit({
      clinicId,
      userId: req.user.id,
      userRole: req.user.role,
      action: 'CREATE_APPOINTMENT_TYPE',
      resourceType: 'AppointmentType',
      resourceId: type._id.toString(),
      details: { name, durationMinutes },
      req,
    });

    res.status(201).json({ success: true, data: type });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/scheduling/types/:id
 */
const updateAppointmentType = async (req, res, next) => {
  try {
    const type = await AppointmentType.findById(req.params.id);
    if (!type) {
      return res.status(404).json({ success: false, message: 'Appointment type not found' });
    }

    const updates = req.body;
    ['name', 'code', 'durationMinutes', 'color', 'description', 'active', 'departmentId'].forEach((field) => {
      if (updates[field] !== undefined) type[field] = updates[field];
    });

    await type.save();
    res.json({ success: true, data: type });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/scheduling/doctor-schedule/:doctorId
 */
const getDoctorScheduleHandler = async (req, res, next) => {
  try {
    const clinicId = req.user.clinicId || req.query.clinicId;
    const schedule = await getDoctorSchedule(req.params.doctorId, clinicId);
    res.json({ success: true, data: schedule });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/scheduling/doctor-schedule
 */
const saveDoctorScheduleHandler = async (req, res, next) => {
  try {
    const clinicId = req.user.clinicId || req.body.clinicId;
    const { doctorId, weeklyHours, slotDuration, bufferMinutes, maxPerDay, timezone, isActive } = req.body;

    let schedule = await DoctorSchedule.findOne({ doctorId, clinicId });
    if (!schedule) {
      schedule = new DoctorSchedule({ doctorId, clinicId });
    }

    if (weeklyHours) schedule.weeklyHours = weeklyHours;
    if (slotDuration !== undefined) schedule.slotDuration = slotDuration;
    if (bufferMinutes !== undefined) schedule.bufferMinutes = bufferMinutes;
    if (maxPerDay !== undefined) schedule.maxPerDay = maxPerDay;
    if (timezone) schedule.timezone = timezone;
    if (isActive !== undefined) schedule.isActive = isActive;

    await schedule.save();

    logAudit({
      clinicId,
      userId: req.user.id,
      userRole: req.user.role,
      action: 'UPDATE_DOCTOR_SCHEDULE',
      resourceType: 'DoctorSchedule',
      resourceId: schedule._id.toString(),
      details: { doctorId, slotDuration, bufferMinutes },
      req,
    });

    try {
      const io = getIO();
      io.to(`clinic:${clinicId}`).emit('schedule:updated', { doctorId });
    } catch (e) {}

    res.json({ success: true, data: schedule });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/scheduling/exceptions
 */
const getExceptions = async (req, res, next) => {
  try {
    const clinicId = req.user?.clinicId || req.query.clinicId;
    const { doctorId } = req.query;

    const query = clinicId ? { clinicId } : {};
    if (doctorId) {
      query.$or = [{ doctorId }, { doctorId: null }];
    }

    const exceptions = await ScheduleException.find(query)
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
      .sort({ startDate: 1 });

    res.json({ success: true, data: exceptions });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/scheduling/exceptions
 */
const createException = async (req, res, next) => {
  try {
    const clinicId = req.user.clinicId || req.body.clinicId;
    const { doctorId, startDate, endDate, type, reason, customShifts } = req.body;

    const exception = await ScheduleException.create({
      clinicId,
      doctorId: doctorId || null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      type: type || 'leave',
      reason,
      customShifts: customShifts || [],
    });

    logAudit({
      clinicId,
      userId: req.user.id,
      userRole: req.user.role,
      action: 'CREATE_SCHEDULE_EXCEPTION',
      resourceType: 'ScheduleException',
      resourceId: exception._id.toString(),
      details: { doctorId, type, reason, startDate, endDate },
      req,
    });

    // Notify connected clients
    try {
      const io = getIO();
      io.to(`clinic:${clinicId}`).emit('schedule:exception:created', exception);
    } catch (e) {}

    res.status(201).json({ success: true, data: exception });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/scheduling/exceptions/:id
 */
const deleteException = async (req, res, next) => {
  try {
    const exception = await ScheduleException.findByIdAndDelete(req.params.id);
    if (!exception) {
      return res.status(404).json({ success: false, message: 'Exception not found' });
    }

    try {
      const io = getIO();
      io.to(`clinic:${exception.clinicId}`).emit('schedule:exception:deleted', { id: req.params.id });
    } catch (e) {}

    res.json({ success: true, message: 'Exception deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/scheduling/policy
 */
const getPolicyHandler = async (req, res, next) => {
  try {
    const clinicId = req.user?.clinicId || req.query.clinicId;
    const policy = await getClinicPolicy(clinicId);
    res.json({ success: true, data: policy });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/scheduling/policy
 */
const updatePolicyHandler = async (req, res, next) => {
  try {
    const clinicId = req.user.clinicId || req.body.clinicId;
    let policy = await ClinicSchedulingPolicy.findOne({ clinicId });
    if (!policy) {
      policy = new ClinicSchedulingPolicy({ clinicId });
    }

    const {
      advanceBookingDays,
      minLeadTimeHours,
      cancellationCutoffHours,
      autoNoShowGraceMinutes,
      overbookingLimit,
      timezone,
    } = req.body;

    if (advanceBookingDays !== undefined) policy.advanceBookingDays = advanceBookingDays;
    if (minLeadTimeHours !== undefined) policy.minLeadTimeHours = minLeadTimeHours;
    if (cancellationCutoffHours !== undefined) policy.cancellationCutoffHours = cancellationCutoffHours;
    if (autoNoShowGraceMinutes !== undefined) policy.autoNoShowGraceMinutes = autoNoShowGraceMinutes;
    if (overbookingLimit !== undefined) policy.overbookingLimit = overbookingLimit;
    if (timezone) policy.timezone = timezone;

    await policy.save();

    logAudit({
      clinicId,
      userId: req.user.id,
      userRole: req.user.role,
      action: 'UPDATE_SCHEDULING_POLICY',
      resourceType: 'ClinicSchedulingPolicy',
      resourceId: policy._id.toString(),
      details: req.body,
      req,
    });

    res.json({ success: true, data: policy });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/scheduling/analytics
 */
const getSchedulingAnalytics = async (req, res, next) => {
  try {
    const clinicId = req.user?.clinicId || req.query.clinicId;
    const { days = 14 } = req.query;

    const numDays = parseInt(days, 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - numDays);
    startDate.setHours(0, 0, 0, 0);

    const appointments = await Appointment.find({
      ...(clinicId ? { clinicId } : {}),
      appointmentDate: { $gte: startDate },
    }).populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } });

    // 1. Group bookings by date
    const dateMap = {};
    for (let i = 0; i <= numDays; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      dateMap[key] = {
        date: key,
        booked: 0,
        completed: 0,
        cancelled: 0,
        noShow: 0,
      };
    }

    let totalBooked = appointments.length;
    let totalCompleted = 0;
    let totalCancelled = 0;
    let totalNoShow = 0;

    const doctorCountMap = {};

    appointments.forEach((apt) => {
      const dKey = apt.appointmentDate ? apt.appointmentDate.toISOString().split('T')[0] : null;
      if (dKey && dateMap[dKey]) {
        dateMap[dKey].booked += 1;
        if (apt.status === 'completed') dateMap[dKey].completed += 1;
        if (apt.status === 'cancelled') dateMap[dKey].cancelled += 1;
        if (apt.status === 'no_show') dateMap[dKey].noShow += 1;
      }

      if (apt.status === 'completed') totalCompleted += 1;
      if (apt.status === 'cancelled') totalCancelled += 1;
      if (apt.status === 'no_show') totalNoShow += 1;

      // Doctor distribution
      const docName = apt.doctorId?.userId?.name ? `Dr. ${apt.doctorId.userId.name}` : 'Unassigned';
      if (!doctorCountMap[docName]) {
        doctorCountMap[docName] = { doctorName: docName, total: 0, completed: 0 };
      }
      doctorCountMap[docName].total += 1;
      if (apt.status === 'completed') doctorCountMap[docName].completed += 1;
    });

    const noShowRate = totalBooked > 0 ? Math.round((totalNoShow / totalBooked) * 100) : 0;
    const cancellationRate = totalBooked > 0 ? Math.round((totalCancelled / totalBooked) * 100) : 0;

    res.json({
      success: true,
      data: {
        dailyTrends: Object.values(dateMap),
        summary: {
          totalBooked,
          totalCompleted,
          totalCancelled,
          totalNoShow,
          noShowRate,
          cancellationRate,
        },
        doctorUtilization: Object.values(doctorCountMap),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAvailabilityHandler,
  getCalendarSummaryHandler,
  getAppointmentTypes,
  createAppointmentType,
  updateAppointmentType,
  getDoctorScheduleHandler,
  saveDoctorScheduleHandler,
  getExceptions,
  createException,
  deleteException,
  getPolicyHandler,
  updatePolicyHandler,
  getSchedulingAnalytics,
};
