const DoctorSchedule = require('../models/DoctorSchedule');
const ScheduleException = require('../models/ScheduleException');
const AppointmentType = require('../models/AppointmentType');
const ClinicSchedulingPolicy = require('../models/ClinicSchedulingPolicy');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Clinic = require('../models/Clinic');
const { getIO } = require('../config/socket');

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Format Date object to YYYY-MM-DD
 */
const formatDateKey = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Convert HH:MM time string to minutes from midnight
 */
const timeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

/**
 * Convert minutes from midnight to HH:MM format
 */
const minutesToTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

/**
 * Construct UTC Date from a date string (YYYY-MM-DD) and a time string (HH:MM)
 */
const buildSlotDateTime = (dateStr, timeStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  return new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));
};

/**
 * Get or create default clinic scheduling policy
 */
const getClinicPolicy = async (clinicId) => {
  let policy = await ClinicSchedulingPolicy.findOne({ clinicId });
  if (!policy) {
    policy = await ClinicSchedulingPolicy.create({
      clinicId,
      advanceBookingDays: 30,
      minLeadTimeHours: 2,
      cancellationCutoffHours: 4,
      autoNoShowGraceMinutes: 30,
      overbookingLimit: 0,
      timezone: 'America/New_York',
    });
  }
  return policy;
};

/**
 * Retrieve doctor schedule with fallback to doctor profile default
 */
const getDoctorSchedule = async (doctorId, clinicId) => {
  let schedule = await DoctorSchedule.findOne({ doctorId, clinicId });
  if (!schedule) {
    // Check doctor model schedule or create sensible default
    const doctor = await Doctor.findById(doctorId);
    const defaultWeeklyHours = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
    ].map((day) => ({
      day,
      isActive: true,
      shifts: [{ start: '09:00', end: '17:00' }],
      breaks: [{ start: '13:00', end: '14:00', label: 'Lunch Break' }],
    }));

    defaultWeeklyHours.push({
      day: 'Saturday',
      isActive: true,
      shifts: [{ start: '09:00', end: '13:00' }],
      breaks: [],
    });
    defaultWeeklyHours.push({
      day: 'Sunday',
      isActive: false,
      shifts: [],
      breaks: [],
    });

    schedule = await DoctorSchedule.create({
      clinicId,
      doctorId,
      weeklyHours: defaultWeeklyHours,
      slotDuration: doctor?.avgConsultationMinutes || 15,
      bufferMinutes: 5,
      maxPerDay: 25,
      timezone: 'America/New_York',
      isActive: true,
    });
  }
  return schedule;
};

/**
 * Check if a date has clinic-wide or doctor-specific exceptions
 */
const getExceptionsForDate = async (clinicId, doctorId, targetDate) => {
  const startOfDay = new Date(targetDate);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setUTCHours(23, 59, 59, 999);

  return ScheduleException.find({
    clinicId,
    $or: [{ doctorId: null }, { doctorId }],
    startDate: { $lte: endOfDay },
    endDate: { $gte: startOfDay },
  });
};

/**
 * Generate available time slots for a single doctor on a given date string (YYYY-MM-DD)
 */
