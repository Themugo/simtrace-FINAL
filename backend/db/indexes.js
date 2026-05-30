// Database Index Optimization
// Run this script to add recommended indexes to MongoDB collections

import mongoose from "mongoose";
import { connectDB } from "./index.js";

async function createIndexes() {
  try {
    await connectDB();
    console.log("Connected to MongoDB, creating indexes...");

    // Payment Collection Indexes
    console.log("Creating Payment indexes...");
    await mongoose.connection.db.collection("payments").createIndex({ user: 1, createdAt: -1 });
    await mongoose.connection.db.collection("payments").createIndex({ status: 1 });
    await mongoose.connection.db.collection("payments").createIndex({ reference: 1 });
    console.log("✅ Payment indexes created");

    // Ad Collection Indexes
    console.log("Creating Ad indexes...");
    await mongoose.connection.db.collection("ads").createIndex({ status: 1, placement: 1 });
    await mongoose.connection.db.collection("ads").createIndex({ advertiser: 1, status: 1 });
    await mongoose.connection.db.collection("ads").createIndex({ targetRoles: 1 });
    await mongoose.connection.db.collection("ads").createIndex({ targetPlans: 1 });
    console.log("✅ Ad indexes created");

    // TheftReport Collection Indexes
    console.log("Creating TheftReport indexes...");
    await mongoose.connection.db.collection("theftreports").createIndex({ reportedBy: 1, createdAt: -1 });
    await mongoose.connection.db.collection("theftreports").createIndex({ status: 1 });
    await mongoose.connection.db.collection("theftreports").createIndex({ createdAt: -1 });
    console.log("✅ TheftReport indexes created");

    // Subscription Collection Indexes
    console.log("Creating Subscription indexes...");
    await mongoose.connection.db.collection("subscriptions").createIndex({ status: 1, currentPeriodEnd: 1 });
    console.log("✅ Subscription indexes created");

    // Partner Collection Indexes
    console.log("Creating Partner indexes...");
    await mongoose.connection.db.collection("partners").createIndex({ status: 1, orgType: 1 });
    console.log("✅ Partner indexes created");

    console.log("\n✅ All indexes created successfully!");
    console.log("Run 'db.collection.getIndexes()' in MongoDB Atlas to verify.");
  } catch (error) {
    console.error("Error creating indexes:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

createIndexes();
