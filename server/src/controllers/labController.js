const path = require('path');
const fs = require('fs');
const LabOrder = require('../models/LabOrder');
const LabReport = require('../models/LabReport');
const Patient = require('../models/Patient');
const {
  updateOrderStatus,
  createLabReport,
  publishLabReport,
  getSecureDownloadUrl,
} = require('../services/labService');
const { verifySignedDownloadToken, uploadsDir } = require('../config/storage');

const getLabOrders = async (req, res, next) => {
  try {
    const clinicId = req.user.role === 'super_admin' ? (req.query.clinicId || req.user.clinicId) : req.user.clinicId;
    const { status, urgency, testType, page = 1, limit = 20 } = req.query;

    const query = clinicId ? { clinicId } : {};
    if (status) query.status = status;
    if (urgency) query.urgency = urgency;
    if (testType) query.testType = testType;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [orders, total] = await Promise.all([
      LabOrder.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .populate('patientId', 'fullName patientIdentifier phone email gender age')
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
        .populate('labReportId', 'reportNumber status publishedAt'),
      LabOrder.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: orders,
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

const createLabOrder = async (req, res, next) => {
  try {
    const clinicId = req.user.clinicId || req.body.clinicId;
    const { patientId, doctorId, testType, urgency = 'routine', category, clinicalNotes } = req.body;

    const count = await LabOrder.countDocuments({ clinicId });
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const order = await LabOrder.create({
      clinicId,
      patientId,
      doctorId,
      orderNumber,
      testType,
      category: category || 'General',
      urgency,
      clinicalNotes,
      status: 'ordered',
    });

    const populated = await LabOrder.findById(order._id)
      .populate('patientId', 'fullName patientIdentifier phone')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } });

    res.status(201).json({
      success: true,
      message: 'Laboratory test order created',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const updated = await updateOrderStatus({
      orderId: req.params.id,
      status,
      technicianId: req.user.id,
      req,
    });

    res.json({
      success: true,
      message: `Lab order status updated to ${status}`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

const uploadReport = async (req, res, next) => {
  try {
    const clinicId = req.user.clinicId || req.body.clinicId;
    const { labOrderId, results, technicianNotes } = req.body;
    const file = req.file;

    const report = await createLabReport({
      clinicId,
      labOrderId,
      file,
      results,
      technicianNotes,
      req,
    });

    const populated = await LabReport.findById(report._id)
      .populate('patientId', 'fullName patientIdentifier phone email')
      .populate('labOrderId');

    res.status(201).json({
      success: true,
      message: 'Diagnostic report uploaded and analyzed successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

const getReports = async (req, res, next) => {
  try {
    const clinicId = req.user.role === 'super_admin' ? (req.query.clinicId || req.user.clinicId) : req.user.clinicId;
    const { status, patientId, page = 1, limit = 20 } = req.query;

    const query = clinicId ? { clinicId } : {};
    if (status) query.status = status;
    if (patientId) query.patientId = patientId;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [reports, total] = await Promise.all([
      LabReport.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .populate('patientId', 'fullName patientIdentifier phone')
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
        .populate('labOrderId', 'orderNumber testType urgency'),
      LabReport.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: reports,
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

const publish = async (req, res, next) => {
  try {
    const published = await publishLabReport(req.params.id, req);
    res.json({
      success: true,
      message: 'Lab report published to patient portal and notification sent',
      data: published,
    });
  } catch (error) {
    next(error);
  }
};

// Patient Portal: Get authenticated patient's reports
const getPatientPortalReports = async (req, res, next) => {
  try {
    // Find patient profile linked to this user
    const patient = await Patient.findOne({
      $or: [{ userId: req.user.id }, { email: req.user.email }],
    });

    if (!patient) {
      return res.json({ success: true, data: [] });
    }

    const reports = await LabReport.find({
      patientId: patient._id,
      status: 'published',
    })
      .sort({ publishedAt: -1 })
      .populate('clinicId', 'name address phone')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
      .populate('labOrderId', 'testType category');

    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    next(error);
  }
};

const getPatientReportById = async (req, res, next) => {
  try {
    const report = await LabReport.findById(req.params.id)
      .populate('clinicId', 'name address phone')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
      .populate('labOrderId', 'testType category urgency');

    if (!report || report.status !== 'published') {
      return res.status(404).json({ success: false, message: 'Report not found or not yet published' });
    }

    // Verify patient authorization
    const patient = await Patient.findById(report.patientId);
    if (
      req.user.role === 'patient' &&
      patient.userId?.toString() !== req.user.id &&
      patient.email?.toLowerCase() !== req.user.email?.toLowerCase()
    ) {
      return res.status(403).json({ success: false, message: 'Unauthorized: You can only view your own medical reports' });
    }

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

const getReportDownloadLink = async (req, res, next) => {
  try {
    const report = await LabReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const downloadUrl = getSecureDownloadUrl(report, req.user);

    res.json({
      success: true,
      downloadUrl,
      expiresIn: '15 minutes',
    });
  } catch (error) {
    next(error);
  }
};

const downloadReportFile = async (req, res, next) => {
  try {
    const { token } = req.params;
    const verification = verifySignedDownloadToken(token);

    if (!verification.valid) {
      return res.status(403).send(`Access Denied: ${verification.error}`);
    }

    const report = await LabReport.findById(verification.data.reportId);
    if (!report) {
      return res.status(404).send('Report file not found');
    }

    const fullPath = path.resolve(report.filePath);
    if (!fs.existsSync(fullPath)) {
      // If sample PDF doesn't exist on disk, stream generated demo PDF bytes
      res.setHeader('Content-Type', 'text/plain');
      return res.send(`CareFlow Diagnostic Report - ${report.title}\nReport ID: ${report.reportNumber}\nVerified: ${report.publishedAt}`);
    }

    res.setHeader('Content-Disposition', `attachment; filename="${report.originalFileName}"`);
    res.setHeader('Content-Type', report.mimeType);
    fs.createReadStream(fullPath).pipe(res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLabOrders,
  createLabOrder,
  updateStatus,
  uploadReport,
  getReports,
  publish,
  getPatientPortalReports,
  getPatientReportById,
  getReportDownloadLink,
  downloadReportFile,
};
