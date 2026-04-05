const express = require('express');
const Order   = require('../models/Order');
const Coupon  = require('../models/Coupon');
const { protect } = require('../middleware/auth');

const router = express.Router();

// POST /api/orders/create  —  create order, return orderId + UPI details
router.post('/create', protect, async (req, res, next) => {
  try {
    const { items, address, couponCode } = req.body;

    if (!items?.length) {
      return res.status(400).json({ success: false, message: 'Cart is empty.' });
    }

    const originalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Apply coupon if provided
    let discountPercent = 0;
    let discountAmount  = 0;
    let appliedCode     = null;

    if (couponCode) {
      const code   = couponCode.toUpperCase().trim();
      const coupon = await Coupon.findOne({ code, isActive: true });

      if (
        coupon &&
        (!coupon.expiresAt || new Date() <= coupon.expiresAt) &&
        (coupon.usageLimit === null || coupon.usedCount < coupon.usageLimit)
      ) {
        discountPercent = coupon.discountPercent;
        discountAmount  = Math.round(originalAmount * discountPercent / 100);
        appliedCode     = code;
        // Increment usage count
        await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });
      }
    }

    const finalAmount = originalAmount - discountAmount;

    const order = await Order.create({
      userId:         req.userId,
      items,
      address,
      amount:         finalAmount,
      originalAmount,
      couponCode:     appliedCode,
      discountPercent,
      discountAmount,
      status:         'payment_pending',
    });

    res.status(201).json({
      success:         true,
      orderId:         order._id,
      amount:          finalAmount,
      originalAmount,
      discountPercent,
      discountAmount,
      couponCode:      appliedCode,
      upiId:           process.env.UPI_ID,
      upiName:         process.env.UPI_NAME || 'Ysho A2 Desi Cow Bilona Ghee',
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/orders/:id/utr  —  customer submits UTR after paying
router.post('/:id/utr', protect, async (req, res, next) => {
  try {
    const { utrNumber } = req.body;

    if (!utrNumber?.trim()) {
      return res.status(400).json({ success: false, message: 'UTR number is required.' });
    }

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId, status: 'payment_pending' },
      { utrNumber: utrNumber.trim(), status: 'pending' },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found or already processed.' });
    }

    res.status(200).json({ success: true, order });
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/my  —  current user's order history
router.get('/my', protect, async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:id  —  single order (must belong to user)
router.get('/:id', protect, async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.userId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    res.status(200).json({ success: true, order });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
