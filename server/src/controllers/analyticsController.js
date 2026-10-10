const {
  getOverviewMetrics,
  getPatientFlowAnalytics,
  getDoctorUtilization,
} = require('../services/analyticsService');

const getOverview = async (req, res, next) => {
  try {
    const clinicId = req.user.role === 'super_admin' ? (req.query.clinicId || req.user.clinicId) : req.user.clinicId;
    const metrics = await getOverviewMetrics(clinicId);
    res.json({ success: true, data: metrics });
  } catch (error) {
    next(error);
  }
};

const getPatientFlow = async (req, res, next) => {
  try {
    const clinicId = req.user.role === 'super_admin' ? (req.query.clinicId || req.user.clinicId) : req.user.clinicId;
    const days = parseInt(req.query.days || '7', 10);
    const flow = await getPatientFlowAnalytics(clinicId, days);
    res.json({ success: true, data: flow });
  } catch (error) {
    next(error);
  }
};

const getDoctorStats = async (req, res, next) => {
  try {
    const clinicId = req.user.role === 'super_admin' ? (req.query.clinicId || req.user.clinicId) : req.user.clinicId;
    const doctors = await getDoctorUtilization(clinicId);
    res.json({ success: true, data: doctors });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverview,
  getPatientFlow,
  getDoctorStats,
};
