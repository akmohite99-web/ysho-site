const Product = require('../models/Product');

// Seeds the initial product if the products collection is empty.
const seedProducts = async () => {
  try {
    const count = await Product.countDocuments();
    if (count > 0) return;

    await Product.create({
      name:  'Ysho A2 Desi Cow Bilona Ghee',
      image: '/src/assets/ysho-packaging-hero.png',
      isActive: true,
      variants: [
        { size: '250ml',  price: 999,  isActive: true },
        { size: '500ml',  price: 1899, isActive: true },
        { size: '1000ml', price: 3599, isActive: true },
      ],
    });

    console.log('Seeded initial product with 3 variants.');
  } catch (err) {
    console.error('Product seed error:', err.message);
  }
};

module.exports = seedProducts;
