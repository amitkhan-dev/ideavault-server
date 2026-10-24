import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes.js';
import ideaRoutes from './routes/ideaRouth.js';
import { sendSuccess } from './utils/response.js';
import commentRoute from './routes/commentRoute.js';
import interactionsRouter from './routes/interactions.js';



const app = express();

// Middlewares
app.use(
  cors({
    origin: [
    'http://localhost:3000',
    'https://ideavaults.vercel.app',
  ],
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan('dev'));
app.use('/api/comments', commentRoute);
app.use('/api/interactions', interactionsRouter);
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ideas', ideaRoutes); 

// Base Health Route
app.get('/', (req, res) => {
  sendSuccess(res, 200, 'IdeaVault API Server running successfully');
});

export default app;