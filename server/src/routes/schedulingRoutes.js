const express = require('express');
const router = express.Router();
const schedulingController = require('../controllers/schedulingController');
const authenticate = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

router.use(authenticate);

// Availability & Calendar
router.get('/availability', schedulingController.getAvailabilityHandler);
router.get('/calendar-summary', schedulingController.getCalendarSummaryHandler);

// Appointment Types
router.get('/types', schedulingController.getAppointmentTypes);
router.post(
  '/types',
  authorize(['super_admin', 'clinic_admin']),
  schedulingController.createAppointmentType
);
router.put(
  '/types/:id',
  authorize(['super_admin', 'clinic_admin']),
  schedulingController.updateAppointmentType
);

// Doctor Schedules
router.get(
  '/doctor-schedule/:doctorId',
  authorize(['super_admin', 'clinic_admin', 'doctor', 'receptionist', 'patient']),
  schedulingController.getDoctorScheduleHandler
);
router.post(
  '/doctor-schedule',
  authorize(['super_admin', 'clinic_admin', 'doctor']),
  schedulingController.saveDoctorScheduleHandler
);

// Exceptions & Holidays
router.get(
  '/exceptions',
  authorize(['super_admin', 'clinic_admin', 'doctor', 'receptionist']),
  schedulingController.getExceptions
);
router.post(
  '/exceptions',
  authorize(['super_admin', 'clinic_admin', 'doctor']),
  schedulingController.createException
);
router.delete(
  '/exceptions/:id',
  authorize(['super_admin', 'clinic_admin', 'doctor']),
  schedulingController.deleteException
);

// Clinic Policy
router.get('/policy', schedulingController.getPolicyHandler);
router.put(
  '/policy',
  authorize(['super_admin', 'clinic_admin']),
  schedulingController.updatePolicyHandler
);

// Analytics
router.get(
  '/analytics',
  authorize(['super_admin', 'clinic_admin', 'doctor', 'receptionist']),
  schedulingController.getSchedulingAnalytics
);

module.exports = router;
