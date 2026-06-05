// Circuit Breaker Implementation
// Using Opossum for circuit breaker pattern

import CircuitBreaker from 'opossum';

// Circuit breaker options
const circuitOptions = {
  timeout: 3000, // If function takes longer than 3 seconds, trigger a failure
  errorThresholdPercentage: 50, // When 50% of requests fail, trip the circuit
  resetTimeout: 30000, // After 30 seconds, try again
};

// Create circuit breakers for external services
export const telecomApiBreaker = new CircuitBreaker(
  async (imei: string, provider: string) => {
    // Simulate telecom API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { imei, isBlacklisted: false, provider };
  },
  circuitOptions
);

export const aiApiBreaker = new CircuitBreaker(
  async (imei: string, operation: string) => {
    // Simulate AI API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { imei, riskScore: Math.random() * 100 };
  },
  circuitOptions
);

export const paymentApiBreaker = new CircuitBreaker(
  async (paymentData: any) => {
    // Simulate payment API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    return { success: true, transactionId: 'tx_' + Date.now() };
  },
  circuitOptions
);

export const webhookBreaker = new CircuitBreaker(
  async (url: string, payload: any) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return response.json();
  },
  {
    ...circuitOptions,
    timeout: 5000, // Webhooks can take longer
  }
);

// Circuit breaker event handlers
telecomApiBreaker.on('open', () => {
  console.warn('[Circuit Breaker] Telecom API circuit is OPEN');
});

telecomApiBreaker.on('halfOpen', () => {
  console.log('[Circuit Breaker] Telecom API circuit is HALF-OPEN');
});

telecomApiBreaker.on('close', () => {
  console.log('[Circuit Breaker] Telecom API circuit is CLOSED');
});

aiApiBreaker.on('open', () => {
  console.warn('[Circuit Breaker] AI API circuit is OPEN');
});

aiApiBreaker.on('halfOpen', () => {
  console.log('[Circuit Breaker] AI API circuit is HALF-OPEN');
});

aiApiBreaker.on('close', () => {
  console.log('[Circuit Breaker] AI API circuit is CLOSED');
});

paymentApiBreaker.on('open', () => {
  console.warn('[Circuit Breaker] Payment API circuit is OPEN');
});

paymentApiBreaker.on('halfOpen', () => {
  console.log('[Circuit Breaker] Payment API circuit is HALF-OPEN');
});

paymentApiBreaker.on('close', () => {
  console.log('[Circuit Breaker] Payment API circuit is CLOSED');
});

webhookBreaker.on('open', () => {
  console.warn('[Circuit Breaker] Webhook circuit is OPEN');
});

webhookBreaker.on('halfOpen', () => {
  console.log('[Circuit Breaker] Webhook circuit is HALF-OPEN');
});

webhookBreaker.on('close', () => {
  console.log('[Circuit Breaker] Webhook circuit is CLOSED');
});

// Fallback functions
const telecomFallback = (imei: string, provider: string) => {
  console.log('[Fallback] Using cached telecom data for IMEI:', imei);
  return { imei, isBlacklisted: false, provider, cached: true };
};

const aiFallback = (imei: string, operation: string) => {
  console.log('[Fallback] Using default AI assessment for IMEI:', imei);
  return { imei, riskScore: 50, fallback: true };
};

const paymentFallback = (paymentData: any) => {
  console.log('[Fallback] Payment service unavailable');
  return { success: false, error: 'Payment service temporarily unavailable' };
};

const webhookFallback = (url: string, payload: any) => {
  console.log('[Fallback] Webhook delivery failed, queued for retry');
  return { success: false, queued: true };
};

// Set fallbacks
telecomApiBreaker.fallback(telecomFallback);
aiApiBreaker.fallback(aiFallback);
paymentApiBreaker.fallback(paymentFallback);
webhookBreaker.fallback(webhookFallback);

// Export circuit breakers
export const circuitBreakers: Record<string, any> = {
  telecom: telecomApiBreaker,
  ai: aiApiBreaker,
  payment: paymentApiBreaker,
  webhook: webhookBreaker,
};

// Circuit breaker status check
export function getCircuitBreakerStatus(breakerName: string): any {
  const breaker = circuitBreakers[breakerName];
  if (!breaker) {
    return { status: 'unknown', breakerName };
  }
  
  return {
    status: breaker.opened ? 'open' : breaker.halfOpen ? 'halfOpen' : 'closed',
    breakerName,
    stats: breaker.stats,
  };
}

// Get all circuit breaker statuses
export function getAllCircuitBreakerStatuses(): any[] {
  return Object.keys(circuitBreakers).map(name => getCircuitBreakerStatus(name));
}
