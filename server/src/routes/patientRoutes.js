const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const authenticate = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

router.use(authenticate);

router.get(
  '/',
  authorize(['super_admin', 'clinic_admin', 'receptionist', 'doctor', 'lab_technician']),
  patientController.getPatients
);
router.post(
  '/',
  authorize(['super_admin', 'clinic_admin', 'receptionist']),
  patientController.registerPatient
);
router.get(
  '/:id',
  authorize(['super_admin', 'clinic_admin', 'receptionist', 'doctor', 'lab_technician', 'patient']),
  patientController.getPatientById
);
router.patch(
  '/:id',
  authorize(['super_admin', 'clinic_admin', 'receptionist', 'doctor']),
  patientController.updatePatient
);

module.exports = router;
