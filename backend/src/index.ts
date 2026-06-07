import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

// Fail hard on missing required env vars — do not start with insecure defaults
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET env var is required');
  process.exit(1);
}
if (process.env.NODE_ENV === 'production' && (!process.env.FRONTEND_URL || process.env.FRONTEND_URL.includes('localhost'))) {
  console.error('FATAL: FRONTEND_URL must be set to a non-localhost URL in production');
  process.exit(1);
}

import authRoutes from './routes/auth';
import materialsRoutes from './routes/materials';
import modelsRoutes from './routes/models';
import productionRoutes from './routes/production';
import stockRoutes from './routes/stock';
import employeesRoutes from './routes/employees';
import payrollRoutes from './routes/payroll';
import costsRoutes from './routes/costs';
import suppliersRoutes from './routes/suppliers';
import dashboardRoutes from './routes/dashboard';
import machinesRoutes from './routes/machines';
import lineBalanceRoutes from './routes/lineBalance';
import aiRoutes from './routes/ai';
import clientsRoutes from './routes/clients';
import clientOrdersRoutes from './routes/clientOrders';
import deliveriesRoutes from './routes/deliveries';
import invoicesRoutes from './routes/invoices';
import attendanceRoutes from './routes/attendance';
import planningRoutes from './routes/planning';
import qualityRoutes from './routes/quality';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limit authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { message: 'Trop de tentatives, réessayez dans 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limit AI endpoints (expensive Anthropic calls)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { message: 'Limite de requêtes IA atteinte, réessayez dans 1 minute' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/ai', aiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/models', modelsRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/costs', costsRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/machines', machinesRoutes);
app.use('/api/line-balance', lineBalanceRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/client-orders', clientOrdersRoutes);
app.use('/api/deliveries', deliveriesRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/planning', planningRoutes);
app.use('/api/quality', qualityRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🧵 Couture SaaS API running on port ${PORT}`);
});

export default app;
