const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authenticate = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

router.use(authenticate);
router.use(authorize(['super_admin', 'clinic_admin', 'doctor']));

router.get('/overview', analyticsController.getOverview);
router.get('/patient-flow', analyticsController.getPatientFlow);
router.get('/doctor-stats', analyticsController.getDoctorStats);

module.exports = router;
