import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

/**
 * Provider-agnostic object storage. Uses Cloudinary when configured, otherwise
 * writes to local disk under env.storage.localDir (served at /uploads). This
 * keeps file features fully functional without any external keys.
 */

let cloudinaryClient = null;

async function getCloudinary() {
  if (!env.storage.cloudinaryEnabled) return null;
  if (cloudinaryClient) return cloudinaryClient;
  try {
    const mod = await import('cloudinary');
    const cloudinary = mod.v2;
    cloudinary.config({
      cloud_name: env.storage.cloudName,
      api_key: env.storage.apiKey,
      api_secret: env.storage.apiSecret,
    });
    cloudinaryClient = cloudinary;
    return cloudinary;
  } catch (err) {
    logger.warn(`Cloudinary init failed, using local storage: ${err.message}`);
    return null;
  }
}

function safeName(originalname = 'file') {
  const ext = path.extname(originalname).slice(0, 12);
  const base = path
    .basename(originalname, path.extname(originalname))
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 60);
  const rand = crypto.randomBytes(6).toString('hex');
  return `${Date.now()}_${rand}_${base}${ext}`;
}

function uploadToCloudinary(cloudinary, buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `sutra/${folder}`, resource_type: 'auto' },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

export const storageService = {
  get provider() {
    return env.storage.cloudinaryEnabled ? 'cloudinary' : 'local';
  },

  /**
   * Persist a file buffer. Returns { url, key, provider, size }.
   */
  async putObject({ buffer, originalname, mimetype, folder = 'general' }) {
    const cloudinary = await getCloudinary();
    if (cloudinary) {
      const result = await uploadToCloudinary(cloudinary, buffer, folder);
      return {
        url: result.secure_url,
        key: result.public_id,
        provider: 'cloudinary',
        size: result.bytes,
        mimeType: mimetype,
      };
    }

    // Local disk fallback.
    const dir = path.join(process.cwd(), env.storage.localDir, folder);
    await fs.mkdir(dir, { recursive: true });
    const filename = safeName(originalname);
    const filePath = path.join(dir, filename);
    await fs.writeFile(filePath, buffer);
    return {
      url: `/uploads/${folder}/${filename}`,
      key: path.posix.join(folder, filename),
      provider: 'local',
      size: buffer.length,
      mimeType: mimetype,
    };
  },

  /**
   * Remove a previously stored object. Non-fatal on failure.
   */
  async removeObject(key, provider) {
    try {
      if (provider === 'cloudinary') {
        const cloudinary = await getCloudinary();
        if (cloudinary) await cloudinary.uploader.destroy(key, { resource_type: 'auto' });
        return;
      }
      const filePath = path.join(process.cwd(), env.storage.localDir, key);
      await fs.unlink(filePath).catch(() => {});
    } catch (err) {
      logger.warn(`Failed to remove object ${key}: ${err.message}`);
    }
  },
};

export default storageService;
