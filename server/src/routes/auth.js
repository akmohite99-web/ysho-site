const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { registerValidation, loginValidation, validate } = require('../validators/auth');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../config/mailer');

const router = express.Router();

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const generateCode = () =>
  String(Math.floor(100000 + Math.random() * 900000));

// POST /api/auth/register
router.post('/register', authLimiter, registerValidation, validate, async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    const existing = await User.findOne({ email });
    if (existing && existing.isVerified) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const code   = generateCode();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (existing && !existing.isVerified) {
      // Resend fresh code to unverified account
      existing.name                  = name;
      existing.password              = hashed;
      existing.phone                 = phone || existing.phone;
      existing.verificationCode      = code;
      existing.verificationCodeExpiry = expiry;
      await existing.save();
    } else {
      await User.create({
        name, email, password: hashed,
        ...(phone ? { phone } : {}),
        verificationCode:       code,
        verificationCodeExpiry: expiry,
        isVerified:             false,
      });
    }

    await sendVerificationEmail(email, name, code);

    res.status(201).json({ success: true, message: 'Verification code sent to your email.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', authLimiter, async (req, res, next) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Email and code are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified.' });
    }
    if (user.verificationCode !== code) {
      return res.status(400).json({ success: false, message: 'Invalid verification code.' });
    }
    if (!user.verificationCodeExpiry || user.verificationCodeExpiry < new Date()) {
      return res.status(400).json({ success: false, message: 'Code has expired. Please request a new one.' });
    }

    user.isVerified             = true;
    user.verificationCode       = null;
    user.verificationCodeExpiry = null;
    await user.save();

    const token = signToken(user._id);
    res.status(200).json({ success: true, token, user });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/resend-code
router.post('/resend-code', authLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const user = await User.findOne({ email });
    if (!user)            return res.status(404).json({ success: false, message: 'Account not found.' });
    if (user.isVerified)  return res.status(400).json({ success: false, message: 'Email already verified.' });

    const code   = generateCode();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    user.verificationCode       = code;
    user.verificationCodeExpiry = expiry;
    await user.save();

    await sendVerificationEmail(email, user.name, code);

    res.status(200).json({ success: true, message: 'New verification code sent.' });
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

    if (!user.isVerified) {
      return res.status(403).json({ success: false, message: 'Please verify your email before logging in.', needsVerification: true, email });
    }

    const token = signToken(user._id);
    res.status(200).json({ success: true, token, user });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', authLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    // Always return success to avoid revealing whether account exists
    if (!user || !user.isVerified) {
      return res.status(200).json({ success: true, message: 'If this email is registered, a reset code has been sent.' });
    }

    const code   = generateCode();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.resetPasswordCode   = code;
    user.resetPasswordExpiry = expiry;
    await user.save();

    await sendPasswordResetEmail(email, user.name, code);

    res.status(200).json({ success: true, message: 'If this email is registered, a reset code has been sent.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', authLimiter, async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, code, and new password are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset code.' });
    }
    if (user.resetPasswordCode !== code) {
      return res.status(400).json({ success: false, message: 'Invalid reset code.' });
    }
    if (!user.resetPasswordExpiry || user.resetPasswordExpiry < new Date()) {
      return res.status(400).json({ success: false, message: 'Reset code has expired. Please request a new one.' });
    }

    user.password            = await bcrypt.hash(newPassword, 12);
    user.resetPasswordCode   = null;
    user.resetPasswordExpiry = null;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successfully. You can now log in.' });
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
