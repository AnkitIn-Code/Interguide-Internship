const multer = require('multer');
const path = require('path');

// Use memory storage so audio buffers are directly accessible in req.file.buffer
const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['.webm', '.mp4', '.ogg', '.wav', '.mp3', '.m4a'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext) || file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio/video files are allowed'), false);
    }
  }
});

module.exports = audioUpload;
