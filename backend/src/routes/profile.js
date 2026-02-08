const express = require('express');
const multer = require('multer');
const { getProfile, updateProfileImage, removeProfileImage, updateProfile } = require('../controllers/profileController');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 4 * 1024 * 1024 } });

router.get('/', getProfile);
router.put('/', updateProfile);
router.post('/image', upload.single('image'), updateProfileImage);
router.delete('/image', removeProfileImage);

module.exports = router;
