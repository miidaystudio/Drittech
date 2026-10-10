const Clinic = require('../models/Clinic');
const Department = require('../models/Department');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');

const getClinics = async (req, res, next) => {
  try {
    const clinics = await Clinic.find().sort({ name: 1 });
    res.json({ success: true, data: clinics });
  } catch (error) {
    next(error);
  }
};

const getDepartments = async (req, res, next) => {
  try {
    const clinicId = req.user.role === 'super_admin' ? (req.query.clinicId || req.user.clinicId) : req.user.clinicId;
    const query = clinicId ? { clinicId } : {};
    const departments = await Department.find(query).sort({ name: 1 });
    res.json({ success: true, data: departments });
  } catch (error) {
    next(error);
  }
};

const createDepartment = async (req, res, next) => {
  try {
    const clinicId = req.user.clinicId || req.body.clinicId;
    const { name, code, description, avgWaitTimeMinutes } = req.body;

    const department = await Department.create({
      clinicId,
      name,
      code: code.toUpperCase(),
      description,
      avgWaitTimeMinutes: avgWaitTimeMinutes || 15,
    });

    res.status(201).json({ success: true, data: department });
  } catch (error) {
    next(error);
  }
};

const getDoctors = async (req, res, next) => {
  try {
    const clinicId = req.user.role === 'super_admin' ? (req.query.clinicId || req.user.clinicId) : req.user.clinicId;
    const query = clinicId ? { clinicId } : {};

    const doctors = await Doctor.find(query)
      .populate('userId', 'name email phone avatar isActive')
      .populate('departmentId', 'name code');

    res.json({ success: true, data: doctors });
  } catch (error) {
    next(error);
  }
};

const getStaff = async (req, res, next) => {
  try {
    const clinicId = req.user.role === 'super_admin' ? (req.query.clinicId || req.user.clinicId) : req.user.clinicId;
    const query = clinicId ? { clinicId } : {};

    const staff = await User.find(query)
      .select('-password')
      .populate('departmentId', 'name code')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: staff });
  } catch (error) {
    next(error);
  }
};

const getAuditLogs = async (req, res, next) => {
  try {
    const clinicId = req.user.role === 'super_admin' ? (req.query.clinicId || req.user.clinicId) : req.user.clinicId;
    const { page = 1, limit = 25 } = req.query;

    const query = clinicId ? { clinicId } : {};
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .populate('userId', 'name email role'),
      AuditLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: logs,
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

const getClinicSettings = async (req, res, next) => {
  try {
    const clinicId = req.user.clinicId || req.params.clinicId;
    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      return res.status(404).json({ success: false, message: 'Clinic not found' });
    }
    res.json({ success: true, data: clinic });
  } catch (error) {
    next(error);
  }
};

const updateClinicSettings = async (req, res, next) => {
  try {
    const clinicId = req.user.clinicId || req.params.clinicId;
    const { name, phone, email, settings } = req.body;

    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      return res.status(404).json({ success: false, message: 'Clinic not found' });
    }

    if (name) clinic.name = name;
    if (phone) clinic.phone = phone;
    if (email) clinic.email = email;
    if (settings) {
      clinic.settings = { ...clinic.settings, ...settings };
    }

    await clinic.save();

    res.json({ success: true, message: 'Clinic settings updated successfully', data: clinic });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getClinics,
  getDepartments,
  createDepartment,
  getDoctors,
  getStaff,
  getAuditLogs,
  getClinicSettings,
  updateClinicSettings,
};
