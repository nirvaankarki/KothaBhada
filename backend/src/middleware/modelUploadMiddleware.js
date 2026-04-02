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
    const extension = path.extname(String(file.originalname || '')).toLowerCase() || '.glb';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const fileName = String(file?.originalname || '').toLowerCase();
  const mimeType = String(file?.mimetype || '').toLowerCase();
  const isValidExtension = fileName.endsWith('.glb') || fileName.endsWith('.gltf');
  const isValidMime = mimeType.includes('gltf') || mimeType === 'application/octet-stream' || mimeType === 'model/gltf-binary';

  if (!isValidExtension && !isValidMime) {
    cb(new Error('Only .glb and .gltf 3D model files are allowed.'));
    return;
  }

  cb(null, true);
};

export const uploadRoomModelMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 512,
  },
});
