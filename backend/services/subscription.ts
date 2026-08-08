// services/subscription.ts - Subscription management services
import crypto from "crypto";
import mongoose from "mongoose";
import {
  
  Device,
} from "../db/index.js";

// Get models from mongoose (they may be registered elsewhere)
const SubscriptionPlan = mongoose.models.SubscriptionPlan || mongoose.model('SubscriptionPlan', new mongoose.Schema({}, { strict: false }));
const UserSubscription = mongoose.models.UserSubscription || mongoose.model('UserSubscription', new mongoose.Schema({}, { strict: false }));
const PaymentTransaction = mongoose.models.PaymentTransaction || mongoose.model('PaymentTransaction', new mongoose.Schema({}, { strict: false }));

// ── Subscription Plan Management ───────────────────────────────────────────────────────
export async function createSubscriptionPlan(data: Record<string, unknown>) {
  const planId = `plan_${crypto.randomBytes(16).toString("hex")}`;

  const plan = await SubscriptionPlan.create({
    ...data,
    planId,
    status: "active",
  });

  return plan;
}

export async function getSubscriptionPlan(planId: string) {
  const plan = await SubscriptionPlan.findOne({ planId, status: "active" });
  if (!plan) throw new Error("Subscription plan not found");
  return plan;
}

export async function getSubscriptionPlanByType(planType: string) {
  const plan = await SubscriptionPlan.findOne({ planType, status: "active" });
  return plan;
}

export async function getAllSubscriptionPlans() {
  const plans = await SubscriptionPlan.find({ status: "active" }).sort({ price: 1 });
  return plans;
}

