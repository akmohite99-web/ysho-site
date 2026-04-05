const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    variant:  { type: String, required: true, trim: true },
    price:    { type: Number, required: true, min: 0 },
    image:    { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'products' }
);

module.exports = mongoose.model('Product', productSchema, 'products');
