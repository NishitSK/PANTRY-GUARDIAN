require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const inventoryRoutes = require('./routes/inventory');
const productsRoutes = require('./routes/products');
const storageMethodsRoutes = require('./routes/storage-methods');
const weatherRoutes = require('./routes/weather');
const userRoutes = require('./routes/user');
const feedbackRoutes = require('./routes/feedback');

const app = express();
const PORT = process.env.PORT || 4000;

// CORS configuration - allow multiple origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL,
  'https://pantry-guardian.vercel.app',
  'https://pantry-guardian-*.vercel.app', // Vercel preview deployments
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin matches allowed origins or Vercel preview pattern
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        // Convert wildcard pattern to regex
        const pattern = allowedOrigin.replace(/\*/g, '.*');
        return new RegExp(`^${pattern}$`).test(origin);
      }
      return allowedOrigin === origin;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Root endpoint - API info
app.get('/', (req, res) => {
  res.json({
    name: 'Pantry Guardian API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      inventory: '/api/inventory',
      products: '/api/products',
      storageMethods: '/api/storage-methods',
      weather: '/api/weather/current',
      user: '/api/user/profile',
      feedback: '/api/feedback'
    },
    documentation: 'https://github.com/NishitSK/PANTRY-GUARDIAN'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/storage-methods', storageMethodsRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/user', userRoutes);
app.use('/api/feedback', feedbackRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
