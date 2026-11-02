const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const authenticate = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

router.use(authenticate);

// List appointments (role-scoped, patients only see their own)
router.get(
  '/',
  authorize(['super_admin', 'clinic_admin', 'receptionist', 'doctor', 'patient']),
  appointmentController.getAppointments
);

// Get single appointment
router.get(
  '/:id',
  authorize(['super_admin', 'clinic_admin', 'receptionist', 'doctor', 'patient']),
  appointmentController.getAppointmentById
);

// Book appointment
router.post(
  '/',
  authorize(['super_admin', 'clinic_admin', 'receptionist', 'patient']),
  appointmentController.createAppointment
);

// Update appointment details
router.patch(
  '/:id',
  authorize(['super_admin', 'clinic_admin', 'receptionist', 'doctor']),
  appointmentController.updateAppointment
);

// Check-in appointment -> Issue queue token
router.post(
  '/:id/check-in',
  authorize(['super_admin', 'clinic_admin', 'receptionist']),
  appointmentController.checkInAppointment
);

// Cancel appointment
router.post(
  '/:id/cancel',
  authorize(['super_admin', 'clinic_admin', 'receptionist', 'patient']),
  appointmentController.cancelAppointment
);

// Reschedule appointment
router.post(
  '/:id/reschedule',
  authorize(['super_admin', 'clinic_admin', 'receptionist', 'patient']),
  appointmentController.rescheduleAppointment
);

// Mark no-show
router.post(
  '/:id/no-show',
  authorize(['super_admin', 'clinic_admin', 'receptionist']),
  appointmentController.markNoShow
);

module.exports = router;
