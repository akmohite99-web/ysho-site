const mongoose = require('mongoose');
const seedProducts = require('./seed');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'ysho',
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
    await seedProducts();
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { connectDB };
