const env = require('../config/env');

/**
 * Generates an automated plain-language patient summary for structured laboratory results
 */
const generateReportSummary = async ({ testTitle, results = [], patientName = 'Patient' }) => {
  if (!results || results.length === 0) {
    return {
      status: 'not_generated',
      bullets: [],
      provider: 'none',
      disclaimer: 'No structured laboratory parameters were provided for automated summary.',
    };
  }

  // 1. Structured rule-based analyzer (deterministic fallback & mock)
  const normalResults = results.filter((r) => r.flag === 'NORMAL');
  const abnormalResults = results.filter((r) => r.flag !== 'NORMAL');

  const bullets = [];

  // Itemize notable findings based strictly on laboratory flags
  if (abnormalResults.length > 0) {
    abnormalResults.slice(0, 2).forEach((item) => {
      if (item.flag === 'HIGH') {
        bullets.push(`${item.parameter} (${item.value} ${item.unit || ''}) is above the laboratory's reference range (${item.referenceRange || 'standard'}).`);
      } else if (item.flag === 'LOW') {
        bullets.push(`${item.parameter} (${item.value} ${item.unit || ''}) is below the laboratory's reference range (${item.referenceRange || 'standard'}).`);
      } else {
        bullets.push(`${item.parameter} shows an abnormal value (${item.value} ${item.unit || ''}) relative to the laboratory reference range.`);
      }
    });
  }

  if (normalResults.length > 0) {
    const normalNames = normalResults.slice(0, 3).map((r) => r.parameter).join(', ');
    bullets.push(`${normalNames} ${normalResults.length > 1 ? 'are' : 'is'} within normal reference ranges.`);
  }

  // Always append standardized clinical consultation recommendation
  bullets.push('Please review and discuss these findings with your attending physician to understand their clinical significance.');

  return {
    status: 'available',
    bullets: bullets.slice(0, 3), // Keep strictly concise ~3 bullets
    disclaimer: 'This plain-language summary is an automated overview generated for convenience. It is not a clinical diagnosis. Always consult your healthcare provider.',
    generatedAt: new Date(),
    provider: env.AI_PROVIDER || 'mock',
  };
};

module.exports = {
  generateReportSummary,
};
