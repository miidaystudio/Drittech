const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticate = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

router.use(authenticate);
router.use(authorize(['super_admin', 'clinic_admin']));

router.get('/clinics', adminController.getClinics);
router.get('/departments', adminController.getDepartments);
router.post('/departments', adminController.createDepartment);
router.get('/doctors', adminController.getDoctors);
router.get('/staff', adminController.getStaff);
router.get('/audit-logs', adminController.getAuditLogs);
router.get('/settings', adminController.getClinicSettings);
router.patch('/settings', adminController.updateClinicSettings);

module.exports = router;
