const express = require('express');
const User    = require('../models/User');
const Order   = require('../models/Order');
const Product = require('../models/Product');
const Coupon  = require('../models/Coupon');
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

// GET /api/admin/products — all products (including inactive)
router.get('/products', adminProtect, async (req, res, next) => {
  try {
    const products = await Product.find({}).sort({ createdAt: 1 });
    res.json({ success: true, products });
  } catch (err) { next(err); }
});

// POST /api/admin/products — create product
router.post('/products', adminProtect, async (req, res, next) => {
  try {
    const { name, variant, price, image } = req.body;
    if (!name || !variant || price == null) {
      return res.status(400).json({ success: false, message: 'name, variant and price are required.' });
    }
    const product = await Product.create({ name, variant, price, image });
    res.status(201).json({ success: true, product });
  } catch (err) { next(err); }
});

// PUT /api/admin/products/:id — update product
router.put('/products/:id', adminProtect, async (req, res, next) => {
  try {
    const { name, variant, price, image, isActive } = req.body;
    const update = {};
    if (name      != null) update.name     = name;
    if (variant   != null) update.variant  = variant;
    if (price     != null) update.price    = price;
    if (image     != null) update.image    = image;
    if (isActive  != null) update.isActive = isActive;

    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, product });
  } catch (err) { next(err); }
});

// DELETE /api/admin/products/:id — permanently delete
router.delete('/products/:id', adminProtect, async (req, res, next) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ── Coupon CRUD ───────────────────────────────────────────────────────────────

// GET /api/admin/coupons
router.get('/coupons', adminProtect, async (req, res, next) => {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (err) { next(err); }
});

// POST /api/admin/coupons
router.post('/coupons', adminProtect, async (req, res, next) => {
  try {
    const { code, discountPercent, usageLimit, expiresAt } = req.body;
    if (!code || !discountPercent) {
      return res.status(400).json({ success: false, message: 'Code and discountPercent are required.' });
    }
    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      discountPercent,
      usageLimit: usageLimit || null,
      expiresAt:  expiresAt  || null,
    });
    res.status(201).json({ success: true, coupon });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ success: false, message: 'Coupon code already exists.' });
    next(err);
  }
});

// PUT /api/admin/coupons/:id
router.put('/coupons/:id', adminProtect, async (req, res, next) => {
  try {
    const { discountPercent, isActive, usageLimit, expiresAt } = req.body;
    const update = {};
    if (discountPercent != null) update.discountPercent = discountPercent;
    if (isActive        != null) update.isActive        = isActive;
    if (usageLimit      != null) update.usageLimit      = usageLimit || null;
    if (expiresAt       != null) update.expiresAt       = expiresAt  || null;

    const coupon = await Coupon.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found.' });
    res.json({ success: true, coupon });
  } catch (err) { next(err); }
});

// DELETE /api/admin/coupons/:id
router.delete('/coupons/:id', adminProtect, async (req, res, next) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
