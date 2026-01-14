import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import 'dotenv/config'


import { config, validateConfig } from './config';
import { initializeDatabase, closeDatabase } from './db';
import { swaggerSpec } from './swagger';
import { errorHandler } from './middleware/errorHandler';

// Import routes
import authRouter from './routes/auth';
import exercisesRouter from './routes/exercises';
import workoutsRouter from './routes/workouts';
import dietRouter from './routes/diet';
import foodsRouter from './routes/foods';
import recipesRouter from './routes/recipes';
import usersRouter from './routes/users';
import coachRouter from './routes/coach';
import clientRouter from './routes/client';
import checkinsRouter from './routes/checkins';
import messagesRouter from './routes/messages';
import notificationsRouter from './routes/notifications';
import favoritesRouter from './routes/favorites';
import storageRouter from './routes/storage';
import adminRouter from './routes/admin';
import emailRouter from './routes/email';
import blogRouter from './routes/blog';

const app = express();

// Validate configuration
validateConfig();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Allow localhost on any port
    if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
    
    // Allow LAN IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    if (/^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+):\d+$/.test(origin)) {
      return callback(null, true);
    }
    
    // Allow configured frontend URL
    if (origin === config.frontendUrl) return callback(null, true);
    
    // Allow Azure URLs
    if (/\.azurewebsites\.net$/.test(origin)) return callback(null, true);
    
    callback(null, true); // Allow all for now in development
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'CustomCoachPro API Documentation',
}));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/exercises', exercisesRouter);
app.use('/api/workouts', workoutsRouter);
app.use('/api/diet', dietRouter);
app.use('/api/foods', foodsRouter);
app.use('/api/recipes', recipesRouter);
app.use('/api/users', usersRouter);
app.use('/api/coach', coachRouter);
app.use('/api/client', clientRouter);
app.use('/api/checkins', checkinsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/storage', storageRouter);
app.use('/api/admin', adminRouter);
app.use('/api/email', emailRouter);
app.use('/api/blog', blogRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use(errorHandler);

// Start server
async function startServer() {
  try {

    console.log('SQL_USER:', config.database.user);
    console.log('SQL_PASSWORD exists:', !!config.database.password);

    // Initialize database connection
    await initializeDatabase();

    // Start listening
    // Listen on all interfaces (0.0.0.0) for LAN access
    const server = app.listen(Number(config.port), '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${config.port} (listening on all interfaces)`);
      console.log(`📚 API docs available at http://localhost:${config.port}/api-docs`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log('\nShutting down gracefully...');
      server.close(async () => {
        await closeDatabase();
        console.log('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
