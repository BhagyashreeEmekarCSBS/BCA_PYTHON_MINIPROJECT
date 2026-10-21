const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { sequelize, User } = require('./models');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const storeRoutes = require('./routes/stores');
const storeOwnerRoutes = require('./routes/storeOwner');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const defaultDevOrigins = [
  'http://localhost:5173',
  'http://localhost',
  'http://localhost:80',
  'http://localhost:5001',
  'http://127.0.0.1:5173',
  'http://127.0.0.1',
];

const configuredOrigins = process.env.CORS_ORIGIN && process.env.CORS_ORIGIN !== '*'
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean)
  : [];

const allowedOrigins = [...new Set([...defaultDevOrigins, ...configuredOrigins])];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile apps, curl, server-to-server) where origin is undefined
    if (!origin) {
      return callback(null, true);
    }
    const cleanOrigin = origin.replace(/\/$/, '');
    if (
      allowedOrigins.includes(cleanOrigin) ||
      cleanOrigin.startsWith('http://localhost:') ||
      cleanOrigin.startsWith('http://127.0.0.1:') ||
      cleanOrigin === 'http://localhost' ||
      cleanOrigin === 'http://127.0.0.1'
    ) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root info endpoint
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'StoreRate API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/store-owner', storeOwnerRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// Seed default admin user
const seedAdmin = async () => {
  try {
    const existingAdmin = await User.findOne({ where: { role: 'admin' } });
    if (!existingAdmin) {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@storerating.com';
      const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
      await User.create({
        name: 'System Admin',
        email: adminEmail,
        password: adminPassword,
        address: '123 Admin Street, Admin City',
        role: 'admin',
      });
      console.log(`Default admin created: ${adminEmail} / ${adminPassword}`);
    }
  } catch (error) {
    console.error('Error seeding admin:', error);
  }
};

// Start server
const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    await sequelize.sync({ alter: true });
    console.log('Database synced.');

    await seedAdmin();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
