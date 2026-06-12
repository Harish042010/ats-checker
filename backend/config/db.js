const dns = require('dns');
const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.warn('MongoDB URI not set. Database-backed features are disabled.');
    return null;
  }

  try {
    // Ensure Node resolves MongoDB Atlas SRV records reliably on Windows/local DNS setups.
    dns.setServers(['1.1.1.1', '8.8.8.8']);

    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`MongoDB connection failed: ${error.message}`);
    console.warn('Continuing in local ATS checker mode. Login, saved reports, and dashboard data require MongoDB.');
    return null;
  }
};

module.exports = connectDB;
