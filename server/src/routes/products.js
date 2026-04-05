const express  = require('express');
const Product  = require('../models/Product');

const router = express.Router();

// GET /api/products  —  public, returns all active products
router.get('/', async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true }).sort({ createdAt: 1 });
    res.json({ success: true, products });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
