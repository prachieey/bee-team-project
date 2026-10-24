// services/uploadService.js
// Multer configuration for optional receipt image uploads
// Demonstrates: Multer middleware, file system, Buffer handling (Lecture 30-31)

const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Disk storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // Unique filename: timestamp + original extension
    const ext      = path.extname(file.originalname).toLowerCase();
    const filename = `receipt_${Date.now()}${ext}`;
    cb(null, filename);
  },
});

// File type filter: only allow images
const fileFilter = (_req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extOk  = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowedTypes.test(file.mimetype);

  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

module.exports = upload;
