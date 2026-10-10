const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const RefreshSession = require('../models/RefreshSession');
const env = require('../config/env');

const generateTokens = (user) => {
  const payload = {
    id: user._id.toString(),
    role: user.role,
    clinicId: user.clinicId ? user.clinicId.toString() : null,
  };

  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY,
  });

  const refreshToken = crypto.randomBytes(40).toString('hex');

  return { accessToken, refreshToken };
};

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const createRefreshSession = async (user, refreshToken, req) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  const refreshTokenHash = hashToken(refreshToken);

  const session = await RefreshSession.create({
    userId: user._id,
    refreshTokenHash,
    userAgent: req?.headers?.['user-agent'] || '',
    ipAddress: req?.ip || '',
    expiresAt,
  });

  return session;
};

const refreshAccessToken = async (rawRefreshToken, req) => {
  const refreshTokenHash = hashToken(rawRefreshToken);

  const session = await RefreshSession.findOne({
    refreshTokenHash,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  });

  if (!session) {
    throw new Error('Invalid or expired refresh session. Please log in again.');
  }

  const user = await User.findById(session.userId);
  if (!user || !user.isActive) {
    throw new Error('User account is inactive or not found.');
  }

  // Revoke old session (Rotation)
  session.isRevoked = true;
  await session.save();

  // Generate new pair
  const tokens = generateTokens(user);
  await createRefreshSession(user, tokens.refreshToken, req);

  return { user, ...tokens };
};

module.exports = {
  generateTokens,
  createRefreshSession,
  refreshAccessToken,
  hashToken,
};
