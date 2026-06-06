import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

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
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

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

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🧵 Couture SaaS API running on port ${PORT}`);
});

export default app;
