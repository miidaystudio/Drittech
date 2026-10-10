const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/drittech',

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'drittech_jwt_access_secret_key_default_32_chars',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'drittech_jwt_refresh_secret_key_default_32_chars',
  JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'drittech_cookie_secret_key_default_2026',

  STORAGE_PROVIDER: process.env.STORAGE_PROVIDER || 'local',
  LOCAL_STORAGE_DIR: process.env.LOCAL_STORAGE_DIR || './uploads',
  S3_ENDPOINT: process.env.S3_ENDPOINT || '',
  S3_REGION: process.env.S3_REGION || 'us-east-1',
  S3_BUCKET: process.env.S3_BUCKET || 'drittech-medical-reports',
  S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID || '',
  S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY || '',

  NOTIFICATION_EMAIL_ENABLED: process.env.NOTIFICATION_EMAIL_ENABLED === 'true',
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '2525', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || 'CareFlow Health <notifications@careflow.drittech.com>',

  NOTIFICATION_SMS_ENABLED: process.env.NOTIFICATION_SMS_ENABLED === 'true',
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_FROM_NUMBER: process.env.TWILIO_FROM_NUMBER || '',

  NOTIFICATION_WHATSAPP_ENABLED: process.env.NOTIFICATION_WHATSAPP_ENABLED === 'true',
  WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN || '',

  AI_PROVIDER: process.env.AI_PROVIDER || 'mock',
  AI_PROVIDER_API_KEY: process.env.AI_PROVIDER_API_KEY || '',
};
