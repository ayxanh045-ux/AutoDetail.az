const express = require('express');
const path = require('path');
const multer = require('multer');
const { getProfile, updateProfileImage, removeProfileImage, updateProfile } = require('../controllers/profileController');

const router = express.Router();

const uploadsDir = path.join(__dirname, '../../uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '');
    const safeExt = ext || '.png';
    const name = `profile_${Date.now()}_${Math.random().toString(16).slice(2)}${safeExt}`;
    cb(null, name);
  }
});
const upload = multer({ storage });

router.get('/', getProfile);
router.put('/', updateProfile);
router.post('/image', upload.single('image'), updateProfileImage);
router.delete('/image', removeProfileImage);

module.exports = router;
