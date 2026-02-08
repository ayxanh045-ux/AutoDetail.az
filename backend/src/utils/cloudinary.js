const { v2: cloudinary } = require('cloudinary');
const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET
} = require('../config/env');

const enabled = Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET);

if (enabled) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
  });
}

const uploadBuffer = (buffer, options = {}) => {
  if (!enabled) {
    const err = new Error('Cloudinary not configured.');
    err.status = 500;
    throw err;
  }
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'image', ...options },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

const extractPublicId = (url) => {
  if (!url || typeof url !== 'string') return null;
  const clean = url.split('?')[0];
  const match = clean.match(/\/upload\/(?:v\\d+\\/)?(.+)\\.[a-zA-Z0-9]+$/);
  return match ? match[1] : null;
};

const destroyByUrl = async (url) => {
  if (!enabled) return;
  const publicId = extractPublicId(url);
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch {
    // ignore deletion errors
  }
};

module.exports = { uploadBuffer, destroyByUrl, enabled };
