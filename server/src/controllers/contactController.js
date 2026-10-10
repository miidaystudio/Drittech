const { logAudit } = require('../services/auditService');

const submitContactForm = async (req, res, next) => {
  try {
    const { name, email, organization, phone, message, interest } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your name, valid email address, and message.',
      });
    }

    logAudit({
      action: 'PUBLIC_CONTACT_SUBMISSION',
      resourceType: 'ContactMessage',
      details: { name, email, organization, interest, messageSnippet: message.substring(0, 100) },
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Thank you for reaching out! Our clinical solutions team will contact you shortly.',
      receivedAt: new Date(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitContactForm,
};
