const Patient = require('../models/Patient');
const { addToQueue } = require('../services/queueService');
const { logAudit } = require('../services/auditService');

const getPatients = async (req, res, next) => {
  try {
    const clinicId = req.user.role === 'super_admin' ? (req.query.clinicId || req.user.clinicId) : req.user.clinicId;
    const { search, page = 1, limit = 20 } = req.query;

    const query = clinicId ? { clinicId } : {};

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { patientIdentifier: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [patients, total] = await Promise.all([
      Patient.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit, 10)),
      Patient.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: patients,
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

const getPatientById = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // Clinic tenant check
    if (req.user.role !== 'super_admin' && req.user.clinicId && patient.clinicId.toString() !== req.user.clinicId) {
      return res.status(403).json({ success: false, message: 'Access denied to this patient record' });
    }

    res.json({ success: true, data: patient });
  } catch (error) {
    next(error);
  }
};

const registerPatient = async (req, res, next) => {
  try {
    const clinicId = req.user.clinicId || req.body.clinicId;
    if (!clinicId) {
      return res.status(400).json({ success: false, message: 'Clinic identifier is required' });
    }

    const {
      fullName,
      phone,
      email,
      dateOfBirth,
      age,
      gender,
      bloodGroup,
      allergies,
      chronicConditions,
      departmentId,
      doctorId,
      priority = 'normal',
      entryType = 'walk_in',
      notes = '',
      createQueueToken = true,
    } = req.body;

    // Check duplicate detection warning
    const duplicateCheck = await Patient.findOne({
      clinicId,
      $or: [{ phone: phone?.trim() }, { email: email?.trim().toLowerCase() }],
    });

    let patient = null;
    let isExistingPatient = false;

    if (duplicateCheck) {
      isExistingPatient = true;
      patient = duplicateCheck;
    } else {
      // Generate unique patient identifier (e.g. PAT-2026-0042)
      const count = await Patient.countDocuments({ clinicId });
      const patientIdentifier = `PAT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

      patient = await Patient.create({
        clinicId,
        patientIdentifier,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email ? email.trim().toLowerCase() : '',
        dateOfBirth: dateOfBirth || null,
        age: age ? parseInt(age, 10) : undefined,
        gender: gender || 'unspecified',
        bloodGroup: bloodGroup || 'Unknown',
        allergies: Array.isArray(allergies) ? allergies : allergies ? [allergies] : [],
        chronicConditions: Array.isArray(chronicConditions) ? chronicConditions : chronicConditions ? [chronicConditions] : [],
      });

      logAudit({
        clinicId,
        userId: req.user.id,
        userRole: req.user.role,
        action: 'PATIENT_REGISTERED',
        resourceType: 'Patient',
        resourceId: patient._id.toString(),
        details: { patientIdentifier: patient.patientIdentifier, fullName: patient.fullName },
        req,
      });
    }

    // Optionally create Queue Token immediately
    let queueEntry = null;
    if (createQueueToken && departmentId) {
      queueEntry = await addToQueue({
        clinicId,
        departmentId,
        doctorId: doctorId || null,
        patientId: patient._id,
        priority,
        entryType,
        notes,
        req,
      });
    }

    res.status(201).json({
      success: true,
      message: isExistingPatient
        ? 'Existing patient found and added to queue'
        : 'Patient registered successfully',
      data: {
        patient,
        queueEntry,
        isExistingPatient,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updatePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    if (req.user.role !== 'super_admin' && req.user.clinicId && patient.clinicId.toString() !== req.user.clinicId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const updates = req.body;
    Object.keys(updates).forEach((key) => {
      if (['fullName', 'phone', 'email', 'gender', 'age', 'bloodGroup', 'allergies', 'chronicConditions', 'address'].includes(key)) {
        patient[key] = updates[key];
      }
    });

    await patient.save();

    res.json({ success: true, message: 'Patient details updated', data: patient });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPatients,
  getPatientById,
  registerPatient,
  updatePatient,
};
