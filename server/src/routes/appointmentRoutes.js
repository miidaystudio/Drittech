const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const authenticate = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

router.use(authenticate);

router.get(
  '/',
  authorize(['super_admin', 'clinic_admin', 'receptionist', 'doctor']),
  appointmentController.getAppointments
);
router.post(
  '/',
  authorize(['super_admin', 'clinic_admin', 'receptionist', 'patient']),
  appointmentController.createAppointment
);
router.post(
  '/:id/check-in',
  authorize(['super_admin', 'clinic_admin', 'receptionist']),
  appointmentController.checkInAppointment
);

module.exports = router;
