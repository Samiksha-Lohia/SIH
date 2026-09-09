import multer from 'multer';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * In-memory multer config so uploads can be routed to either Cloudinary or
 * local disk by the storage service. Enforces size + type limits.
 */
const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);

const AUDIO_MIME = new Set([
  'audio/webm',
  'audio/webm;codecs=opus',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/mp3',
  'audio/mpeg',
  'audio/ogg',
  'audio/ogg;codecs=opus',
  'audio/m4a',
  'audio/x-m4a',
  'audio/mp4',
  'audio/aac',
]);

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: env.storage.maxUploadMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true);
    cb(new ApiError(400, `Unsupported file type: ${file.mimetype}`, { code: 'UNSUPPORTED_FILE_TYPE' }));
  },
});

export const audioUpload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max audio size (Groq limit is 25MB)
  fileFilter: (req, file, cb) => {
    // Some browsers send audio/webm without exact sub-codecs or generic octet-stream with .webm
    const isAudio =
      AUDIO_MIME.has(file.mimetype) ||
      file.mimetype.startsWith('audio/') ||
      /\.(webm|wav|mp3|ogg|m4a|mp4|aac)$/i.test(file.originalname);
    if (isAudio) return cb(null, true);
    cb(new ApiError(400, `Unsupported audio type: ${file.mimetype}`, { code: 'UNSUPPORTED_AUDIO_TYPE' }));
  },
});

export default upload;
