const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { uploadsDir } = require('../config/storage');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate secure randomized filename
    const ext = path.extname(file.originalname);
    const hash = crypto.randomBytes(16).toString('hex');
    cb(null, `report_${Date.now()}_${hash}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/dicom',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only PDF, PNG, JPEG, and DICOM medical files are permitted.'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
  },
  fileFilter,
});

module.exports = upload;