const computeDoctorSlotsForDate = async ({
  clinicId,
  doctorId,
  dateStr,
  durationMinutes = null,
  policy = null,
}) => {
  if (!policy) {
    policy = await getClinicPolicy(clinicId);
  }

  const schedule = await getDoctorSchedule(doctorId, clinicId);
  if (!schedule.isActive) {
    return { availableSlots: [], reason: 'Doctor is not currently accepting appointments' };
  }

  // Parse target date
  const [year, month, day] = dateStr.split('-').map(Number);
  const targetDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const dayName = DAYS_OF_WEEK[targetDate.getUTCDay()];

  // Check advance booking policy
  const now = new Date();
  const maxAdvanceDate = new Date();
  maxAdvanceDate.setUTCDate(maxAdvanceDate.getUTCDate() + policy.advanceBookingDays);
  if (targetDate > maxAdvanceDate) {
    return { availableSlots: [], reason: `Booking opens only up to ${policy.advanceBookingDays} days in advance` };
  }

  // Check exceptions (holidays, leaves, custom hours)
  const exceptions = await getExceptionsForDate(clinicId, doctorId, targetDate);
  const isFullLeave = exceptions.some((e) => e.type === 'leave' || e.type === 'holiday');
  if (isFullLeave) {
    const leaveReason = exceptions.find((e) => e.type === 'leave' || e.type === 'holiday')?.reason || 'Leave/Holiday';
    return { availableSlots: [], isException: true, reason: leaveReason };
  }

  // Determine shifts for the day
  const customHoursException = exceptions.find((e) => e.type === 'custom_hours');
  let shifts = [];
  let breaks = [];

  if (customHoursException && customHoursException.customShifts?.length > 0) {
    shifts = customHoursException.customShifts;
  } else {
    const dayConfig = schedule.weeklyHours.find((w) => w.day === dayName);
    if (!dayConfig || !dayConfig.isActive || !dayConfig.shifts?.length) {
      return { availableSlots: [], reason: `Doctor does not practice on ${dayName}s` };
    }
    shifts = dayConfig.shifts;
    breaks = dayConfig.breaks || [];
  }

  // Determine slot duration & buffer
  const slotDuration = durationMinutes || schedule.slotDuration || 15;
  const bufferMinutes = schedule.bufferMinutes || 0;
  const step = slotDuration + bufferMinutes;

  // Retrieve existing booked appointments for the doctor on this day
  const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

  const bookedAppointments = await Appointment.find({
    doctorId,
    status: { $in: ['pending', 'confirmed', 'scheduled', 'checked_in', 'in_consultation', 'in_progress'] },
    $or: [
      { appointmentDate: { $gte: startOfDay, $lte: endOfDay } },
      { startTime: { $gte: startOfDay, $lte: endOfDay } },
    ],
  }).select('slotTime startTime endTime status');

  const bookedSlotTimes = new Set(
    bookedAppointments.map((a) => a.slotTime || (a.startTime ? minutesToTime(a.startTime.getUTCHours() * 60 + a.startTime.getUTCMinutes()) : null)).filter(Boolean)
  );

  // Minimum lead time cutoff
  const minLeadCutoff = new Date(now.getTime() + policy.minLeadTimeHours * 60 * 60 * 1000);

  const availableSlots = [];

  for (const shift of shifts) {
    const shiftStartMins = timeToMinutes(shift.start);
    const shiftEndMins = timeToMinutes(shift.end);

    for (let currentMins = shiftStartMins; currentMins + slotDuration <= shiftEndMins; currentMins += step) {
      const slotEndMins = currentMins + slotDuration;
      const slotTimeStr = minutesToTime(currentMins);
      const slotEndTimeStr = minutesToTime(slotEndMins);

      // Check if slot overlaps with any scheduled break
      const inBreak = breaks.some((b) => {
        const breakStart = timeToMinutes(b.start);
        const breakEnd = timeToMinutes(b.end);
        return currentMins < breakEnd && slotEndMins > breakStart;
      });
      if (inBreak) continue;

      // Check if slot is already booked
      if (bookedSlotTimes.has(slotTimeStr)) continue;

      // Check lead time cutoff
      const slotUTC = buildSlotDateTime(dateStr, slotTimeStr);
      if (slotUTC < minLeadCutoff) continue;

      availableSlots.push({
        slotTime: slotTimeStr,
        endTime: slotEndTimeStr,
        startTimeUTC: slotUTC.toISOString(),
        endTimeUTC: buildSlotDateTime(dateStr, slotEndTimeStr).toISOString(),
        durationMinutes: slotDuration,
        available: true,
      });
    }
  }

  return {
    doctorId,
    date: dateStr,
    dayName,
    availableSlots,
    totalAvailable: availableSlots.length,
  };
};

/**
 * Query availability across doctors, department, or date range
 */
