const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queueController');
const authenticate = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

// Public Guest Tracker & Public TV Display (No login required, strictly sanitized payload)
router.get('/track/:token', queueController.trackToken);
router.get('/display/:clinicId/:departmentId', queueController.getDisplayData);

// Authenticated Queue Operations
router.use(authenticate);

router.get(
  '/',
  authorize(['super_admin', 'clinic_admin', 'receptionist', 'doctor', 'lab_technician']),
  queueController.getQueue
);
router.post(
  '/',
  authorize(['super_admin', 'clinic_admin', 'receptionist']),
  queueController.createQueueEntry
);
router.post(
  '/call-next',
  authorize(['super_admin', 'clinic_admin', 'doctor']),
  queueController.callNext
);
router.post(
  '/:id/recall',
  authorize(['super_admin', 'clinic_admin', 'doctor', 'receptionist']),
  queueController.recallPatient
);
router.post(
  '/:id/skip',
  authorize(['super_admin', 'clinic_admin', 'doctor', 'receptionist']),
  queueController.skipPatient
);
router.post(
  '/:id/complete',
  authorize(['super_admin', 'clinic_admin', 'doctor']),
  queueController.completePatient
);

module.exports = router;
