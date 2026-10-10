const LabOrder = require('../models/LabOrder');
const LabReport = require('../models/LabReport');
const Patient = require('../models/Patient');
const { generateReportSummary } = require('./reportSummarizer');
const { sendNotification } = require('./notificationService');
const { logAudit } = require('./auditService');
const { generateSignedDownloadToken } = require('../config/storage');

/**
 * Update Lab Order Status
 */
const updateOrderStatus = async ({ orderId, status, technicianId = null, req = null }) => {
  const order = await LabOrder.findById(orderId);
  if (!order) {
    throw new Error('Lab Order not found');
  }

  order.status = status;
  if (status === 'sample_collected' && !order.sampleCollectedAt) {
    order.sampleCollectedAt = new Date();
  }
  if (technicianId) {
    order.assignedTechnicianId = technicianId;
  }

  await order.save();

  logAudit({
    clinicId: order.clinicId,
    userId: req?.user?.id,
    userRole: req?.user?.role || 'lab_technician',
    action: `LAB_ORDER_STATUS_${status.toUpperCase()}`,
    resourceType: 'LabOrder',
    resourceId: order._id.toString(),
    details: { status, orderNumber: order.orderNumber },
    req,
  });

  return order;
};

/**
 * Upload and create Diagnostic Report
 */
const createLabReport = async ({
  clinicId,
  labOrderId,
  file,
  results = [],
  technicianNotes = '',
  req = null,
}) => {
  const order = await LabOrder.findById(labOrderId).populate('patientId');
  if (!order) {
    throw new Error('Lab order not found for this report');
  }

  const reportCount = await LabReport.countDocuments({ clinicId });
  const reportNumber = `REP-${new Date().getFullYear()}-${String(reportCount + 1).padStart(4, '0')}`;

  // Generate plain-language AI patient summary
  const parsedResults = typeof results === 'string' ? JSON.parse(results) : results;
  const aiSummary = await generateReportSummary({
    testTitle: order.testType,
    results: parsedResults,
    patientName: order.patientId?.fullName,
  });

  const report = await LabReport.create({
    clinicId,
    patientId: order.patientId._id,
    doctorId: order.doctorId,
    labOrderId: order._id,
    reportNumber,
    title: `${order.testType} Report`,
    filePath: file ? file.path : 'uploads/sample_report.pdf',
    originalFileName: file ? file.originalname : 'report.pdf',
    mimeType: file ? file.mimetype : 'application/pdf',
    fileSizeBytes: file ? file.size : 1024,
    results: parsedResults,
    technicianNotes,
    reviewedBy: req?.user?.id,
    aiSummary,
    status: 'draft',
  });

  // Link report to order
  order.labReportId = report._id;
  order.status = 'awaiting_review';
  await order.save();

  logAudit({
    clinicId,
    userId: req?.user?.id,
    userRole: 'lab_technician',
    action: 'LAB_REPORT_CREATED',
    resourceType: 'LabReport',
    resourceId: report._id.toString(),
    details: { reportNumber, orderNumber: order.orderNumber },
    req,
  });

  return report;
};

/**
 * Publish Lab Report and notify patient
 */
const publishLabReport = async (reportId, req = null) => {
  const report = await LabReport.findById(reportId).populate('patientId').populate('labOrderId');
  if (!report) {
    throw new Error('Lab report not found');
  }

  report.status = 'published';
  report.publishedAt = new Date();
  await report.save();

  if (report.labOrderId) {
    await LabOrder.findByIdAndUpdate(report.labOrderId._id, { status: 'published' });
  }

  // Notify Patient
  const patient = report.patientId;
  if (patient) {
    sendNotification({
      clinicId: report.clinicId,
      patientId: patient._id,
      userId: patient.userId,
      type: 'report_published',
      title: 'Diagnostic Report Ready',
      message: `Your test report "${report.title}" (Ref: ${report.reportNumber}) has been verified and is ready for download in your patient portal.`,
      metadata: {
        labReportId: report._id,
        reportNumber: report.reportNumber,
      },
      idempotencyKey: `report_pub_${report._id}`,
      recipientEmail: patient.email,
      recipientPhone: patient.phone,
    }).catch((e) => console.error('[Report Notification Error]', e.message));
  }

  logAudit({
    clinicId: report.clinicId,
    userId: req?.user?.id,
    userRole: req?.user?.role || 'lab_technician',
    action: 'LAB_REPORT_PUBLISHED',
    resourceType: 'LabReport',
    resourceId: report._id.toString(),
    details: { reportNumber: report.reportNumber },
    req,
  });

  return report;
};

/**
 * Generate secure signed download link for patient or doctor
 */
const getSecureDownloadUrl = (report, user) => {
  const token = generateSignedDownloadToken(report._id.toString(), user.id, 900); // 15 mins
  return `/api/v1/patient/reports/download/${token}`;
};

module.exports = {
  updateOrderStatus,
  createLabReport,
  publishLabReport,
  getSecureDownloadUrl,
};
