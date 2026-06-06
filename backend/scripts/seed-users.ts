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
    isDemo: false,
  },
  {
    name: 'Demo User (Partner Demo)',
    email: 'user@simtrace.site',
    password: 'User@123',
    role: 'user',
    phone: '+254700000002',
    isDemo: true,
    demoPartner: 'all',
  },
  {
    name: 'Demo Police (Partner Demo)',
    email: 'police@simtrace.site',
    password: 'Police@123',
    role: 'law_enforcement',
    phone: '+254700000003',
    isDemo: true,
    demoPartner: 'police',
  },
  {
    name: 'Demo Telecom (Partner Demo)',
    email: 'telecom@simtrace.site',
    password: 'Telecom@123',
    role: 'telecom',
    phone: '+254700000004',
    isDemo: true,
    demoPartner: 'telecom',
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
        isDemo: userData.isDemo || false,
        demoPartner: userData.demoPartner || null,
      });
      console.log(`Created user: ${userData.email} ${userData.isDemo ? '(DEMO)' : ''}`);
    }

    console.log('User seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
}

seedUsers();
