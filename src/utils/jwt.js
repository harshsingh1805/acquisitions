import logger from '#config/logger.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET =
  process.env.JWT_SECRET || 'api-secret-key-please-change-in-production';

const JWT_EXPIRES_IN = '1d'; // Token expiration time

export const jwtoken = {
  sign: payload => {
    try {
      return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    } catch (err) {
      logger.error('Error signing JWT:', err);
      throw new Error('JWT signing failed');
    }
  },

  verify: token => {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (err) {
      logger.error('Error verifying JWT:', err);
      throw new Error('JWT verification failed');
    }
  },
};
