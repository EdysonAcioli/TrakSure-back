import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';

// Rate limiting
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por windowMs
  message: {
    error: 'Muitas requisições feitas a partir deste IP, tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting mais restritivo para auth
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas de login por IP
  message: {
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
  },
  skipSuccessfulRequests: true,
});

// Configuração do Helmet
export const security = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Configuração do CORS
export const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Configuração do Morgan
export const logger = morgan('combined', {
  skip: (req, res) => res.statusCode < 400 // Log apenas erros em produção
});

export const devLogger = morgan('dev'); // Para desenvolvimento