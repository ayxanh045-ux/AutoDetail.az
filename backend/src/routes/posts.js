const express = require('express');
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

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } });

router.get('/', getPosts);
router.get('/:id/price-history', getPriceHistory);
router.get('/:id', getPostById);
router.put('/:id', updatePost);
router.post('/:id/images', upload.array('images', 6), addPostImages);
router.delete('/:id/images', removePostImage);
router.delete('/:id', deletePost);
router.post('/', upload.array('images', 6), createPost);

module.exports = router;
