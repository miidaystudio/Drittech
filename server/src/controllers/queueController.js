const QueueEntry = require('../models/QueueEntry');
const Clinic = require('../models/Clinic');
const Department = require('../models/Department');
const Doctor = require('../models/Doctor');
const {
  getTodayDateString,
  addToQueue,
  callNextPatient,
  updateQueueStatus,
  recalculateQueue,
} = require('../services/queueService');
const { getIO } = require('../config/socket');

const getQueue = async (req, res, next) => {
  try {
    const clinicId = req.user.role === 'super_admin' ? (req.query.clinicId || req.user.clinicId) : req.user.clinicId;
    const { departmentId, doctorId, status, date } = req.query;

    const queueDate = date || getTodayDateString();
    const query = { queueDate };

    if (clinicId) query.clinicId = clinicId;
    if (departmentId) query.departmentId = departmentId;
    if (doctorId) query.doctorId = doctorId;
    if (status) query.status = status;

    const entries = await QueueEntry.find(query)
      .sort({ sequenceNumber: 1 })
      .populate('patientId', 'fullName patientIdentifier phone email gender age bloodGroup')
      .populate('departmentId', 'name code')
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name' },
      });

    res.json({
      success: true,
      data: entries,
      queueDate,
    });
  } catch (error) {
    next(error);
  }
};

const createQueueEntry = async (req, res, next) => {
  try {
    const clinicId = req.user.clinicId || req.body.clinicId;
    const { departmentId, doctorId, patientId, priority, entryType, notes } = req.body;

    const entry = await addToQueue({
      clinicId,
      departmentId,
      doctorId,
      patientId,
      priority,
      entryType,
      notes,
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Patient added to queue successfully',
      data: entry,
    });
  } catch (error) {
    next(error);
  }
};

const callNext = async (req, res, next) => {
  try {
    const clinicId = req.user.clinicId || req.body.clinicId;
    const { departmentId, doctorId } = req.body;

    // If caller is doctor, find their doctor profile ID
    let effectiveDoctorId = doctorId;
    if (req.user.role === 'doctor' && !effectiveDoctorId) {
      const doc = await Doctor.findOne({ userId: req.user.id });
      if (doc) effectiveDoctorId = doc._id;
    }

    const calledEntry = await callNextPatient({
      clinicId,
      departmentId,
      doctorId: effectiveDoctorId,
      req,
    });

    if (!calledEntry) {
      return res.status(200).json({
        success: true,
        message: 'No eligible waiting patients in queue',
        data: null,
      });
    }

    res.json({
      success: true,
      message: `Token ${calledEntry.tokenNumber} called`,
      data: calledEntry,
    });
  } catch (error) {
    next(error);
  }
};

const recallPatient = async (req, res, next) => {
  try {
    const entry = await QueueEntry.findById(req.params.id)
      .populate('patientId', 'fullName phone email')
      .populate('departmentId', 'name code')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } });

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Queue entry not found' });
    }

    entry.calledTime = new Date();
    entry.status = 'called';
    await entry.save();

    // Broadcast recall
    try {
      const io = getIO();
      const payload = {
        entry,
        tokenNumber: entry.tokenNumber,
        departmentName: entry.departmentId?.name,
        doctorName: entry.doctorId?.userId?.name || 'Attending Doctor',
        roomNumber: entry.doctorId?.roomNumber || 'Room 101',
        isRecall: true,
      };
      io.to(`clinic:${entry.clinicId}`).emit('queue:patient-called', payload);
      io.to(`token:${entry.trackingToken}`).emit('queue:patient-called', payload);
    } catch (err) {}

    res.json({ success: true, message: `Token ${entry.tokenNumber} recalled`, data: entry });
  } catch (error) {
    next(error);
  }
};

const skipPatient = async (req, res, next) => {
  try {
    const updated = await updateQueueStatus({
      entryId: req.params.id,
      status: 'skipped',
      req,
    });
    res.json({ success: true, message: `Token ${updated.tokenNumber} marked as skipped`, data: updated });
  } catch (error) {
    next(error);
  }
};

