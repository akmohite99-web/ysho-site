const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    name:      { type: String, required: true },
    variant:   { type: String },
    price:     { type: Number, required: true },
    quantity:  { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone:    { type: String, required: true, trim: true },
    line1:    { type: String, required: true, trim: true },
    line2:    { type: String, trim: true, default: '' },
    city:     { type: String, required: true, trim: true },
    state:    { type: String, required: true, trim: true },
    pincode:  { type: String, required: true, trim: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items:     { type: [orderItemSchema], required: true },
    address:   { type: addressSchema, required: true },
    amount:    { type: Number, required: true },   // in rupees
    utrNumber: { type: String, default: null },    // UPI transaction reference
    status:    {
      type: String,
      enum: ['pending', 'payment_pending', 'paid', 'processing', 'shipped', 'delivered', 'failed', 'cancelled'],
      default: 'payment_pending',
    },
    trackingNote: { type: String, default: '' },
  },
  { timestamps: true, collection: 'orders' }
);

module.exports = mongoose.model('Order', orderSchema, 'orders');
