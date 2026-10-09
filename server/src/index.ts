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

const app = express();

// Middlewares
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api', limiter);

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

app.use(errorHandler);

const PORT = process.env.PORT || 4000;
if (process.env.NODE_ENV !== "production") { app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); }
export default app;
