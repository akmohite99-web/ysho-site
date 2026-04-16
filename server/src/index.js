require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const authRoutes    = require('./routes/auth');
const orderRoutes   = require('./routes/orders');
const userRoutes    = require('./routes/users');
const adminRoutes   = require('./routes/admin');
const productRoutes = require('./routes/products');
const couponRoutes  = require('./routes/coupons');
const { errorHandler } = require('./middleware/errorHandler');

connectDB();

const app = express();

// Trust nginx proxy so rate limiter reads real client IPs
app.set('trust proxy', 1);

app.use(
  cors({
    // In development allow all origins (Vite may use IPv6 [::1] or 127.0.0.1).
    // In production restrict to the configured FRONTEND_URL.
    origin: process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL
      : true,
    credentials: true,
  })
);

app.use(express.json({ limit: '10kb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth',     authRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/users',    userRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/coupons',  couponRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});
