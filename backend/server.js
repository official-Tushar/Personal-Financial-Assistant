import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDB } from './src/config/db.js';
import authRoutes from './src/routes/auth.js';
import transactionRoutes from './src/routes/transactions.js';
import reportRoutes from './src/routes/reports.js';
import receiptRoutes from './src/routes/receipts.js';
import { notFound, errorHandler } from './src/middleware/errorHandler.js';

dotenv.config();

const app = express();

// Database connection
await connectDB();

// CORS configuration
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

// Middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/receipts', receiptRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
