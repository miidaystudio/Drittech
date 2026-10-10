const AuditLog = require('../models/AuditLog');

const logAudit = async ({
  clinicId = null,
  userId = null,
  userRole = 'anonymous',
  action,
  resourceType,
  resourceId = '',
  details = {},
  req = null,
}) => {
  try {
    const ipAddress = req?.ip || req?.headers?.['x-forwarded-for'] || '127.0.0.1';
    const userAgent = req?.headers?.['user-agent'] || 'unknown';

    await AuditLog.create({
      clinicId,
      userId,
      userRole,
      action,
      resourceType,
      resourceId,
      details,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error('[Audit Log Error] Failed to write audit entry:', error.message);
  }
};

module.exports = {
  logAudit,
};
