import { connectDB, User, Subscription, Payment } from '../db/index.js';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as billingService from '../services/billing.js';

const describeMongo = process.env.MONGO_URI ? describe : describe.skip;

describeMongo('Billing Service', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGO_URI = uri;
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.STRIPE_SECRET_KEY = 'sk_test_test';
    process.env.MPESA_CONSUMER_KEY = 'test-key';
    process.env.MPESA_CONSUMER_SECRET = 'test-secret';
    await connectDB();
  });

  afterAll(async () => {
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Subscription.deleteMany({});
    await Payment.deleteMany({});
  });

  describe('Stripe Payment Creation', () => {
    it('should create Stripe payment intent', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const passwordHash = await bcrypt.hash('password123', 12);
      
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
        role: 'user',
      });

      const paymentIntent = await billingService.createStripePayment(
        user._id.toString(),
        'pro',
        1000
      );

      expect(paymentIntent).toBeDefined();
      expect(paymentIntent).toHaveProperty('id');
      expect(paymentIntent).toHaveProperty('amount', 1000);
    });

    it('should handle Stripe payment failure', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const passwordHash = await bcrypt.hash('password123', 12);
      
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
        role: 'user',
      });

      await expect(
        billingService.createStripePayment(user._id.toString(), 'invalid-plan', -100)
      ).rejects.toThrow();
    });
  });

  describe('M-Pesa STK Push', () => {
    it('should initiate M-Pesa STK push', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const passwordHash = await bcrypt.hash('password123', 12);
      
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
        role: 'user',
        phone: '+254712345678',
      });

      const stkPush = await billingService.initiateMpesaStkPush(
        user._id.toString(),
        '254712345678',
        1000,
        'Test Payment'
      );

      expect(stkPush).toBeDefined();
      expect(stkPush).toHaveProperty('MerchantRequestID');
      expect(stkPush).toHaveProperty('CheckoutRequestID');
    });

    it('should handle invalid phone number', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const passwordHash = await bcrypt.hash('password123', 12);
      
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
        role: 'user',
      });

      await expect(
        billingService.initiateMpesaStkPush(
          user._id.toString(),
          'invalid-phone',
          1000,
          'Test Payment'
        )
      ).rejects.toThrow();
    });
  });

  describe('Webhook Handling', () => {
    it('should handle Stripe webhook successfully', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const passwordHash = await bcrypt.hash('password123', 12);
      
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
        role: 'user',
      });

      await Subscription.create({
        userId: user._id,
        plan: 'pro',
        status: 'pending',
        startDate: new Date(),
      });

      const webhookPayload = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            metadata: {
              userId: user._id.toString(),
              plan: 'pro',
            },
            amount: 1000,
          },
        },
      };

      const result = await billingService.handleStripeWebhook(webhookPayload);
      expect(result).toBeDefined();
      expect(result.status).toBe('succeeded');
    });

    it('should handle M-Pesa callback successfully', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const passwordHash = await bcrypt.hash('password123', 12);
      
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
        role: 'user',
      });

      await Subscription.create({
        userId: user._id,
        plan: 'pro',
        status: 'pending',
        startDate: new Date(),
      });

      const callbackPayload = {
        Body: {
          stkCallback: {
            MerchantRequestID: 'test-merchant-id',
            CheckoutRequestID: 'test-checkout-id',
            ResultCode: 0,
            CallbackMetadata: {
              Item: [
                { Name: 'Amount', Value: 1000 },
                { Name: 'MpesaReceiptNumber', Value: 'ABC123' },
              ],
            },
          },
        },
      };

      const result = await billingService.handleMpesaCallback(callbackPayload);
      expect(result).toBeDefined();
      expect(result.status).toBe('completed');
    });
  });

  describe('Subscription Management', () => {
    it('should upgrade subscription', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const passwordHash = await bcrypt.hash('password123', 12);
      
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
        role: 'user',
      });

      await Subscription.create({
        userId: user._id,
        plan: 'free',
        status: 'active',
        startDate: new Date(),
      });

      const subscription = await billingService.upgradeSubscription(
        user._id.toString(),
        'pro'
      );

      expect(subscription).toBeDefined();
      expect(subscription.plan).toBe('pro');
      expect(subscription.status).toBe('active');
    });

    it('should downgrade subscription', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const passwordHash = await bcrypt.hash('password123', 12);
      
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
        role: 'user',
      });

      await Subscription.create({
        userId: user._id,
        plan: 'pro',
        status: 'active',
        startDate: new Date(),
      });

      const subscription = await billingService.downgradeSubscription(
        user._id.toString(),
        'free'
      );

      expect(subscription).toBeDefined();
      expect(subscription.plan).toBe('free');
      expect(subscription.status).toBe('active');
    });
  });

  describe('Invoice Generation', () => {
    it('should generate invoice for payment', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const passwordHash = await bcrypt.hash('password123', 12);
      
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
        role: 'user',
      });

      const payment = await Payment.create({
        userId: user._id,
        amount: 1000,
        currency: 'KES',
        method: 'mpesa',
        status: 'completed',
        mpesaReceipt: 'ABC123',
      });

      const invoice = await billingService.generateInvoice(payment._id.toString());
      expect(invoice).toBeDefined();
      expect(invoice).toHaveProperty('invoiceNumber');
      expect(invoice).toHaveProperty('amount', 1000);
    });

    it('should handle payment failure invoice', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const passwordHash = await bcrypt.hash('password123', 12);
      
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
        role: 'user',
      });

      const payment = await Payment.create({
        userId: user._id,
        amount: 1000,
        currency: 'KES',
        method: 'mpesa',
        status: 'failed',
      });

      await expect(
        billingService.generateInvoice(payment._id.toString())
      ).rejects.toThrow();
    });
  });

  describe('Refund Processing', () => {
    it('should process refund successfully', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const passwordHash = await bcrypt.hash('password123', 12);
      
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
        role: 'user',
      });

      const payment = await Payment.create({
        userId: user._id,
        amount: 1000,
        currency: 'KES',
        method: 'stripe',
        status: 'completed',
        stripePaymentIntentId: 'pi_test123',
      });

      const refund = await billingService.processRefund(payment._id.toString());
      expect(refund).toBeDefined();
      expect(refund.status).toBe('processing');
    });

    it('should reject refund for failed payment', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const passwordHash = await bcrypt.hash('password123', 12);
      
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash,
        role: 'user',
      });

      const payment = await Payment.create({
        userId: user._id,
        amount: 1000,
        currency: 'KES',
        method: 'stripe',
        status: 'failed',
      });

      await expect(
        billingService.processRefund(payment._id.toString())
      ).rejects.toThrow();
    });
  });
});
