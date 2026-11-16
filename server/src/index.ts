import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

import { errorHandler } from './middlewares';
import authRoutes from './routes/auth';
import complaintRoutes from './routes/complaints';
import officerRoutes from './routes/officers';
import workerRoutes from './routes/workers';
import citizenRoutes from './routes/citizens';
import analyticsRoutes from './routes/analytics';
import adminRoutes from './routes/admin';
import aiRoutes from './routes/ai';
import { purgeExpiredResolvedComplaints } from './services/retention';

const app = express();

// Trust reverse proxy (Vercel edge routers) for correct IP identification in rate-limiting
app.set('trust proxy', 1);

// Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://civic-ai-2v9u.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server or requests without origin (like mobile/curl)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost')
    ) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive fallback with credentials
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Rate limit: 300 requests per 15 min window, skipping preflight OPTIONS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS' || req.path === '/api/health'
});
app.use('/api', limiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Swagger
try {
  const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (e) {
  console.log('Swagger docs not found/loaded.');
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/officers', officerRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/citizens', citizenRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);

app.use((req, res, next) => res.status(404).json({ error: 'Endpoint not found: ' + req.originalUrl }));

app.use(errorHandler);

// Run 30-day retention purge on startup
purgeExpiredResolvedComplaints().catch(() => {});

const PORT = process.env.PORT || 4000;
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
export default app;
