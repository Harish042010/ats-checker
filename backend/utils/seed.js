const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('../config/db');
const User = require('../models/User');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const seedData = async () => {
  try {
    await connectDB();
    console.log('MongoDB connected for seeding...');

    await User.deleteMany({});

    await User.create({
      name: 'Admin User',
      email: 'admin@resumelens.ai',
      password: 'admin123456',
      role: 'admin',
      company: 'ResumeLens AI',
      jobTitle: 'System Administrator',
    });

    await User.create({
      name: 'Demo User',
      email: 'user@resumelens.ai',
      password: 'user123456',
      role: 'user',
      company: 'Tech Corp',
      jobTitle: 'Software Engineer',
    });

    console.log('Seed data created successfully');
    console.log('Admin: admin@resumelens.ai / admin123456');
    console.log('User: user@resumelens.ai / user123456');

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
