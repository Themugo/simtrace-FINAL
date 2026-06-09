// scripts/seed-users.ts - Seed test users for live testing
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../db/index.js';

const users = [
  {
    name: 'Admin User',
    email: 'admin@simtrace.site',
    password: 'Admin@123',
    role: 'admin',
    phone: '+254700000001',
  },
  {
    name: 'Regular User',
    email: 'user@simtrace.site',
    password: 'User@123',
    role: 'user',
    phone: '+254700000002',
  },
  {
    name: 'Police Officer',
    email: 'police@simtrace.site',
    password: 'Police@123',
    role: 'law_enforcement',
    phone: '+254700000003',
  },
  {
    name: 'Telecom Admin',
    email: 'telecom@simtrace.site',
    password: 'Telecom@123',
    role: 'telecom',
    phone: '+254700000004',
  },
];

async function seedUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/simtrace');
    console.log('Connected to MongoDB');

    for (const userData of users) {
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`User ${userData.email} already exists, skipping...`);
        continue;
      }

      const passwordHash = await bcrypt.hash(userData.password, 12);
      const user = await User.create({
        ...userData,
        passwordHash,
        emailVerified: true,
        phoneVerified: true,
      });
      console.log(`Created user: ${userData.email}`);
    }

    console.log('User seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
}

seedUsers();
