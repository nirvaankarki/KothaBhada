import fs from 'fs';
import path from 'path';
import multer from 'multer';

const uploadDir = path.resolve('uploads/models/tmp');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(String(file.originalname || '')).toLowerCase() || '.jpg';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
  },
});

const panoramaImageFileFilter = (_req, file, cb) => {
  const fileName = String(file?.originalname || '').toLowerCase();
  const mimeType = String(file?.mimetype || '').toLowerCase();

  const isValidExtension = fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png') || fileName.endsWith('.webp');
  const isValidMime = mimeType === 'image/jpeg' || mimeType === 'image/jpg' || mimeType === 'image/png' || mimeType === 'image/webp';

  if (!isValidExtension && !isValidMime) {
    cb(new Error('Only JPG, JPEG, PNG, and WEBP panorama images are allowed.'));
    return;
  }

  cb(null, true);
};

export const uploadRoomPanoramaImagesMiddleware = multer({
  storage,
  fileFilter: panoramaImageFileFilter,
  limits: {
    fileSize: 1024 * 1024 * 15,
    files: 12,
  },
});
