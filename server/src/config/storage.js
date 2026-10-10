const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const env = require('./env');

const uploadsDir = path.resolve(env.LOCAL_STORAGE_DIR);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Generate a signed token for secure, expiring download authorization
const generateSignedDownloadToken = (reportId, userId, expiresInSeconds = 900) => {
  const expiresAt = Date.now() + expiresInSeconds * 1000;
  const payload = `${reportId}:${userId}:${expiresAt}`;
  const signature = crypto
    .createHmac('sha256', env.JWT_ACCESS_SECRET)
    .update(payload)
    .digest('hex');
  return Buffer.from(JSON.stringify({ reportId, userId, expiresAt, signature })).toString('base64url');
};

const verifySignedDownloadToken = (token) => {
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf-8');
    const data = JSON.parse(raw);
    if (!data.reportId || !data.userId || !data.expiresAt || !data.signature) {
      return { valid: false, error: 'Malformed token' };
    }
    if (Date.now() > data.expiresAt) {
      return { valid: false, error: 'Download link has expired' };
    }
    const payload = `${data.reportId}:${data.userId}:${data.expiresAt}`;
    const expectedSignature = crypto
      .createHmac('sha256', env.JWT_ACCESS_SECRET)
      .update(payload)
      .digest('hex');
    if (crypto.timingSafeEqual(Buffer.from(data.signature), Buffer.from(expectedSignature))) {
      return { valid: true, data };
    }
    return { valid: false, error: 'Invalid signature' };
  } catch (err) {
    return { valid: false, error: 'Token verification failed' };
  }
};

module.exports = {
  uploadsDir,
  generateSignedDownloadToken,
  verifySignedDownloadToken,
};