export async function updateSubscriptionPlan(planId: string, updates: Record<string, unknown>) {
  const plan = await SubscriptionPlan.findOneAndUpdate(
    { planId },
    {
      ...updates,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!plan) throw new Error("Subscription plan not found");
  return plan;
}

export async function deactivateSubscriptionPlan(planId: string) {
  const plan = await SubscriptionPlan.findOneAndUpdate(
    { planId },
    {
      status: "inactive",
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!plan) throw new Error("Subscription plan not found");
  return plan;
}

// ── User Subscription Management ───────────────────────────────────────────────────────
export async function createUserSubscription(data: Record<string, unknown>) {
  const subscriptionId = `sub_${crypto.randomBytes(16).toString("hex")}`;

  const subscription = await UserSubscription.create({
    ...data,
    subscriptionId,
    status: "active",
  });

  return subscription;
}

export async function getUserSubscription(subscriptionId: string) {
  const subscription = await UserSubscription.findById(subscriptionId).populate("planId");
  if (!subscription) throw new Error("User subscription not found");
  return subscription;
}

export async function getUserSubscriptionByUserId(userId: string) {
  const subscription = await UserSubscription.findOne({ userId, status: "active" }).populate("planId");
  return subscription;
}

export async function updateUserSubscription(subscriptionId: string, updates: Record<string, unknown>) {
  const subscription = await UserSubscription.findByIdAndUpdate(
    subscriptionId,
    {
      ...updates,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!subscription) throw new Error("User subscription not found");
  return subscription;
}

export async function cancelUserSubscription(subscriptionId: string) {
  const subscription = await UserSubscription.findByIdAndUpdate(
    subscriptionId,
    {
      status: "cancelled",
      cancelAtPeriodEnd: true,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!subscription) throw new Error("User subscription not found");
  return subscription;
}

export async function upgradeUserSubscription(subscriptionId: string, newPlanId: string) {
  const subscription = await UserSubscription.findByIdAndUpdate(
    subscriptionId,
    {
      planId: newPlanId,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!subscription) throw new Error("User subscription not found");
  return subscription;
}

export async function checkSubscriptionLimits(userId: string) {
  const subscription = await UserSubscription.findOne({ userId, status: "active" }).populate("planId");
  if (!subscription) {
    // Return free tier limits
    return {
      maxDevices: 1,
      maxFamilyMembers: 0,
      currentDevices: 0,
      currentFamilyMembers: 0,
      canAddDevice: true,
      canAddFamilyMember: false,
    };
  }

  const currentDevices = await Device.countDocuments({ owner: userId, status: "active" });
  const plan = subscription.planId as any;

  return {
    maxDevices: plan.maxDevices,
    maxFamilyMembers: plan.maxFamilyMembers,
    currentDevices,
    currentFamilyMembers: subscription.familyMembers,
    canAddDevice: currentDevices < plan.maxDevices,
    canAddFamilyMember: subscription.familyMembers < plan.maxFamilyMembers,
  };
}

// ── Payment Transaction Management ───────────────────────────────────────────────────────
export async function createPaymentTransaction(data: Record<string, unknown>) {
  const transactionId = `txn_${crypto.randomBytes(16).toString("hex")}`;

  const transaction = await PaymentTransaction.create({
    ...data,
    transactionId,
    status: "pending",
  });

  return transaction;
}

export async function getPaymentTransaction(transactionId: string) {
  const transaction = await PaymentTransaction.findOne({ transactionId });
  if (!transaction) throw new Error("Payment transaction not found");
  return transaction;
}

export async function updatePaymentTransaction(transactionId: string, updates: Record<string, unknown>) {
  const transaction = await PaymentTransaction.findOneAndUpdate(
    { transactionId },
    {
      ...updates,
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!transaction) throw new Error("Payment transaction not found");
  return transaction;
}

export async function completePaymentTransaction(transactionId: string) {
  const transaction = await PaymentTransaction.findOneAndUpdate(
    { transactionId },
    {
      status: "completed",
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!transaction) throw new Error("Payment transaction not found");

  // Update subscription payment history
  if (transaction.subscriptionId) {
    await UserSubscription.findByIdAndUpdate(
      transaction.subscriptionId,
      {
        $push: {
          paymentHistory: {
            paymentId: transaction.transactionId,
            amount: transaction.amount,
            currency: transaction.currency,
            status: "completed",
            paidAt: new Date(),
          },
        },
        updatedAt: new Date(),
      }
    );
  }

  return transaction;
}

export async function failPaymentTransaction(transactionId: string) {
  const transaction = await PaymentTransaction.findOneAndUpdate(
    { transactionId },
    {
      status: "failed",
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!transaction) throw new Error("Payment transaction not found");
  return transaction;
}

export async function refundPaymentTransaction(transactionId: string, refundAmount: number, refundReason: string) {
  const transaction = await PaymentTransaction.findOneAndUpdate(
    { transactionId },
    {
      status: "refunded",
      refundAmount,
      refundReason,
      refundedAt: new Date(),
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!transaction) throw new Error("Payment transaction not found");
  return transaction;
}

export async function getUserPaymentHistory(userId: string, limit = 50) {
  const transactions = await PaymentTransaction.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit);
  return transactions;
}

// ── Initialize Default Plans ─────────────────────────────────────────────────────────────
export async function initializeDefaultPlans() {
  const defaultPlans = [
    {
      planName: "Free",
      planType: "free",
      price: 0,
      currency: "USD",
      billingInterval: "monthly",
      maxDevices: 1,
      maxFamilyMembers: 0,
      featuresFlags: {
        basicTracking: true,
        realTimeTracking: false,
        panicMode: true,
        deviceLock: false,
        remoteWipe: false,
        selfieCapture: false,
        familySharing: false,
        geofencing: false,
        analytics: false,
        prioritySupport: false,
        apiAccess: false,
        customReports: false,
        insuranceDiscount: false,
      },
    },
    {
      planName: "Pro",
      planType: "pro",
      price: 9.99,
      currency: "USD",
      billingInterval: "monthly",
      maxDevices: 5,
      maxFamilyMembers: 0,
      featuresFlags: {
        basicTracking: true,
        realTimeTracking: true,
        panicMode: true,
        deviceLock: true,
        remoteWipe: false,
        selfieCapture: true,
        familySharing: false,
        geofencing: true,
        analytics: true,
        prioritySupport: false,
        apiAccess: false,
        customReports: false,
        insuranceDiscount: true,
      },
    },
    {
      planName: "Premium",
      planType: "premium",
      price: 19.99,
      currency: "USD",
      billingInterval: "monthly",
      maxDevices: 10,
      maxFamilyMembers: 5,
      featuresFlags: {
        basicTracking: true,
        realTimeTracking: true,
        panicMode: true,
        deviceLock: true,
        remoteWipe: true,
        selfieCapture: true,
        familySharing: true,
        geofencing: true,
        analytics: true,
        prioritySupport: true,
        apiAccess: true,
        customReports: true,
        insuranceDiscount: true,
      },
    },
    {
      planName: "Business",
      planType: "business",
      price: 49.99,
      currency: "USD",
      billingInterval: "monthly",
      maxDevices: 100,
      maxFamilyMembers: 20,
      featuresFlags: {
        basicTracking: true,
        realTimeTracking: true,
        panicMode: true,
        deviceLock: true,
        remoteWipe: true,
        selfieCapture: true,
        familySharing: true,
        geofencing: true,
        analytics: true,
        prioritySupport: true,
        apiAccess: true,
        customReports: true,
        insuranceDiscount: true,
      },
    },
  ];

  const createdPlans = [];
  for (const planData of defaultPlans) {
    const existing = await SubscriptionPlan.findOne({ planType: planData.planType });
    if (!existing) {
      const created = await createSubscriptionPlan(planData);
      createdPlans.push(created);
    }
  }

  return createdPlans;
}

