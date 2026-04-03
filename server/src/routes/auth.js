const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { registerValidation, loginValidation, validate } = require('../validators/auth');

const router = express.Router();

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
router.post('/register', authLimiter, registerValidation, validate, async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      password: hashed,
      ...(phone ? { phone } : {}),
    });

    const token = signToken(user._id);

    res.status(201).json({ success: true, token, user });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, loginValidation, validate, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = signToken(user._id);

    res.status(200).json({ success: true, token, user });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
