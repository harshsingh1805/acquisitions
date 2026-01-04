import aj from '#config/arcjet.js';
import logger from '#config/logger.js';
import { slidingWindow } from '@arcjet/node';

const securityMiddleware = async (req, res, next) => {
  try {
    const role = req.user?.role || 'guest';

    let limit;
    let message;

    switch (role) {
      case 'admin':
        limit = 20;
        message = 'Admin access exceeded 20 limits.';

        break;

      case 'user':
        limit = 10;
        message = 'User access exceeded 10 limits.';

        break;

      case 'guest':
        limit = 5;
        message = 'Guest access exceeded 5 limits.';
        break;
    }

    //make arcjet client

    const client = aj.withRule(
      slidingWindow({
        mode: 'LIVE',
        interval: '1m',
        max: limit,
        name: `${role}-rate-limit`,
      })
    );

    const decision = await client.protect(req);

    if (decision.isDenied() && decision.reason.isBot()) {
      logger.warn('Blocked bot request from', {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent'),
      });
      return res
        .status(403)
        .json({ error: 'Forbidden', message: 'Access denied for bots' });
    }

    if (decision.isDenied() && decision.reason.isShield()) {
      logger.warn('Blocked shield request from', {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent'),
        method: req.method,
      });
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied due to security policy',
      });
    }

    if (decision.isDenied() && decision.reason.isRateLimit()) {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent'),
      });
      return res.status(403).json({ error: 'Forbidden', message });
    }

    next();
  } catch (e) {
    console.error('Security Middleware Error:', e);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Something went wrong in security middleware',
    });
  }
};

export default securityMiddleware;
