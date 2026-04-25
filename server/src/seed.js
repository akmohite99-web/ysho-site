// Run once: node src/seed.js
// Inserts products that don't already exist in the DB
require('dotenv').config();
const mongoose = require('mongoose');
const Product  = require('./models/Product');

const PRODUCTS = [
  {
    name: 'A2 Desi Cow Bilona Ghee',
    description: 'Pure A2 desi cow ghee made using the traditional Bilona hand-churning process. No preservatives, no additives — just golden, aromatic goodness.',
    image: '',
    variants: [
      { size: '250ml', price: 899,  isActive: true },
      { size: '500ml', price: 1599,  isActive: true },
      { size: '1000ml', price: 2899, isActive: true },
    ],
  },
  {
    name: 'Shat Dhauta Ghrita',
    description: 'Ancient Ayurvedic skin brightening cream — pure A2 ghee washed 100 times with cold water for a silky, ultra-fine formulation. 100% chemical-free.',
    image: '',
    variants: [
      { size: '50gm', price: 1299, isActive: true },
    ],
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  for (const data of PRODUCTS) {
    const exists = await Product.findOne({ name: data.name });
    if (exists) {
      console.log(`  [skip] "${data.name}" already exists`);
    } else {
      await Product.create(data);
      console.log(`  [added] "${data.name}"`);
    }
  }

  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch(err => { console.error(err); process.exit(1); });
