const Consultation = require('../models/Consultation');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const {
  getOrCreateConsultation,
  saveConsultationDraft,
  completeConsultation,
} = require('../services/consultationService');

const getConsultations = async (req, res, next) => {
  try {
    const clinicId = req.user.role === 'super_admin' ? (req.query.clinicId || req.user.clinicId) : req.user.clinicId;
    const { patientId, doctorId, status, page = 1, limit = 20 } = req.query;

    const query = clinicId ? { clinicId } : {};
    if (patientId) query.patientId = patientId;
    if (doctorId) query.doctorId = doctorId;
    if (status) query.status = status;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [consultations, total] = await Promise.all([
      Consultation.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .populate('patientId', 'fullName patientIdentifier phone gender age bloodGroup allergies chronicConditions')
        .populate({
          path: 'doctorId',
          populate: { path: 'userId', select: 'name' },
        }),
      Consultation.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: consultations,
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

const startConsultation = async (req, res, next) => {
  try {
    const clinicId = req.user.clinicId || req.body.clinicId;
    const { patientId, queueEntryId, appointmentId } = req.body;

    let doctorId = req.body.doctorId;
    if (!doctorId && req.user.role === 'doctor') {
      const doc = await Doctor.findOne({ userId: req.user.id });
      if (doc) doctorId = doc._id;
    }

    if (!doctorId) {
      return res.status(400).json({ success: false, message: 'Attending doctor is required' });
    }

    const consultation = await getOrCreateConsultation({
      clinicId,
      doctorId,
      patientId,
      queueEntryId,
      appointmentId,
      req,
    });

    const populated = await Consultation.findById(consultation._id)
      .populate('patientId', 'fullName patientIdentifier phone gender age bloodGroup allergies chronicConditions')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
      .populate('queueEntryId');

    res.status(201).json({
      success: true,
      message: 'Consultation session active',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

const getConsultationById = async (req, res, next) => {
  try {
    const consultation = await Consultation.findById(req.params.id)
      .populate('patientId')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
      .populate('queueEntryId');

    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Consultation not found' });
    }

    // Clinic boundary check
    if (req.user.role !== 'super_admin' && req.user.clinicId && consultation.clinicId.toString() !== req.user.clinicId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Fetch previous consultation history for this patient
    const previousConsultations = await Consultation.find({
      patientId: consultation.patientId._id,
      _id: { $ne: consultation._id },
      status: 'completed',
    })
      .sort({ completedAt: -1 })
      .limit(5)
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } });

    res.json({
      success: true,
      data: {
        consultation,
        previousConsultations,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateDraft = async (req, res, next) => {
  try {
    const updated = await saveConsultationDraft(req.params.id, req.body, req);
    res.json({
      success: true,
      message: 'Draft saved successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

const complete = async (req, res, next) => {
  try {
    const completed = await completeConsultation(req.params.id, req.body, req);
    res.json({
      success: true,
      message: 'Consultation completed successfully',
      data: completed,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConsultations,
  startConsultation,
  getConsultationById,
  updateDraft,
  complete,
};
