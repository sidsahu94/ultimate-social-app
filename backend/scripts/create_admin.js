// backend/scripts/create_admin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('../models/User');

const createAdmin = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  
  const email = process.env.ADMIN_EMAIL || 'admin@socialo.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  
  // Check if exists
  let admin = await User.findOne({ email });
  if (admin) {
      console.log('Admin already exists. Updating role and password...');
      admin.role = 'admin';
      admin.isVerified = true;
      admin.password = await bcrypt.hash(password, 12);
      await admin.save();
  } else {
      console.log('Creating new Socialo admin...');
      const hashed = await bcrypt.hash(password, 12);
      admin = await User.create({
          name: 'Socialo Admin',
          username: 'admin',
          email,
          password: hashed,
          role: 'admin',
          isVerified: true
      });
  }
  
  console.log(`Admin ready.\nEmail: ${email}\nPass: ${password}`);
  process.exit();
};

createAdmin();