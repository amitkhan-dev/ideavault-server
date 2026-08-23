import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes.js';
import { sendSuccess } from './utils/response.js';

const app = express();

// Middlewares
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan('dev'));

// Auth Routes
app.use('/api/auth', authRoutes);

// Base Health Route
app.get('/', (req, res) => {
  sendSuccess(res, 200, ' IdeaVault API Server running successfully');
});

export default app;