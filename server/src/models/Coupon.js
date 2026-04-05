const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code:            { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountPercent: { type: Number, required: true, min: 1, max: 100 },
    isActive:        { type: Boolean, default: true },
    usageLimit:      { type: Number, default: null },   // null = unlimited
    usedCount:       { type: Number, default: 0 },
    expiresAt:       { type: Date,   default: null },   // null = no expiry
  },
  { timestamps: true, collection: 'coupons' }
);

module.exports = mongoose.model('Coupon', couponSchema, 'coupons');
