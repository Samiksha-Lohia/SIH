import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let isConnected = false;

/**
 * Connect to MongoDB. The server still boots if the DB is unavailable so that
 * health checks and static routes work; DB-backed routes will surface a 503.
 */
export async function connectDB() {
  if (!env.db.uri) {
    logger.warn('MONGODB_URI is not set. DB-backed routes will be unavailable until configured.');
    return false;
  }

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(env.db.uri, {
      serverSelectionTimeoutMS: 8000,
    });
    isConnected = true;
    logger.info('MongoDB connected');

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      logger.warn('MongoDB disconnected');
    });
    mongoose.connection.on('reconnected', () => {
      isConnected = true;
      logger.info('MongoDB reconnected');
    });

    return true;
  } catch (err) {
    isConnected = false;
    logger.error(`MongoDB connection failed: ${err.message}`);
    return false;
  }
}

export function isDBConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
  }
}
