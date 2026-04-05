const express = require('express');
const Coupon  = require('../models/Coupon');
const { protect } = require('../middleware/auth');

const router = express.Router();

// POST /api/coupons/validate  —  customer validates a coupon code
router.post('/validate', protect, async (req, res, next) => {
  try {
    const code = (req.body.code || '').toUpperCase().trim();
    if (!code) return res.status(400).json({ success: false, message: 'Coupon code is required.' });

    const coupon = await Coupon.findOne({ code });

    if (!coupon || !coupon.isActive) {
      return res.status(404).json({ success: false, message: 'Invalid or expired coupon code.' });
    }
    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return res.status(400).json({ success: false, message: 'This coupon has expired.' });
    }
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'This coupon has reached its usage limit.' });
    }

    res.json({ success: true, discountPercent: coupon.discountPercent, code: coupon.code });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