const completePatient = async (req, res, next) => {
  try {
    const updated = await updateQueueStatus({
      entryId: req.params.id,
      status: 'completed',
      req,
    });
    res.json({ success: true, message: `Token ${updated.tokenNumber} marked as completed`, data: updated });
  } catch (error) {
    next(error);
  }
};

const trackToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    const entry = await QueueEntry.findOne({ trackingToken: token })
      .populate('clinicId', 'name address phone settings')
      .populate('departmentId', 'name code')
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name' },
      });

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Invalid tracking token or expired queue session',
      });
    }

    // Return sanitized data (Do NOT leak phone number, full address or sensitive health notes)
    const sanitizedData = {
      tokenNumber: entry.tokenNumber,
      status: entry.status,
      queueDate: entry.queueDate,
      patientsAhead: entry.patientsAhead,
      estimatedWaitMinutes: entry.estimatedWaitMinutes,
      checkInTime: entry.checkInTime,
      calledTime: entry.calledTime,
      consultationStartTime: entry.consultationStartTime,
      completedTime: entry.completedTime,
      clinic: {
        name: entry.clinicId?.name,
        phone: entry.clinicId?.phone,
        operatingHours: entry.clinicId?.settings?.operatingHours,
      },
      department: {
        name: entry.departmentId?.name,
        code: entry.departmentId?.code,
      },
      doctor: entry.doctorId
        ? {
            name: entry.doctorId.userId?.name,
            specialty: entry.doctorId.specialty,
            roomNumber: entry.doctorId.roomNumber,
          }
        : null,
      updatedAt: entry.updatedAt,
    };

    res.json({
      success: true,
      data: sanitizedData,
    });
  } catch (error) {
    next(error);
  }
};

const getDisplayData = async (req, res, next) => {
  try {
    const { clinicId, departmentId } = req.params;
    const queueDate = getTodayDateString();

    const query = { clinicId, queueDate };
    if (departmentId && departmentId !== 'all') {
      query.departmentId = departmentId;
    }

    const [currentCalled, recentlyCalled, waitingCount, clinic, department] = await Promise.all([
      QueueEntry.findOne({ ...query, status: 'called' })
        .sort({ calledTime: -1 })
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
        .populate('departmentId', 'name code'),
      QueueEntry.find({ ...query, status: { $in: ['called', 'in_consultation'] } })
        .sort({ calledTime: -1 })
        .limit(6)
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
        .populate('departmentId', 'name code'),
      QueueEntry.countDocuments({ ...query, status: 'waiting' }),
      Clinic.findById(clinicId).select('name code logoUrl settings'),
      departmentId && departmentId !== 'all' ? Department.findById(departmentId).select('name code') : null,
    ]);

    res.json({
      success: true,
      data: {
        clinic: clinic || { name: 'CareFlow Health' },
        department: department || { name: 'All Departments' },
        currentCalled: currentCalled
          ? {
              tokenNumber: currentCalled.tokenNumber,
              roomNumber: currentCalled.doctorId?.roomNumber || 'Room 101',
              doctorName: currentCalled.doctorId?.userId?.name || 'Attending Physician',
              departmentName: currentCalled.departmentId?.name,
              calledTime: currentCalled.calledTime,
            }
          : null,
        recentlyCalled: recentlyCalled.map((e) => ({
          tokenNumber: e.tokenNumber,
          roomNumber: e.doctorId?.roomNumber || 'Room 101',
          doctorName: e.doctorId?.userId?.name || 'Physician',
          departmentName: e.departmentId?.name,
          status: e.status,
          calledTime: e.calledTime,
        })),
        waitingCount,
        announcement: 'Please watch the display. When your token is called, proceed to the indicated consultation room.',
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQueue,
  createQueueEntry,
  callNext,
  recallPatient,
  skipPatient,
  completePatient,
  trackToken,
  getDisplayData,
};