const getAvailability = async ({
  clinicId,
  doctorId = null,
  departmentId = null,
  date = null,
  from = null,
  to = null,
  appointmentTypeId = null,
}) => {
  const policy = await getClinicPolicy(clinicId);

  // Determine appointment duration if type is specified
  let durationMinutes = null;
  if (appointmentTypeId) {
    const aptType = await AppointmentType.findById(appointmentTypeId);
    if (aptType) durationMinutes = aptType.durationMinutes;
  }

  // Determine list of doctors
  let doctors = [];
  if (doctorId) {
    const doc = await Doctor.findById(doctorId).populate('userId', 'name email');
    if (doc) doctors.push(doc);
  } else if (departmentId) {
    doctors = await Doctor.find({ clinicId, departmentId, isAvailable: true }).populate('userId', 'name email');
  } else {
    doctors = await Doctor.find({ clinicId, isAvailable: true }).populate('userId', 'name email');
  }

  // Determine dates list
  const dates = [];
  if (date) {
    dates.push(date);
  } else if (from && to) {
    const startDate = new Date(from);
    const endDate = new Date(to);
    const cur = new Date(startDate);
    while (cur <= endDate && dates.length < 60) {
      dates.push(formatDateKey(cur));
      cur.setDate(cur.getDate() + 1);
    }
  } else {
    // Default to next 14 days
    const cur = new Date();
    for (let i = 0; i < 14; i++) {
      dates.push(formatDateKey(cur));
      cur.setDate(cur.getDate() + 1);
    }
  }

  const results = [];

  for (const dateItem of dates) {
    const dateResults = {
      date: dateItem,
      doctors: [],
      hasAvailability: false,
    };

    for (const doc of doctors) {
      const slotInfo = await computeDoctorSlotsForDate({
        clinicId,
        doctorId: doc._id,
        dateStr: dateItem,
        durationMinutes,
        policy,
      });

      if (slotInfo.availableSlots?.length > 0) {
        dateResults.hasAvailability = true;
      }

      dateResults.doctors.push({
        doctorId: doc._id,
        doctorName: doc.userId?.name || 'Physician',
        specialty: doc.specialty,
        roomNumber: doc.roomNumber,
        departmentId: doc.departmentId,
        slots: slotInfo.availableSlots || [],
        reason: slotInfo.reason,
        isException: slotInfo.isException || false,
      });
    }

    results.push(dateResults);
  }

  return {
    clinicId,
    policy: {
      advanceBookingDays: policy.advanceBookingDays,
      minLeadTimeHours: policy.minLeadTimeHours,
      cancellationCutoffHours: policy.cancellationCutoffHours,
      timezone: policy.timezone,
    },
    dates: results,
  };
};

/**
 * Get date-level availability summary for calendar pickers (which days have slots vs blocked)
 */
const getCalendarDaysSummary = async ({ clinicId, doctorId = null, departmentId = null, month, year }) => {
  const policy = await getClinicPolicy(clinicId);
  const parsedYear = parseInt(year, 10);
  const parsedMonth = parseInt(month, 10); // 1-12

  const daysInMonth = new Date(parsedYear, parsedMonth, 0).getDate();
  const summary = {};

  const from = `${parsedYear}-${String(parsedMonth).padStart(2, '0')}-01`;
  const to = `${parsedYear}-${String(parsedMonth).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

  const availability = await getAvailability({
    clinicId,
    doctorId,
    departmentId,
    from,
    to,
  });

  for (const dayData of availability.dates) {
    const totalSlots = dayData.doctors.reduce((sum, d) => sum + (d.slots?.length || 0), 0);
    summary[dayData.date] = {
      hasAvailability: totalSlots > 0,
      totalSlots,
    };
  }

  return summary;
};

module.exports = {
  getClinicPolicy,
  getDoctorSchedule,
  computeDoctorSlotsForDate,
  getAvailability,
  getCalendarDaysSummary,
  buildSlotDateTime,
  formatDateKey,
};
