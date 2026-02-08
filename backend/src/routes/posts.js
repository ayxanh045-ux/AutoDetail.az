const express = require('express');
const path = require('path');
const multer = require('multer');
const {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  getPriceHistory,
  addPostImages,
  removePostImage
} = require('../controllers/postsController');

const router = express.Router();

const uploadsDir = path.join(__dirname, '../../uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '');
    const safeExt = ext || '.png';
    const name = `post_${Date.now()}_${Math.random().toString(16).slice(2)}${safeExt}`;
    cb(null, name);
  }
});
const upload = multer({ storage });

router.get('/', getPosts);
router.get('/:id/price-history', getPriceHistory);
router.get('/:id', getPostById);
router.put('/:id', updatePost);
router.post('/:id/images', upload.array('images', 6), addPostImages);
router.delete('/:id/images', removePostImage);
router.delete('/:id', deletePost);
router.post('/', upload.array('images', 6), createPost);

module.exports = router;
