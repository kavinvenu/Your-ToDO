const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads/avatars directory exists
const AVATAR_UPLOAD_PATH = path.join(__dirname, '../uploads/avatars');
if (!fs.existsSync(AVATAR_UPLOAD_PATH)) {
  fs.mkdirSync(AVATAR_UPLOAD_PATH, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, AVATAR_UPLOAD_PATH);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = req.user._id + '-' + Date.now() + ext;
    cb(null, uniqueName);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB max
});

module.exports = upload;
