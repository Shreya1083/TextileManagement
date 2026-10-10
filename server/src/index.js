import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { testConnection } from './config/database.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import {
  securityHeaders,
  correlationId,
  requestLogger,
  sanitizeInput,
  apiLimiter,
  speedLimiter,
  bruteForceProtection,
} from './middleware/security.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware (apply early)
app.use(securityHeaders);
app.use(correlationId);
app.use(bruteForceProtection);
app.use(apiLimiter);
app.use(speedLimiter);

// Trust proxy (for IP addresses when behind reverse proxy)
app.set('trust proxy', 1);

// Enhanced CORS with security
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.CLIENT_URL || 'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
    ];
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  maxAge: 86400, // 24 hours
}));

// Body parsing with size limits
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for webhook verification if needed
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization
app.use(sanitizeInput);

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Everest Textile Mills ERP API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API root
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Welcome to Everest Textile Mills ERP API',
    version: '1.0.0',
    docs: '/api/docs'
  });
});

// Import route modules
import authRoutes from './routes/auth.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import productionRoutes from './routes/production.routes.js';
import qualityRoutes from './routes/quality.routes.js';
import dispatchRoutes from './routes/dispatch.routes.js';
import hrRoutes from './routes/hr.routes.js';
import financeRoutes from './routes/finance.routes.js';
import qrRoutes from './routes/qr.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/quality', qualityRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationsRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server and test database connection
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    app.listen(PORT, () => {
      console.log('\n🎉 ========================================');
      console.log('   Everest Textile Mills ERP Server');
      console.log('========================================\n');
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`📍 API endpoint: http://localhost:${PORT}/api`);
      console.log(`🏭 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`\n⏰ Started at: ${new Date().toLocaleString()}\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
