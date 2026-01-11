// backend/scripts/create_admin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('../models/User');

const createAdmin = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  
  const email = 'admin@social.app';
  const password = 'adminpassword123'; // Change this!
  
  // Check if exists
  let admin = await User.findOne({ email });
  if (admin) {
      console.log('Admin already exists. Updating role...');
      admin.role = 'admin';
      await admin.save();
  } else {
      console.log('Creating new admin...');
      const hashed = await bcrypt.hash(password, 12);
      admin = await User.create({
          name: 'Super Admin',
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