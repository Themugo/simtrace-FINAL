import mongoose from 'mongoose';

const oid = mongoose.Schema.Types.ObjectId;
const Mixed = mongoose.Schema.Types.Mixed;
const opts = { strict: false as const, timestamps: true };

const financialProjectionSchema = new mongoose.Schema({
  period: { type: String, index: true }, startDate: Date, endDate: Date,
  targetRevenue: Number, targetUsers: Number,
}, opts);
export const FinancialProjection = mongoose.models.FinancialProjection || mongoose.model('FinancialProjection', financialProjectionSchema);

const payPalPaymentSchema = new mongoose.Schema({
  user: { type: oid, ref: 'User', index: true }, paymentId: { type: String, index: true },
  amount: Number, currency: String, description: String,
  paypalOrderId: { type: String, index: true }, type: String, relatedId: String,
  status: { type: String, default: 'created', index: true },
}, opts);
export const PayPalPayment = mongoose.models.PayPalPayment || mongoose.model('PayPalPayment', payPalPaymentSchema);
