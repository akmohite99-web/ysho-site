const express = require('express');
const crypto  = require('crypto');
const Razorpay = require('razorpay');
const Order  = require('../models/Order');
const { protect } = require('../middleware/auth');

const router = express.Router();

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/orders/create  —  create Razorpay order + pending DB record
router.post('/create', protect, async (req, res, next) => {
  try {
    const { items, address } = req.body;

    if (!items?.length) {
      return res.status(400).json({ success: false, message: 'Cart is empty.' });
    }

    const amount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Create order on Razorpay (amount in paise)
    const rzpOrder = await razorpay.orders.create({
      amount:   amount * 100,
      currency: 'INR',
      receipt:  `rcpt_${Date.now()}`,
    });

    // Save pending order to DB
    const order = await Order.create({
      userId:          req.userId,
      items,
      address,
      amount,
      razorpayOrderId: rzpOrder.id,
      status:          'pending',
    });

    res.status(201).json({
      success: true,
      orderId:        order._id,
      razorpayOrderId: rzpOrder.id,
      amount:         rzpOrder.amount,       // paise
      currency:       rzpOrder.currency,
      keyId:          process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/orders/verify  —  verify Razorpay signature, mark order paid
router.post('/verify', protect, async (req, res, next) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    // Verify HMAC signature
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expected !== razorpaySignature) {
      await Order.findByIdAndUpdate(orderId, { status: 'failed' });
      return res.status(400).json({ success: false, message: 'Payment verification failed.' });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        razorpayPaymentId,
        razorpaySignature,
        status: 'paid',
      },
      { new: true }
    );

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
