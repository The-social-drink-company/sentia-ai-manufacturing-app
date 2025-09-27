
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

export const enterpriseSecurityMiddleware = [
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
        fontSrc: ["'self'", "fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"]
      }
    }
  }),
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODEENV = == 'production' ? 1000 : 10000,
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false
  })
];