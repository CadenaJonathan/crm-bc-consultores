import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
}));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'CRM Microservice',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'CRM Protección Civil - Microservice',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      pdf: '/api/pdf/*',
      qr: '/api/qr/*',
      notifications: '/api/notifications/*'
    }
  });
});

// API Routes (placeholder)
app.get('/api/pdf/status', (req, res) => {
  res.json({ message: 'PDF service ready', status: 'ok' });
});

app.get('/api/qr/status', (req, res) => {
  res.json({ message: 'QR service ready', status: 'ok' });
});

app.get('/api/notifications/status', (req, res) => {
  res.json({ message: 'Notifications service ready', status: 'ok' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

app.listen(PORT, () => {
  console.log(` Microservice running on port ${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/health`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
});
