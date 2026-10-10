const express = require('express');
const router = express.Router();
const consultationController = require('../controllers/consultationController');
const authenticate = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

router.use(authenticate);

// Restricted to clinical roles: Doctor, Super Admin, Clinic Admin
router.use(authorize(['super_admin', 'clinic_admin', 'doctor']));

router.get('/', consultationController.getConsultations);
router.post('/', consultationController.startConsultation);
router.get('/:id', consultationController.getConsultationById);
router.patch('/:id', consultationController.updateDraft);
router.post('/:id/complete', consultationController.complete);

module.exports = router;
