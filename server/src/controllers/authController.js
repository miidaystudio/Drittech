const User = require('../models/User');
const RefreshSession = require('../models/RefreshSession');
const { generateTokens, createRefreshSession, refreshAccessToken } = require('../services/authService');
const { logAudit } = require('../services/auditService');

// Set HttpOnly access token & refresh token in secure cookies
const setAuthCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('careflow_access_token', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  if (refreshToken) {
    res.cookie('careflow_refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/v1/auth/refresh',
    });
  }
};

const clearAuthCookies = (res) => {
  res.clearCookie('careflow_access_token');
  res.clearCookie('careflow_refresh_token', { path: '/api/v1/auth/refresh' });
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated' });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const { accessToken, refreshToken } = generateTokens(user);
    await createRefreshSession(user, refreshToken, req);

    setAuthCookies(res, accessToken, refreshToken);

    logAudit({
      clinicId: user.clinicId,
      userId: user._id,
      userRole: user.role,
      action: 'USER_LOGIN',
      resourceType: 'User',
      resourceId: user._id.toString(),
      req,
    });

    res.json({
      success: true,
      message: 'Logged in successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        clinicId: user.clinicId,
        departmentId: user.departmentId,
        phone: user.phone,
      },
    });
  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'patient', phone, clinicId } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }

    // Patient or standard registration
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: ['patient', 'clinic_admin'].includes(role) ? role : 'patient',
      phone: phone || '',
      clinicId: clinicId || null,
    });

    const { accessToken, refreshToken } = generateTokens(user);
    await createRefreshSession(user, refreshToken, req);

    setAuthCookies(res, accessToken, refreshToken);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        clinicId: user.clinicId,
      },
    });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.careflow_refresh_token || req.body?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'No refresh token provided' });
    }

    const { user, accessToken, refreshToken: newRefreshToken } = await refreshAccessToken(refreshToken, req);
    setAuthCookies(res, accessToken, newRefreshToken);

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        clinicId: user.clinicId,
        departmentId: user.departmentId,
      },
    });
  } catch (error) {
    clearAuthCookies(res);
    return res.status(401).json({ success: false, message: error.message });
  }
};

const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.careflow_refresh_token;
    if (refreshToken) {
      const crypto = require('crypto');
      const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await RefreshSession.updateOne({ refreshTokenHash: hash }, { isRevoked: true });
    }

    clearAuthCookies(res);

    if (req.user) {
      logAudit({
        clinicId: req.user.clinicId,
        userId: req.user.id,
        userRole: req.user.role,
        action: 'USER_LOGOUT',
        resourceType: 'User',
        resourceId: req.user.id,
        req,
      });
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('clinicId', 'name code settings').populate('departmentId', 'name code');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        clinicId: user.clinicId,
        departmentId: user.departmentId,
        phone: user.phone,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });

    // Always respond with success to avoid email enumeration attacks
    if (user) {
      const crypto = require('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
      await user.save();
    }

    res.json({
      success: true,
      message: 'If an account exists with that email address, password reset instructions have been sent.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  register,
  refresh,
  logout,
  getMe,
  forgotPassword,
};
