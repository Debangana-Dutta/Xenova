const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const router = express.Router();

const {
  getFocusSessions,
  createFocusSession,
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  getProductivitySummary,
} = require('../controllers/productivityController');
const { protect } = require('../middleware/authMiddleware');

// --- Multer configuration for certificate/document uploads ---------------

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `certificate-${Date.now()}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, PNG, JPG and WEBP files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

router.use(protect);

router.get('/summary', getProductivitySummary);

router.route('/focus-sessions').get(getFocusSessions).post(createFocusSession);

router.route('/activities').get(getActivities).post(upload.single('certificate'), createActivity);

router
  .route('/activities/:id')
  .put(upload.single('certificate'), updateActivity)
  .delete(deleteActivity);

module.exports = router;
