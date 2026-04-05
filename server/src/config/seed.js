const Product = require('../models/Product');

// Seeds the initial product if the products collection is empty.
const seedProducts = async () => {
  try {
    const count = await Product.countDocuments();
    if (count > 0) return;

    await Product.create({
      name:     'Ysho A2 Desi Cow Bilona Ghee',
      variant:  '500ml (450g)',
      price:    1899,
      image:    '/src/assets/ysho-packaging-hero.png',
      isActive: true,
    });

    console.log('Seeded initial product.');
  } catch (err) {
    console.error('Product seed error:', err.message);
  }
};

module.exports = seedProducts;
