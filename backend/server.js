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

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

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
