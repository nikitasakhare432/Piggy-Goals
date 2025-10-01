// server.js (ES Module)
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './server/routes/auth.js';
import bankRoutes from './server/routes/bank.js';
import jarRoutes from './server/routes/jars.js';
import transactionRoutes from './server/routes/transactions.js';
import paymentRoutes from './server/routes/payments.js';

const app = express();

// Security middleware
app.use(helmet());
const allowedOrigins = [
  'http://localhost:5173',
  'https://piggy-frontend-u5db.onrender.com'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('CORS not allowed'));
  },
  credentials: true
}));


// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/piggy-goals', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/bank', bankRoutes);
app.use('/api/jars', jarRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/payments', paymentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
