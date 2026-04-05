const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema(
  {
    size:     { type: String, required: true, trim: true },  // e.g. "250ml", "500ml", "1000ml"
    price:    { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    image:    { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    variants: { type: [variantSchema], default: [] },
  },
  { timestamps: true, collection: 'products' }
);

module.exports = mongoose.model('Product', productSchema, 'products');
