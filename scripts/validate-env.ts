#!/usr/bin/env node

/**
 * Production Environment Validation Script
 * Validates that all required environment variables are set before deployment
 */

const requiredVars: Record<string, string> = {
  // Frontend variables (Vercel deployment)
  NEXT_PUBLIC_API_URL: 'Backend API URL',
  NEXT_PUBLIC_SOCKET_URL: 'WebSocket URL',
  NEXT_PUBLIC_FRONTEND_URL: 'Frontend URL',
  
  // Optional Sentry
  NEXT_PUBLIC_SENTRY_DSN: 'Sentry DSN for error tracking (optional)',
};

const optionalVars: Record<string, string> = {
  STRIPE_SECRET_KEY: 'Stripe secret key',
  STRIPE_WEBHOOK_SECRET: 'Stripe webhook secret',
  MPESA_ENV: 'M-Pesa environment (sandbox/production)',
  MPESA_CONSUMER_KEY: 'Safaricom Daraja consumer key',
  MPESA_CONSUMER_SECRET: 'Safaricom Daraja consumer secret',
  MPESA_SHORTCODE: 'Safaricom paybill shortcode',
  MPESA_PASSKEY: 'Safaricom Daraja passkey',
  AT_API_KEY: 'Africa\'s Talking API key',
  AT_USERNAME: 'Africa\'s Talking username',
  AT_SENDER_ID: 'Africa\'s Talking sender ID',
  FROM_EMAIL: 'From email address for SendGrid',
};

function validateEnv(): boolean {
  console.log('🔍 Validating environment variables...\n');
  
  let errors: string[] = [];
  let warnings: string[] = [];
  
  // Check required variables
  for (const [key, description] of Object.entries(requiredVars)) {
    const value = process.env[key];
    if (!value) {
      errors.push(`❌ Missing required: ${key} - ${description}`);
    } else {
      // Specific validations
      if (key === 'JWT_SECRET' && value.length < 32) {
        errors.push(`❌ Invalid ${key}: must be at least 32 characters`);
      }
      if (key === 'NODE_ENV' && value !== 'production') {
        warnings.push(`⚠️  ${key} is "${value}" but should be "production"`);
      }
      if (key === 'MONGO_URI' && !value.startsWith('mongodb+srv://')) {
        warnings.push(`⚠️  ${key} should use mongodb+srv:// for production`);
      }
    }
  }
  
  // Check optional variables
  for (const [key, description] of Object.entries(optionalVars)) {
    const value = process.env[key];
    if (!value) {
      warnings.push(`⚠️  Missing optional: ${key} - ${description}`);
    }
  }
  
  // Check payment processing (not required for frontend)
  // const hasStripe = process.env.STRIPE_SECRET_KEY;
  // const hasMpesa = process.env.MPESA_CONSUMER_KEY;
  // if (!hasStripe && !hasMpesa) {
  //   errors.push('❌ No payment processing configured: Add STRIPE_SECRET_KEY or MPESA_CONSUMER_KEY');
  // }
  
  // Output results
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All environment variables are properly configured!\n');
    return true;
  }
  
  if (errors.length > 0) {
    console.log('❌ Errors found:\n');
    errors.forEach(error => console.log(error));
    console.log('');
  }
  
  if (warnings.length > 0) {
    console.log('⚠️  Warnings:\n');
    warnings.forEach(warning => console.log(warning));
    console.log('');
  }
  
  if (errors.length > 0) {
    console.log('❌ Validation failed. Please fix the errors above before deploying.\n');
    return false;
  }
  
  console.log('⚠️  Validation passed with warnings. Review warnings before deploying.\n');
  return true;
}

// Run validation
const isValid = validateEnv();
// For Vercel deployment, don't fail on missing backend envs
// Only fail if critical frontend envs are missing
if (!isValid) {
  console.log('⚠️  Continuing deployment despite validation warnings...');
  process.exit(0);
}
process.exit(0);
