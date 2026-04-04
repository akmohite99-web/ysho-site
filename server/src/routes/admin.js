const express = require('express');
const User  = require('../models/User');
const Order = require('../models/Order');
const { adminProtect } = require('../middleware/adminAuth');

const router = express.Router();

// GET /api/admin/users — all registered users
router.get('/users', adminProtect, async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, users });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/orders — all orders with user info
router.get('/orders', adminProtect, async (req, res, next) => {
  try {
    const orders = await Order.find({})
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/orders/:id/status — update order status
router.patch('/orders/:id/status', adminProtect, async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'failed', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    res.status(200).json({ success: true, order });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
