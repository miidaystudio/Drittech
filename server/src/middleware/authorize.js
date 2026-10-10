// Role-Based Access Control & Clinic Multi-Tenant Isolation
const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted. Role '${req.user.role}' is not authorized.`,
      });
    }

    next();
  };
};

// Enforce clinic tenant boundary (Super admin has cross-clinic capability)
const enforceClinicScope = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  if (req.user.role === 'super_admin') {
    return next();
  }

  const requestedClinicId = req.params.clinicId || req.body.clinicId || req.query.clinicId;
  if (requestedClinicId && req.user.clinicId && requestedClinicId !== req.user.clinicId) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Access denied to other clinic tenant data.',
    });
  }

  next();
};

module.exports = {
  authorize,
  enforceClinicScope,
};
