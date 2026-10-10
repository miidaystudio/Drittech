const express = require('express');
const router = express.Router();
const labController = require('../controllers/labController');
const authenticate = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const upload = require('../middleware/upload');

// Public verified download endpoint via signed HMAC token
router.get('/patient/reports/download/:token', labController.downloadReportFile);

// Authenticated Routes
router.use(authenticate);

// Patient-specific reports endpoints
router.get(
  '/patient/reports',
  authorize(['patient', 'super_admin', 'clinic_admin', 'doctor']),
  labController.getPatientPortalReports
);
router.get(
  '/patient/reports/:id',
  authorize(['patient', 'super_admin', 'clinic_admin', 'doctor']),
  labController.getPatientReportById
);
router.post(
  '/patient/reports/:id/download-link',
  authorize(['patient', 'super_admin', 'clinic_admin', 'doctor', 'lab_technician']),
  labController.getReportDownloadLink
);

// Laboratory Technicians & Clinical Workspace
router.get(
  '/lab/orders',
  authorize(['super_admin', 'clinic_admin', 'lab_technician', 'doctor']),
  labController.getLabOrders
);
router.post(
  '/lab/orders',
  authorize(['super_admin', 'clinic_admin', 'doctor']),
  labController.createLabOrder
);
router.patch(
  '/lab/orders/:id/status',
  authorize(['super_admin', 'clinic_admin', 'lab_technician']),
  labController.updateStatus
);
router.post(
  '/lab/reports',
  authorize(['super_admin', 'clinic_admin', 'lab_technician']),
  upload.single('file'),
  labController.uploadReport
);
router.get(
  '/lab/reports',
  authorize(['super_admin', 'clinic_admin', 'lab_technician', 'doctor']),
  labController.getReports
);
router.post(
  '/lab/reports/:id/publish',
  authorize(['super_admin', 'clinic_admin', 'lab_technician']),
  labController.publish
);

module.exports = router;
